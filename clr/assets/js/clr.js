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
    images = data;
    for (var image in images) {
        if (images.hasOwnProperty(image)) {
            images[image].image = new Image();
            images[image].image.src = images[image].src;
        }
    }
});

io.on('image_change', function (data) {
    images[data.key] = {
        image: new Image(),
        src: data.src
    };
    images[data.key].image.src = data.src;
});

io.on('key_press', function (data) {
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
    var css = (data.options.css || "").replace(/\n/g, "").replace(/\s/g, "");

    console.log(css);

    var newDiv = document.createElement('div');
    var imageDiv = document.createElement('div');

    $(newDiv).append(imageDiv);
    $('body').append(newDiv);

    $(imageDiv).css({
        '-webkit-animation-duration': animate.open.duration,
        '-webkit-animation-delay': animate.open.delay
    });
    $(imageDiv).html("<img src='" + images[data.key].src + "'>").animateCss(animate.open.type, function () {
        $(imageDiv).css({
            '-webkit-animation-duration': animate.close.duration,
            '-webkit-animation-delay': animate.close.delay
        });
        $(imageDiv).animateCss(animate.close.type, function () {
            $(newDiv).remove();
        });
    });
});
