'use strict';

var titleMenu = Menu.buildFromTemplate([
    {
        label: 'View',
        submenu: [
            {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click: function (item, focusedWindow) {
                    if (focusedWindow)
                        if (tray) tray.destroy();
                    focusedWindow.reload(); //Reload the main window and it's elements
                }
            },
            {
                label: 'Toggle Dev Tools',
                accelerator: (function () {
                    if (process.platform == 'darwin')
                        return 'Alt+Command+I';
                    else
                        return 'Ctrl+Shift+I';
                })(),
                click: function (item, focusedWindow) {
                    if (focusedWindow)
                        focusedWindow.toggleDevTools();
                }
            }
        ]
    },
    {
        label: 'Settings',
        submenu: [
            {
                label: 'Close to Tray',
                type: 'checkbox',
                click: (e) => {
                    config.app.close_to_tray = e.checked; //Store and save close to tray to config here and main app config
                    ipc.send('close_to_tray', e.checked, true);
                }
            }
        ]
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'View on GitHub',
                click: () => { //Open client browser to Github
                    require('electron').shell.openExternal('https://github.com/dbkynd/controlcast')
                }
            },
            {
                label: 'Change Log',
                click: () => {
                    require('electron').shell.openExternal('https://github.com/dbkynd/controlcast/blob/master/changelog.md')
                }
            },
            {
                label: 'About',
                click: () => {
                    dialog.showMessageBox({ //Show message box with detail about the application
                        type: 'info',
                        buttons: [
                            "ok"
                        ],
                        title: 'About ControlCast',
                        message: "'ControlCast' by DBKynd\nVersion: " + app_version +
                        "\ndb@dbkynd.com\n©2016\n\nContributed to by: Annemunition"
                    })
                }
            }
        ]
    }
]);

Menu.setApplicationMenu(titleMenu); //Set title menu
