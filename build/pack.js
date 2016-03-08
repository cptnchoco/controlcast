'use strict';
const packager = require('electron-packager'),
    fs = require('fs'),
    rmdir = require('rmdir');

var version = require('../package.json').version;

var pack_options = {
    platform: 'win32',
    arch: 'ia32',
    dir: '../',
    out: '../dist',
    asar: false,
    overwrite: true,
    icon: '../images/icon.ico',
    ignore: '^/.idea|^/build|^/dist|^/node_modules/(electron-*|grunt|grunt-*|rmdir)',
    'version-string': {
        CompanyName: 'DBKynd',
        LegalCopyright: 'Copyright (C) 2016 DBKynd',
        FileDescription: 'ControlCast',
        OriginalFilename: 'ControlCast.exe',
        ProductName: 'ControlCast',
        InternalName: 'ControlCast'
    },
    'app-copyright': 'Copyright (C) 2016 DBKynd',
    'app-version': version,
    'build-version': version
};

function pack() {
    packager(pack_options, (err, appPath) => {
        if (err) {
            console.log("error: " + JSON.stringify(err));
            return;
        }
        console.log("Packaging complete");
    });
}

fs.exists('../dist/win', (exists) => {
    if (exists) {
        rmdir('../dist/win', () => {
            pack();
        });
    } else {
        pack();
    }
});
