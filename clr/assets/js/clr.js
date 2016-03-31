var io = io(document.location.href.replace("http", "ws"));

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

io.on('key_press', function (data) {
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
    var css = (data.options.css || 'this {\n  width: 75%;\n}').replace(/\n/g, "").replace(/\s/g, "");
    var css_this_index = css.toLowerCase().indexOf('this_key');
    console.log(css_this_index);

    console.log(data.image);
    console.log(animate);
    console.log(css);
    var newDiv = document.createElement('div');
    var imageDiv = document.createElement('div');
    $(newDiv).append(imageDiv);
    $('body').append(newDiv);
    $(imageDiv).css({
        '-webkit-animation-duration': animate.open.duration,
        '-webkit-animation-delay': animate.open.delay
    });
    $(imageDiv).html("<img src='" + data.image + "'>").animateCss(animate.open.type, function () {
        $(imageDiv).css({
            '-webkit-animation-duration': animate.close.duration,
            '-webkit-animation-delay': animate.close.delay
        });
        $(imageDiv).animateCss(animate.close.type, function () {
            $(newDiv).remove();
        });
    });
});
