var io = io(document.location.href.replace("http", "ws"));
var images = {};

$(document).ready(function () {
    $.fn.extend({
        animateCss: function (animationName, callback) {
            var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
            $(this).addClass('animated ' + animationName).one(animationEnd, function () {
                $(this).removeClass('animated ' + animationName);
                if (callback) callback();
            });
        }
    });
    $('body').show();
});

io.on('connected', function () {
    console.log('connection ok');
});

io.on('images', function (data) {
    console.log('image list');
    images = data;
    for (var image in images) {
        if (images.hasOwnProperty(image)) {
            images[image].image = new Image();
            images[image].image.src = images[image].src;
        }
    }
});

io.on('image_change', function (data) {
    console.log('image change');
    images[data.key] = {
        image: new Image(),
        src: data.src
    };
    images[data.key].image.src = data.src;
});

io.on('flush', function () {
    $('body').empty();
});

io.on('key_press', function (data) {
    console.log('key ' + data.key + " pressed");
    if (!images[data.key] || !images[data.key].src) return;
    var animate = {
        open: {
            delay: parseFloat(data.options.animate.open.delay || 0.0) * 1000 + "ms",
            type: data.options.animate.open.type || 'fadeIn',
            duration: parseFloat(data.options.animate.open.duration || 2.0) * 1000 + "ms"

        },
        close: {
            delay: parseFloat(data.options.animate.close.delay || 5.0) * 1000 + "ms",
            type: data.options.animate.close.type || 'fadeOut',
            duration: parseFloat(data.options.animate.close.duration || 2.0) * 1000 + "ms"

        }
    };
    var css = (data.options.css || "");

    var frame = document.createElement('iframe');
    $('body').append(frame);

    $(frame).contents().find('head').append("<link rel='stylesheet' type='text/css' href='css/frame.css'>" +
            "<link rel='stylesheet' type='text/css' href='css/animate.css'>")
        .append("<style>" + css + "</style>");

    var frame_body = $(frame).contents().find('body').addClass(data.options.pos);

    var wrapper = document.createElement('div');
    $(wrapper).addClass('img').css({
        "background": "url(" + images[data.key].src + ") no-repeat",
        "background-size": "cover"
    }).html("<img src='" + images[data.key].src + "'>");

    frame_body.html(wrapper);

    $(wrapper).css({
        '-webkit-animation-duration': animate.open.duration,
        '-webkit-animation-delay': animate.open.delay
    }).animateCss(animate.open.type, function () {
        $(wrapper).css({
            '-webkit-animation-duration': animate.close.duration,
            '-webkit-animation-delay': animate.close.delay
        });
        $(wrapper).animateCss(animate.close.type, function () {
            $(frame).remove();
        });
    });
});
