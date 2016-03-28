'use strict';
$(document).ready(function () {

    $('.options').mouseenter(function () { //Adds a border around the key to show which is being edited
        let key = getGuiKey(lastKey);
        $(key).addClass('editing'); //Show the last key
        $('.center.c' + lastKey.join("-")).addClass('editing');
        $(this).mouseleave(function () {
            $(key).removeClass('editing'); //Show the last key
            $('.center').removeClass('editing');
        });
    });

    $('.expandable').click(function (e) {
        if (e.target.className == 'clear_opt') return;
        let content =  $(this).next();
        if (content.hasClass('expanded')) {
            content.removeClass('expanded').slideUp(500);
        } else {
            $('.expanded').removeClass('expanded').slideUp(500);
            content.addClass('expanded').slideDown(500);
        }
    });

    $('.color_select div').click(function () {
        let parent = $(this).parent();
        let color = $(this).data('color');
        let parentClass = parent.hasClass('active') ? 'active' : 'inactive';
        parent.children().removeClass('selected');
        parent.data('color', color);
        $(this).addClass('selected');
        if (color == 'OFF') {
            $('.color_select.' + parentClass + ' div img').addClass('selected');
        } else {
            $('.color_select.' + parentClass + ' div img').removeClass('selected');
        }
        color = color.split("_");
        for (let i = 0; i < color.length; i++) {
            color[i] = toTitleCase(color[i]);
        }
        $('.color_select.' + parentClass + ' span').text(color.join(" "));
        updateKeyEntry();
    });

    $('#volume_slider').slider({
        min: 0,
        max: 100,
        range: "min",
        animate: true,
        slide: function (event, ui) {
            if (tracks[lastKey.join(",")]) tracks[lastKey.join(",")].volume = ui.value / 100;
            $('#vol_val').text(ui.value + "%");
            updateKeyEntry();
        }
    });

    $('#save_settings').click(function () { //Save button clicked
        removeUnusedKeys(); //Remove any default, unused, keys to keep the config file size as small as possible
        ipc.send('save_config', config); //Send changed config to main app to be saved
    });

    $('#discard_settings').click(function () { //Discard button clicked
        ipc.send('get_config'); //Get unchanged config from main app
    });

    $('#clear_all').click(function () { //Reset key button was pressed
        config.keys[lastKey.join(",")] = getDefaultKeyConfig(); //Save default key config to this key
        colorKey(lastKey, 'release'); //Reset key color
        setKeyOptions(); //Update all key settings to show default
    });

    $('#kill_audio').click(function () { //Stop All Audio button was pressed
        for (let track in tracks) { //Loop through all tracks in the tracks object
            if (tracks.hasOwnProperty(track)) {
                stopAudio(tracks[track]); //Stop the track
            }
        }
    });

    $('.color .clear_opt').click(function () { //Clear hotkey button was pressed
        $('#inactive_key_color div[data-color=OFF]').trigger('click');
        $('#active_key_color div[data-color=OFF]').trigger('click');
        updateKeyEntry(); //Update key settings
    });

    $('.hotkey .clear_opt').click(function () { //Clear hotkey button was pressed
        $('#hotkey_string').val(""); //Clear the hotkey
        $('input[name="hotkey_type"][value=send]').prop('checked', true);
        updateKeyEntry(); //Update key settings
    });

    $('.audio .clear_opt').click(function () { //Clear hotkey button was pressed
        $('#audio_path').val(""); //Clear the hotkey
        $('#volume_slider').slider('value', 50);
        $('#vol_val').text(50 + "%");
        $('input[name="on_release"][value=continue]').prop('checked', true);
        $('input[name="on_repress"][value=none]').prop('checked', true);
        updateKeyEntry(); //Update key settings
    });

    $('.clr_options .clear_opt').click(function () { //Clear hotkey button was pressed
        $('#clr_path').val(""); //Clear the hotkey
        updateKeyEntry(); //Update key settings
    });

    $('#hotkey_string').focus(function () { //Text box field to create hotkey was focused
        let combo = { //Create combo object to store what keys we want
            ctrl: false,
            shift: false,
            alt: false,
            key: null
        };
        $(this).keydown(function (e) { //Key pressed while focused
            e.preventDefault(); //Cancel any normal inputs from being entered
            let keyName = keycode(e).toUpperCase(); //Get text keyName
            switch (keyName) { //Save the modifiers being pressed
                case 'CTRL':
                    combo.ctrl = true;
                    break;
                case 'SHIFT':
                    combo.shift = true;
                    break;
                case 'ALT':
                    combo.alt = true;
                    break;
                default: //Save only 1 non-modifier to the combo
                    combo.key = keyName;
                    break;
            }
            let display = []; //Create an empty array to be filled with combo keys
            //Only add the keys to the display array if they exist
            if (combo.ctrl) display.push("CTRL");
            if (combo.shift) display.push("SHIFT");
            if (combo.alt) display.push("ALT");
            if (combo.key) display.push(combo.key);
            $(this).val(display.join(" + ")); //Stringify the combo key options array and display it in the text field
            updateKeyEntry(); //Update the key entry to save the hotkey
        }).alphanum({
            allow: '+',
            allowOtherCharSets: false
        });
        $(this).keyup(function (e) { //Key released while focused
            let keyName = keycode(e).toUpperCase(); //Get text keyName
            switch (keyName) { //Save which modifiers were released
                case 'CTRL':
                    combo.ctrl = false;
                    break;
                case 'SHIFT':
                    combo.shift = false;
                    break;
                case 'ALT':
                    combo.alt = false;
                    break;
                case combo.key: //If the released key was the saved non-modifier key, remove it from the combo object
                    combo.key = null;
            }
        });
    });

    $('#audio_path').blur(function () { //Audio path was changed
        if ($(this).val() == "") return; //Return if blank
        let audioPath = path.parse($(this).val()); //Parse path
        let ext = audioPath.ext; //Get file extension
        if (ext != '.mp3' && ext != '.wav' && ext != '.oog') { //Must be these formats to be playable
            centerNOTY('notify', "Only able to play [ .mp3 | .wav | .ogg ] files.", 4000);
            return;
        }
        let isUrl = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test($(this).val()); //Determine if path is a valid url
        if (isUrl) {
            request.get({url: $(this).val()}, (err, res) => { //Try to access the web file and warn if unable
                if (err || res.statusCode != 200) {
                    centerNOTY('warning', "Unable to access that audio file.", 3000);
                }
            });
        } else {
            fs.access($(this).val(), fs.R_OK, (err) => { //Try to access the web file and warn if unable
                if (err) centerNOTY('warning', "Unable to access that audio file.", 3000);
            });
        }
    });

    $('#clr_path').blur(function () { //CLR path was changed
        if ($(this).val() == "") return; //Return if blank
        let clrPath = path.parse($(this).val()); //Parse path
        let ext = clrPath.ext; //Get file extension
        if (ext != '.png' && ext != '.jpg') { //Must be these formats
            centerNOTY('notify', "Only able to show [ .png | .jpg ] files.", 4000);
            return;
        }
        let isUrl = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test($(this).val()); //Determine if path is a valid url
        if (isUrl) {
            request.get({url: $(this).val()}, (err, res) => { //Try to access the web file and warn if unable
                if (err || res.statusCode != 200) {
                    centerNOTY('warning', "Unable to access that image file.", 3000);
                }
            });
        } else {
            fs.access($(this).val(), fs.R_OK, (err) => { //Try to access the web file and warn if unable
                if (err) centerNOTY('warning', "Unable to access that image file.", 3000);
            });
        }
    });

    $('#browse').click(function () { //Browse for file button was pressed
        dialog.showOpenDialog({ //Open dialog to choose a file
            title: "Choose Audio File",
            filters: [
                {name: 'Audio', extensions: ['mp3', 'wav', 'ogg']} //Restrict allowed files to these formats
            ],
            properties: ["openFile"] //Only allow 1 file to be chosen
        }, (file) => {
            $('#audio_path').val(file).trigger('input'); //When we get the file name that was chosen, input it into the form
        })
    });

    $('#clr_browse').click(function () { //Browse for file button was pressed
        dialog.showOpenDialog({ //Open dialog to choose a file
            title: "Choose Image File",
            filters: [
                {name: 'Image', extensions: ['png', 'jpg']} //Restrict allowed files to these formats
            ],
            properties: ["openFile"] //Only allow 1 file to be chosen
        }, (file) => {
            $('#clr_path').val(file).trigger('input'); //When we get the file name that was chosen, input it into the form
        })
    });

    $('.opt').on('change input', function () { //A savable option was changed, update the key config
        updateKeyEntry();
    });
});

