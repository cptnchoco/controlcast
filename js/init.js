'use strict';

const remote = require('electron').remote,
    Menu = remote.Menu,
    MenuItem = remote.MenuItem,
    dialog = remote.dialog,
    Tray = remote.Tray,
    autoUpdater = remote.autoUpdater,
    path = require('path'),
    ipc = require('electron').ipcRenderer,
    $ = require('jquery'),
    midi = require('midi'),
    usbDetect = require('usb-detection'),
    launchpadder = require('launchpadder').Launchpad,
    color = require('launchpadder').Color,
    _ = require('underscore'),
    noty = require('noty'),
    keycode = require('keycode'),
    kbm = require("kbm-robot"),
    fs = require('fs'),
    request = require('request');

require('jquery-ui');

var config, //Holds all the app and key settings
    launchpad, //Our launchpadder instance
    usbConnected, //Bool for Launchpad USB state
    reconnectTimer, //Reconnection timer
    lastKey = [0, 0], //Stores the last key pressed
    tracks = {}, //Holds all the audio tracks in memory to be played
    notyUpdates,
    keyboard = [];

kbm.startJar(); //Startup the kbm robot jar
var app_version = remote.getGlobal('app_version');

ipc.on('config', (e, data) => { //Sent from main app on DOM ready. Sends the current config
    config = data; //Save config object
    setAllLights(); //Set all gui and midi lights to released state
    setKeyOptions(); //Set all key configs
    loadTracks(); //Load audio tracks into memory to be played immediately on demand
    if (titleMenu) {
        titleMenu.items[1].submenu.items[0].checked = config.app.close_to_tray;
        titleMenu.items[1].submenu.items[1].checked = config.app.auto_start;
    } //Set title menu checkbox
});

$(document).ready(function () { //On DOM ready
    isMidiConnected(); //Set midi_connected on load

    for (let c = 0; c < 8; c++) { //Creates the top row key divs
        let newDiv = document.createElement("div");
        newDiv.setAttribute('class', "key round OFF");
        newDiv.setAttribute('data-pos', c + ",8");
        newDiv.setAttribute('data-color', "OFF");
        $('.launchpad .keys_top').append(newDiv);
    }
    for (let c = 0; c < 8; c++) {
        for (let r = 0; r < 8; r++) { //Creates the main key grid divs
            let newDiv = document.createElement("div");
            newDiv.setAttribute('class', "key square OFF");
            newDiv.setAttribute('data-pos', r + ',' + c);
            newDiv.setAttribute('data-color', "OFF");
            $('.launchpad .keys_main').append(newDiv);
        }
    }
    for (let r = 0; r < 8; r++) { //Creates the side key divs
        let newDiv = document.createElement("div");
        newDiv.setAttribute('class', "key round OFF");
        newDiv.setAttribute('data-pos', "8," + r);
        newDiv.setAttribute('data-color', "OFF");
        $('.launchpad .keys_side').append(newDiv);
    }

    $('#update_available').click(function () {
        ipc.send('quit_and_install');
    });
});

function get(obj, key) { //Search and return a nested element in an object or null
    return key.split(".").reduce(function (o, x) {
        return (typeof o == "undefined" || o === null) ? o : o[x];
    }, obj);
}

