'use strict';
const electron = require('electron'),
    app = electron.app,
    BrowserWindow = electron.BrowserWindow,
    ipc = electron.ipcMain,
    autoUpdater = electron.autoUpdater,
    dialog = electron.dialog,
    fs = require('fs'),
    path = require('path'),
    jsonfile = require('jsonfile'),
    moment = require('moment'),
    spawn = require('child_process').spawn,
    robot = require("robotjs");


//Squirrel Auto Update Handlers


var target = path.basename(process.execPath);
function run(args, done) {
    let updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
    console.log('Spawning `%s` with args `%s`', updateExe, args);
    spawn(updateExe, args, {
        detached: true
    }).on('close', done);
}

function handleStartupEvent() {
    if (process.platform !== 'win32') {
        return false;
    }
    var squirrelCommand = process.argv[1];
    switch (squirrelCommand) {
        case '--squirrel-install':
        case '--squirrel-updated':
            run(['--createShortcut=' + target, '--shortcut-locations=Desktop,StartMenu'], () => {
                app.quit();
            });
            return true;
        case '--squirrel-uninstall':
            run(['--removeShortcut=' + target, '--shortcut-locations=Desktop,StartMenu'], () => {
                app.quit();
            });
            return true;
        case '--squirrel-obsolete':
            app.quit();
            return true;
    }
}

if (handleStartupEvent()) {
    return;
}


//Force Single Instance


