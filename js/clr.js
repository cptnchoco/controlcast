'use strict';
const express = require('express'),
    app = express(),
    io = require('socket.io');

var server,
    clrIO,
    connected = 0;

function startCLR() {
    console.log("Starting CLR Browser");
    app.use(express.static(path.join(__dirname, "/clr/assets")));
    app.set('port', config.app.clr.port || 3000);
    server = app.listen(app.get('port'), () => {
        console.log("Listening on *:" + app.get('port'));
        clrRunning = true;
    });

    server.on('connection', (socket) => {
        socket.setTimeout(1000);
    });

    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "/clr/index.html"));
    });

    clrIO = io.listen(server, {});

    clrIO.on('connection', (socket) => { //Client Connect
        connected++;
        console.log("user connected (" + connected + ")");
        socket.emit('connected');

        socket.on('disconnect', () => { //Client Disconnect
            connected--;
            console.log("user disconnected (" + connected + ")");
        });
    });
}

function stopCLR(callback) {
    console.log('Stopping CLR Browser');
    clrIO.close();
    clrIO = null;
    server.close(() => {
        console.log('CLR Browser stopped');
        clrRunning = false;
        if (callback) callback();
    });
}