function setKeyOptions() { //Update all the key gui elements
    let keyConfig = get(config, "keys." + lastKey.join(',')) || getDefaultKeyConfig(); //Get the key settings if they exist, or defaults
    $('#key_description').val(keyConfig.description); //Set key description
    $('.color_select div').removeClass('selected');
    $('.color_select div img').removeClass('selected');
    $('.color_select.inactive div[data-color=' + keyConfig.color.release + ']').addClass('selected');
    $('.color_select.active div[data-color=' + keyConfig.color.press + ']').addClass('selected');
    if (keyConfig.color.release == 'OFF') $('.color_select.inactive div img').addClass('selected');
    if (keyConfig.color.press == 'OFF') $('.color_select.active div img').addClass('selected');
    $('.color_select.inactive div img').text(toTitleCase(keyConfig.color.release));
    $('.color_select.active div img').text(toTitleCase(keyConfig.color.press));
    $('#inactive_key_color').data('color', keyConfig.color.release);
    $('#active_key_color').data('color', keyConfig.color.press);
    $('#hotkey_string').val(keyConfig.hotkey.string); //Set hotkey string
    $('input[name="hotkey_type"][value=' + keyConfig.hotkey.type + ']').prop('checked', true);
    $('#audio_path').val(keyConfig.audio.path);
    $('#volume_slider').slider('value', keyConfig.audio.volume);
    $('#vol_val').text(keyConfig.audio.volume + "%");
    $('input[name="on_release"][value=' + keyConfig.audio.on_release + ']').prop('checked', true);
    $('input[name="on_repress"][value=' + keyConfig.audio.on_repress + ']').prop('checked', true);
    $('#clr_path').val(keyConfig.clr.path);
    checkmarks();
}