function connectToLaunchpad() { //Attempt to connect to the Launchpad Mini
    let midiIn = new midi.input(); //Create new Midi input
    let midiOut = new midi.output(); //Create new Midi output
    let midiInCount = midiIn.getPortCount(); //Gets the number of Midi input ports connected
    let midiOutCount = midiOut.getPortCount(); //Gets the number of Midi output ports connected
    if (midiInCount <= 0 || midiOutCount <= 0) return console.log("No Midi devices found. Have you plugged the Launchpad Mini in yet?");
    let midiInPort;
    let midiOutPort;
    for (let i = 0; i < midiInCount; i++) { //Loop through Midi input ports
        if (midiIn.getPortName(i).toLowerCase().indexOf("launchpad mini") != -1) {
            midiInPort = i; //Save index of Launchpad input port if found
        }
    }
    for (let i = 0; i < midiOutCount; i++) { //Loop through Midi output ports
        if (midiOut.getPortName(i).toLowerCase().indexOf("launchpad mini") != -1) {
            midiOutPort = i; //Save index of Launchpad output port if found
        }
    }
    if (!midiInPort && !midiOutPort) return console.log("Launchpad Mini not found. Is it unplugged?");
    launchpad = new launchpadder(midiInPort, midiOutPort); //Connect to launchpad
    if (launchpad) {
        console.log("Launchpad connection successful");
        isMidiConnected(); //Set midi_connected

        launchpad.on("press", button => { //Create the midi button press handler
            keyEvent('midi', [button.x, button.y], 'press'); //Pass to key event handler
        });

        launchpad.on("release", button => { //Create midi button release handler
            keyEvent('midi', [button.x, button.y], 'release'); //Pass to key event handler
        });
    } else {
        console.log("Unable to connect to the Launchpad Mini");
    }
}

usbDetect.on('add', device => {
    if (device.deviceName.toLowerCase() == "launchpad mini") { //Launchpad USB was inserted
        console.log('Launchpad USB detected. Connecting in 4 seconds');
        if (!usbConnected) { //This stops the random occurrence of the add event firing twice rapidly
            usbConnected = true;
            reconnectTimer = setTimeout(() => {
                connectToLaunchpad();
                setAllLights();
            }, 4000); //Wait 4 seconds for the Launchpad init to finish before attempting to connect.
        }
    }
});

usbDetect.on('remove', device => {
    if (device.deviceName.toLowerCase() == "launchpad mini") { //Launchpad USB was removed
        console.log("Launchpad USB disconnected");
        if (reconnectTimer) clearTimeout(reconnectTimer); //Stop reconnect timer if it was started
        usbConnected = false;
        launchpad = null;
        isMidiConnected(); //Set midi_connected
    }
});

connectToLaunchpad(); //Connect on startup

function isMidiConnected() {
    if (launchpad) { //Set the midi_connected color based on if launchpad is connected
        $('.midi_connected').addClass('connected');
    } else {
        $('.midi_connected').removeClass('connected');
    }
}

function loadTracks() { //Load track data to array
    for (let key in config.keys) { //Loop through keys
        if (config.keys.hasOwnProperty(key)) {
            let audio = config.keys[key].audio; //Get key audio settings
            if (!audio.path) continue; //Return if no audio is set
            let localPath = "file:///" + audio.path.replace(/\\/g, "/").replace(/ /g, "%20"); //Convert to local format
            if (!tracks[key] || (tracks[key].src != audio.path && tracks[key].src != localPath)) {
                tracks[key] = new Audio(audio.path);
            }
            tracks[key].volume = audio.volume / 100;
        }
    }
}

autoUpdater.setFeedURL('https://s3-us-west-2.amazonaws.com/controlcast');
setInterval(() => {
    checkForUpdates();
}, 1000 * 60 * 15);

function checkForUpdates() {
    try {
        autoUpdater.checkForUpdates();
    } catch (e) {
        console.log('Unable to run auto updater.\n', e.message, "\nLikely in build environment");
    }
}

autoUpdater.on('error', (err) => {
    console.log('Squirrel error: ' + JSON.stringify(err));
});

autoUpdater.on('checking-for-update', () => {
    console.log('Squirrel: checking-for-update');
});

autoUpdater.on('update-available', () => {
    console.log('Squirrel: update-available');
    if (notyUpdates) {
        notyUpdates = false;
        centerNOTY('notification', "Updates available, Downloading...", 3000);
    }
});

autoUpdater.on('update-not-available', () => {
    console.log('Squirrel: update-not-available');
    if (notyUpdates) {
        notyUpdates = false;
        centerNOTY('notification', "There are no updates available.");
    }
});

autoUpdater.on('update-downloaded', () => {
    console.log('Squirrel: update-downloaded');
    $('#update_available').show();
});
