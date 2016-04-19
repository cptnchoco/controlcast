'use strict';
var tray = new Tray(path.join(__dirname, 'images/icon.ico'));

var contextMenu = Menu.buildFromTemplate([
    {
        label: 'Restore',
        click: () => {
            ipc.send('restore_main'); //Restore Main window
        }
    },
    {
        label: 'Reset Position',
        click: () => {
            ipc.send('reset_position'); //Restore Main window
        }
    },
    {
        type: 'separator'
    },
    {
        label: 'Exit',
        click: () => { //Force quit app, ignores close to tray setting
            ipc.send('force_quit');
        }
    }
]);

tray.setToolTip('ControlCast');
tray.setContextMenu(contextMenu);

tray.on('double-click', function () {
    ipc.send('toggle_minimize'); //Toggle the minimize state of the app on double click on tray icon
});