function getDefaultKeyConfig() { //Sets the default key config
    return {
        description: "",
        color: {
            press: "OFF",
            release: "OFF"
        },
        hotkey: {
            type: "send",
            string: ""
        },
        audio: {
            path: "",
            on_release: "continue",
            on_repress: "none",
            volume: 50
        },
        clr: {
            path: "",
            animate: {
                open: "",
                delay: 5000,
                close: ""
            },
            css: ""
        }
    }
}

function updateKeyEntry() { //Take all the key config values from the gui and save them to the settings config
    if (!config) return;
    config.keys[lastKey.join(",")] = {
        description: $('#key_description').val(),
        color: {
            press: $('#active_key_color').data('color'),
            release: $('#inactive_key_color').data('color')
        },
        hotkey: {
            type: $('input[name="hotkey_type"]:checked').val(),
            string: $('#hotkey_string').val()
        },
        audio: {
            path: $('#audio_path').val(),
            on_release: $('input[name="on_release"]:checked').val(),
            on_repress: $('input[name="on_repress"]:checked').val(),
            volume: parseInt($('#vol_val').text().replace("%", ""))
        },
        clr: {
            path: $('#clr_path').val(),
            animate: {
                open: "",//"Test",
                delay: "",//3000,
                close: ""//"Test"
            },
            css: ""//"Test"
        }
    };
    checkmarks();
    colorKey(lastKey, 'release'); //Color the new key accordingly
}

function removeUnusedKeys() { //This is to try and keep the config.json file as small as possible
    let defaultConfig = getDefaultKeyConfig();
    for (let i in config.keys) {
        if (config.keys.hasOwnProperty(i)) {
            if (_.isEqual(config.keys[i], defaultConfig)) {
                delete config.keys[i];
            }
        }
    }
}

function toTitleCase(color) {
    color = color.toLowerCase();
    let letter = color.slice(0, 1);
    return color.replace(letter, letter.toUpperCase());
}

function checkmarks() {
    let thisKey = config.keys[lastKey.join(",")];
    if (!thisKey) {
        $('.color .check_mark').hide();
        $('.hotkey .check_mark').hide();
        $('.audio .check_mark').hide();
        return;
    }
    if (thisKey.color.press != "OFF" || thisKey.color.release != "OFF") {
        $('.color .check_mark').show();
    } else {
        $('.color .check_mark').hide();
    }
    if (thisKey.audio.path != "") {
        $('.audio .check_mark').show();
    } else {
        $('.audio .check_mark').hide();
    }
}
