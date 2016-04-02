'use strict';
const packager = require('electron-packager');

var version = require('../package.json').version;

var pack_options = {
    platform: 'win32',
    arch: 'ia32',
    dir: '../',
    out: '../dist',
    asar: false,
    prune: true,
    overwrite: true,
    icon: '../images/icon.ico',
    ignore: '^/.idea|^/build|^/dist|^/node_modules/(electron-*|grunt|grunt-*|rmdir)|^/Gruntfile.js|^/clr/assets/images/*',
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

packager(pack_options, (err, appPath) => {
    if (err) {
        console.log("error: " + JSON.stringify(err));
        return;
    }
    console.log("Packaging complete");
});
