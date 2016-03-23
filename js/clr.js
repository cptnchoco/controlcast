'use strict';
const app = require('express')();

var server;

function startCLR() {
    console.log("Starting CLR Browser");

    server = app.listen(config.app.clr.port || 3000, () => {
        console.log("Listening on *:" + config.app.clr.port);
    });

    server.on('connection', function(socket) {
        console.log("A new connection was made by a client");
        socket.setTimeout(5 * 1000);
    });

    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "clr.html"));
    });

    app.get("/css/clr.css", (req, res) => {
        res.sendFile(path.join(__dirname, "css/clr.css"));
    });

    app.get("/css/open_sans.css", (req, res) => {
        res.sendFile(path.join(__dirname, "css/open_sans.css"));
    });

    app.get("/js/jquery/jquery.min.js", (req, res) => {
        res.sendFile(path.join(__dirname, "js/jquery/jquery.min.js"));
    });

    app.get("/js/clr_client.js", (req, res) => {
        res.sendFile(path.join(__dirname, "js/clr_client.js"));
    });
}

function stopCLR(callback) {
    console.log('Stopping CLR Browser');
    server.close(() => {
        console.log('CLR Browser stopped');
        if (callback) callback();
    });
}
