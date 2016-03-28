var io = io(document.location.href.replace("http", "ws"));

$(document).ready(function () {
    $('body').show();
});

io.on('connected', function () {
    console.log('connection ok');
});

io.on('key_press', function(data) {
    console.log(data);
});