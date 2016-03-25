var io = io(document.location.href.replace("http", "ws"));

$(document).ready(function () {
    $('body').show();
});

io.on('connected', function () {
    console.log('connection ok');
});
