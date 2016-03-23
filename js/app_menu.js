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
            },
            {
                label: 'Start with Windows',
                type: 'checkbox',
                click: (e)=> {
                    ipc.send('windows_auto_start', e.checked);
                }
            },
            {
                label: 'Use Internal CLR Browser',
                type: 'checkbox',
                click: (e)=> {
                    ipc.send('clr_enabled', e.checked);
                    if (e.checked) {
                        startCLR();
                        $('.blanket').fadeIn(200); //Darken the body
                        let text = "http://localhost:" + (config.app.clr.port || 3000);
                        let n = noty({
                            text: text,
                            animation: {
                                open: 'animated flipInX', // Animate.css class names
                                close: 'animated flipOutX' // Animate.css class names
                            },
                            layout: 'center',
                            type: 'alert',
                            timeout: false,
                            closeWith: ['click', 'button'],
                            callback: {
                                onClose: function () {
                                    $('.blanket').fadeOut(1000); //Restore body
                                }
                            },
                            buttons: [
                                {
                                    addClass: 'btn btn-primary',
                                    text: 'Copy to Clipboard',
                                    onClick: function ($noty) {
                                        $noty.close();
                                        clipboard.writeText(text);
                                    }
                                },
                                {
                                    addClass: 'btn',
                                    text: 'Close',
                                    onClick: function ($noty) {
                                        $noty.close();
                                    }
                                }
                            ]
                        });
                    } else {
                        stopCLR();
                    }
                }
            }
        ]
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'Check for Updates',
                click: () => {
                    //noinspection JSUnresolvedVariable
                    notyUpdates = true;
                    checkForUpdates();
                }
            },
            {
                label: 'View on GitHub',
                click: () => { //Open client browser to Github
                    require('electron').shell.openExternal('https://github.com/dbkynd/controlcast')
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
                        "\ndb@dbkynd.com\n©2016\n\nArtwork and beta testing by Annemunition"
                    })
                }
            }
        ]
    }
]);

Menu.setApplicationMenu(titleMenu); //Set title menu
