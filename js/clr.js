'use strict';
const express = require('express'),
    app = express();

var server;

function startCLR() {
    console.log("Starting CLR Browser");

    server = app.listen(config.app.clr.port || 3000, () => {
        console.log("Listening on *:" + config.app.clr.port);
    });

    server.on('connection', function(socket) {
        socket.setTimeout(5 * 1000);
    });

    app.use(express.static(path.join(__dirname, "/clr/assets")));

    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "/clr/index.html"));
    });
}

function stopCLR(callback) {
    console.log('Stopping CLR Browser');
    server.close(() => {
        console.log('CLR Browser stopped');
        if (callback) callback();
    });
}
