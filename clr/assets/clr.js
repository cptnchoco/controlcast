var io = io(document.location.href.replace("http", "ws"));

$(document).ready(function () {
    $.fn.extend({
        animateCss: function (animationName, callback) {
            var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
            $(this).addClass('animated ' + animationName).one(animationEnd, function() {
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

io.on('key_press', function(data) {
    console.log('press');
    console.log(data);
    var newDiv = document.createElement('div');
    var imageDiv = document.createElement('div');
    $(newDiv).append(imageDiv);
    $('body').append(newDiv);
    $(imageDiv).animateCss('bounce', function () {
        $(newDiv).remove();
    });
});