var shouldQuit = app.makeSingleInstance(() => {
    if (mainWindow) { //Restore and focus window if instance exists on load
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

if (shouldQuit) { //Application is already running
    app.quit();
    return;
}


//Application Init


var mainWindow, //Main application window
    errorWindow, //Config load error window
    portWindow, //Config load error window
    config, //Main settings object
    forceQuit; //Bool to force quit app from tray

app.setAppUserModelId('com.squirrel.ControlCast.ControlCast');
jsonfile.spaces = 2; //Set the indentation for saving json files
const configFile = path.normalize("../config.json"); //Set config file path
robot.setKeyboardDelay(50);

global.app_version = app.getVersion(); //Store app version for in app displays
global.release_url = require('./package.json').releaseUrl; //Store releaseUrl for update queries

app.on('window-all-closed', () => { // Quit when all windows are closed.
    if (process.platform != 'darwin') app.quit();
});

app.on('ready', () => { // Application has finished loading
    fs.exists(configFile, exist => { //Check if config files already exists
        if (!exist) { //config.json does not exist
            config = getDefaultConfig(); //Get config defaults
            saveConfig(); //Save config file
            createMainWindow(); //Load Main Window
        } else { //config.json files already exists
            jsonfile.readFile(configFile, (err, data) => { //Try to load config.json
                if (err) { //There was an error reading the config file
                    createErrorWindow(); //Load Error Window
                } else { //Config loaded OK
                    config = data; //Store loaded data
                    checkConfigVer(); //Update config version if needed
                    createMainWindow(); //Show Main Window
                }
            });
        }
    });
});

function getDefaultConfig() { //Returns the default config object
    return {
        app: {
            version: 2,
            pos: {
                x: null,
                y: null
            },
            close_to_tray: false,
            auto_start: false,
            clr: {
                enabled: false,
                port: 3000
            }
        },
        keys: {}
    }
}


//Main Application Window


function createMainWindow() { //Loads main application window
    mainWindow = new BrowserWindow({ //Main window options
        x: config.app.pos.x,
        y: config.app.pos.y,
        width: 900,
        height: 760,
        resizable: false,
        icon: path.join(__dirname, 'images/icon.ico'),
        title: "ControlCast - " + global.app_version
    });

    mainWindow.on('closed', () => { //Destroy window object on close
        mainWindow = null;
    });

    mainWindow.on('close', (e) => { //App is about to close
        if (config.app.close_to_tray && !forceQuit) { //Minimize on close if Close To Tray and not force quit
            mainWindow.setSkipTaskbar(true); //Hide Taskbar Icon
            mainWindow.minimize(); //Minimize main window
            e.preventDefault(); //Cancel close process
            return;
        }
        sendMessageToMain('all_dark'); //Tell the launchpad to turn off all lights before we close
        let pos = mainWindow.getPosition(); //Save last position of the window for next time the app is run
        config.app.pos.x = pos[0];
        config.app.pos.y = pos[1];
        saveConfig(); //Save config to disk
    });

    mainWindow.webContents.on('dom-ready', event => { //The window elements have all loaded
        event.sender.send('config', config); //Send the config object over ASAP
    });

    mainWindow.setMenu(null); //Disable the default app menu
    mainWindow.loadURL('file://' + path.join(__dirname, '/index.html')); //Display the main window html
}


//Config Error Window


function createErrorWindow() { //Error window to tell us if there was an error loading the config.json file on load
    errorWindow = new BrowserWindow({
        width: 420,
        height: 230,
        resizable: false,
        icon: path.join(__dirname, 'images/icon.ico')
    });

    errorWindow.setMenu(null); //Disable the default menu
    errorWindow.loadURL('file://' + path.join(__dirname, '/error.html')); //Display the error window html

    errorWindow.on('closed', () => { //Destroy window object on close
        errorWindow = null;
    });

    ipc.once('reset_config', () => { //The user has decided to reset the config file
        errorWindow.hide(); //Hide the error window
        config = getDefaultConfig(); //Save defaults to config
        let oldPath = path.parse(configFile); //Parse old file path
        let newPath = path.normalize(oldPath.dir + "/" + //Create new filename with appended datetime
            oldPath.name + ".bak-" + moment().format('YYYYMMDDHHmmss') + oldPath.ext);
        fs.rename(configFile, newPath, (err) => { //Backup the old config.json file
            if (!err) { //Rename OK
                saveConfig(); //Save config file
                createMainWindow(); //Show Main Window
                errorWindow.close(); //Close the error window out after the main window loads
            } else { //There was an error renaming the config.json file. Permissions issue?
                console.log("config.json rename error: " + JSON.stringify(err));
                dialog.showErrorBox("ControlCast Error", "There seems to be an error accessing the config file.\n" +
                    "Please check that permissions are setup correctly for the application directory.\n\nPlease contact db@dbkynd.com if the issue persists.");
                app.quit(); // Exit the app gracefully
            }
        });
    });
}

function createPortWindow() { //Error window to tell us if there was an error loading the config.json file on load
    let pos = mainWindow.getPosition(); //Get main window position
    let size = mainWindow.getSize(); //Get main window size
    let x = Math.floor(((size[0] - 320) / 2) + pos[0]); //Determine x pos to center port window
    let y = Math.floor((size[1] - 180) / 2 + pos[1]); //Determine y pos to center port window

    portWindow = new BrowserWindow({
        x: x,
        y: y,
        width: 320,
        height: 180,
        resizable: false,
        icon: path.join(__dirname, 'images/icon.ico')
    });

    portWindow.setMenu(null); //Disable the default menu
    portWindow.loadURL('file://' + path.join(__dirname, '/port.html')); //Display the port window html

    portWindow.on('closed', () => { //Destroy window object on close
        portWindow = null;
    });
}

function saveConfig(callback) { //Save the config to disk
    jsonfile.writeFile(configFile, config, (err) => {
        if (callback) callback(err);
    });
}

ipc.on('app_quit', () => { //Quit message
    app.quit(); //Exit the app gracefully
});

function sendMessageToMain(message, data) { //Sends a message to the mainWindow, if available
    if (mainWindow) mainWindow.webContents.send(message, data);
}

ipc.on('get_config', (e) => { //Config changes were discarded
    e.sender.send('config', config); //Send unchanged config object
});

ipc.on('save_config', (e, data) => { //The changed config has been sent back for us to save
    if (!data) return;
    config = data; //Save data to config object
    saveConfig((err) => { //Save to disk and callback
        e.sender.send('save_config_callback', err); //Send back error or null
    });
});

ipc.on('close_to_tray', (e, data) => {
    config.app.close_to_tray = data; //Set close to tray option only
    saveConfig();
});

ipc.on('force_quit', () => {
    forceQuit = true; //Quit selected from tray menu, force close the app
    app.quit();
});

ipc.on('restore_main', () => { //From tray icon
    if (mainWindow) {
        mainWindow.setSkipTaskbar(false); //Show Taskbar Icon
        mainWindow.restore(); //Restore main window
    }
});

ipc.on('toggle_minimize', () => { //From tray icon
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.setSkipTaskbar(false); //Show Taskbar Icon
            mainWindow.restore(); //Restore main window
        } else {
            mainWindow.minimize(); //Minimize main window
        }
    }
});

ipc.on('windows_auto_start', (e, data) => {
    config.app.auto_start = data; //Set single option
    saveConfig();
    if (data) {
        run(['--createShortcut=' + target, '--shortcut-locations=Startup'], () => {
        });
    } else {
        run(['--removeShortcut=' + target, '--shortcut-locations=Startup'], () => {
        });
    }
});

ipc.on('quit_and_install', () => {
    forceQuit = true;
    autoUpdater.quitAndInstall();
});

ipc.on('clr_enabled', (e, data) => {
    config.app.clr.enabled = data; //Set single option
    saveConfig();
});

ipc.on('change_port', () => {
    createPortWindow();
});

ipc.on('get_port', (e) => {
    e.sender.send('port', config.app.clr.port || 3000);
});

ipc.on('port_quit', () => {
    portWindow.close();
});

ipc.on('set_port', (e, data) => {
    portWindow.close();
    sendMessageToMain('update_port', data);
    config.app.clr.port = data; //Set single option
    saveConfig();
});

ipc.on('send_key', (e, data) => {
    try {
        robot.keyToggle(data.key, data.action);
    } catch(e) {
        console.log("robot error: ", e.message);
    }
});

ipc.on('reset_position', () => {
    if (mainWindow) {
        mainWindow.setSkipTaskbar(false); //Show Taskbar Icon
        mainWindow.restore(); //Restore main window
        mainWindow.setPosition(0,0); //Move to main screen, 0,0
    }
});

function checkConfigVer() {
    let latest_ver = getDefaultConfig().app.version;
    while (latest_ver != config.app.version) {
        switch (config.app.version) {
            case undefined:
            case null:
            case 1:
                config.app.clr = {
                    enabled: false,
                    port: 3000
                };
                for (let key in config.keys) {
                    if (config.keys.hasOwnProperty(key)) {
                        if (config.keys[key].audio.on_release == 'stop') {
                            config.keys[key].audio.type = 'hold';
                        } else {
                            if (config.keys[key].audio.on_repress == 'none') {
                                config.keys[key].audio.type = 'normal';
                            } else if (config.keys[key].audio.on_repress == 'restart') {
                                config.keys[key].audio.type = 'restart';
                            } else if (config.keys[key].audio.on_repress == 'stop') {
                                config.keys[key].audio.type = 'toggle';
                            }
                        }
                        delete config.keys[key].audio.on_release;
                        delete config.keys[key].audio.on_repress;
                        config.keys[key].audio.volume = config.keys[key].audio.volume.toString();
                        config.keys[key].clr = {
                            path: "",
                            pos: "",
                            animate: {
                                open: {
                                    delay: "0.0",
                                    type: "fadeIn",
                                    duration: "1.0"
                                },
                                close: {
                                    delay: "2.0",
                                    type: "fadeOut",
                                    duration: "1.0"
                                }
                            },
                            css: ".img {\n  width: 50%;\n}"
                        };
                    }
                }
                config.app.version = 2;
                break;
        }
    }
    saveConfig();
}
