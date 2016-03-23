'use strict';
const fs = require('fs');
var version = require('./package.json').version;
var releaseUrl = require('./package.json').releaseUrl;

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        'create-windows-installer': {
            ia32: {
                appDirectory: './dist/ControlCast-win32-ia32',
                outputDirectory: './dist',
                authors: 'DBKynd',
                exe: 'ControlCast.exe',
                loadingGif: './build/loading.gif',
                iconUrl: 'https://raw.githubusercontent.com/dbkynd/controlcast/master/images/icon.ico',
                setupIcon: './images/icon.ico',
                noMsi: true,
                remoteReleases: releaseUrl,
                certificateFile: '../DBKynd.pfx',
                certificatePassword: require('../CodeSigningPassword.json').password
            }
        }
    });
    grunt.loadNpmTasks('grunt-electron-installer');

    grunt.registerTask('post', 'Rename the Setup.exe file after building installer.', function () {
        fs.rename('./dist/Setup.exe', './dist/ControlCast-' + version + '-Setup.exe');
    });

    grunt.registerTask('default', ['create-windows-installer', 'post']);
};
