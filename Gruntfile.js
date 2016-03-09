'use strict';
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        'create-windows-installer': {
            ia32: {
                appDirectory: './dist/ControlCast-win32-ia32',
                outputDirectory: './dist/win',
                authors: 'DBKynd',
                exe: 'ControlCast.exe',
                loadingGif: './build/loading.gif',
                iconUrl: 'https://raw.githubusercontent.com/dbkynd/controlcast/master/images/icon.ico',
                setupIcon: './images/icon.ico',
                noMsi: true
            }
        }
    });
    grunt.loadNpmTasks('grunt-electron-installer');
    grunt.registerTask('default', 'create-windows-installer');
};
