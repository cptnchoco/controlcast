'use strict';
$(document).ready(function () {

    $('.options').mouseenter(function () { //Adds a border around the key to show which is being edited
        let key = getGuiKey(lastKey);
        $(key).addClass('editing'); //Show the last key
        $('.center.c' + lastKey.join("-")).addClass('editing'); //Show center key border if center key
        $(this).mouseleave(function () {
            $(key).removeClass('editing'); //Don't show the last key
            $('.center').removeClass('editing'); //Remove border from all center keys
        });
    });

    $('.expandable').click(function (e) { //Click to expand/hide option groups
        if (e.target.className == 'clear_opt') return; //Don't expand if the 'Clear' button is what was clicked
        let content = $(this).next(); //Target the content div
        if (content.hasClass('expanded')) {
            content.removeClass('expanded').slideUp(500); //Hide if this was already expanded
        } else {
            $('.expanded').removeClass('expanded').slideUp(500); //Hide all expanded divs
            content.addClass('expanded').slideDown(500); //Expand the div we want
        }
    });

    $('.color_select div').click(function () {
        let parent = $(this).parent(); //Target the wrapper div for all the colors
        let color = $(this).data('color'); //Get the color we clicked on
        let parentClass = parent.hasClass('active') ? 'active' : 'inactive'; //Determine which action group we are dealing with
        parent.children().removeClass('selected'); //Remove the selected class from everything
        parent.data('color', color); //Set out parent class' data-color to the color we clicked on
        $(this).addClass('selected'); //Add the selected class to the color we clicked on
        if (color == 'OFF') { //Handle the 'X' image in the OFF color div
            $('.color_select.' + parentClass + ' div img').addClass('selected');
        } else {
            $('.color_select.' + parentClass + ' div img').removeClass('selected');
        }
        color = color.split("_"); //Format the color name to be gui friendly
        for (let i = 0; i < color.length; i++) {
            color[i] = toTitleCase(color[i]);
        }
        $('.color_select.' + parentClass + ' span').text(color.join(" ")); //Set the color name to our new gui friendly name
        let keyConfig = getKeyConfig(); //Get the key config or defaults
        let action = (parentClass == 'active') ? 'press' : 'release'; //Set action
        keyConfig.color[action] = $('#' + parentClass + '_key_color').data('color'); //Update the changed color
        config.keys[lastKey.join(",")] = keyConfig; //Save to config
        colorKey(lastKey, 'release');
        checkmarks();
    });

    $('#volume_slider').slider({ //Volume slider options
        min: 0,
        max: 100,
        range: "min",
        animate: true,
        slide: function (event, ui) {
            if (tracks[lastKey.join(",")]) tracks[lastKey.join(",")].volume = ui.value / 100; //Reset track volume if track exists
            $('#vol_val').text(ui.value + "%"); //Set volume label
            let keyConfig = getKeyConfig(); //Get the key config or defaults
            keyConfig.audio.volume = $('#vol_val').text().replace("%", ""); //Save to volume to the key config
            config.keys[lastKey.join(",")] = keyConfig; //Save to config
        }
    });

    $('#save_settings').click(function () { //Save button clicked
        removeUnusedKeys(); //Remove any default, unused, keys to keep the config file size as small as possible
        ipc.send('save_config', config); //Send changed config to main app to be saved
    });

    $('#discard_settings').click(function () { //Discard button clicked
        ipc.send('get_config'); //Get unchanged config from main app
    });

    $('#kill_audio').click(function () { //Stop All Audio button was pressed
        for (let track in tracks) { //Loop through all tracks in the tracks object
            if (tracks.hasOwnProperty(track)) {
                stopAudio(tracks[track]); //Stop the track
            }
        }
    });


    //Clear Buttons


    $('#clear_all').click(function () { //Reset key button was pressed
        config.keys[lastKey.join(",")] = getDefaultKeyConfig(); //Save default key config to this key
        colorKey(lastKey, 'release');  //Reset key color
        setKeyOptions(); //Update all key settings to show default
    });

    $('.color .clear_opt').click(function () {
        config.keys[lastKey.join(",")].color = getDefaultKeyConfig().color;
        colorKey(lastKey, 'release');  //Reset key color
        setKeyOptions(); //Update key settings
    });

    $('.hotkey .clear_opt').click(function () {
        config.keys[lastKey.join(",")].hotkey = getDefaultKeyConfig().hotkey;
        colorKey(lastKey, 'release');  //Reset key color
        setKeyOptions(); //Update key settings
    });

    $('.audio .clear_opt').click(function () { //Clear hotkey button was pressed
        config.keys[lastKey.join(",")].audio = getDefaultKeyConfig().audio;
        colorKey(lastKey, 'release');  //Reset key color
        setKeyOptions(); //Update key settings
    });

    $('.clr_options .clear_opt').click(function () {
        config.keys[lastKey.join(",")].clr = getDefaultKeyConfig().clr;
        colorKey(lastKey, 'release');  //Reset key color
        setKeyOptions(); //Update key settings
    });


    //Hotkey Logic


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
            let keyConfig = getKeyConfig();
            keyConfig.hotkey.string = $(this).val();
            config.keys[lastKey.join(",")] = keyConfig; //Save to config
            colorKey(lastKey, 'release');
            checkmarks();
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


    //Path Input Fields


    $('#audio_path').change(function () { //Audio path was changed
        console.log('start');
        if ($(this).val() == "") return; //Return if blank
        let audioPath = path.parse($(this).val()); //Parse path
        let ext = audioPath.ext.toLowerCase(); //Get file extension
        if (ext != '.mp3' && ext != '.wav' && ext != '.oog') { //Must be these formats to be playable
            centerNOTY('notify', "Only able to play [ .mp3 | .wav | .ogg ] files.", 4000);
            return;
        }
        let isUrl = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test($(this).val()); //Determine if path is a valid url
        if (isUrl) {
            request.get({url: $(this).val()}, (err, res) => { //Try to access the web file and warn if unable
                if (err || res.statusCode != 200) {
                    centerNOTY('warning', "Unable to access that audio file.", 3000);
                    console.log(JSON.stringify(err));
                }
            });
        } else {
            fs.access($(this).val(), fs.R_OK, (err) => { //Try to access the web file and warn if unable
                if (err) {
                    centerNOTY('warning', "Unable to access that audio file.", 3000);
                    console.log(JSON.stringify(err));
                }
            });
        }
    });

    $('#clr_path').change(function () { //CLR path was changed
        if ($(this).val() == "") return; //Return if blank
        let clrPath = path.parse($(this).val()); //Parse path
        let ext = clrPath.ext.toLowerCase(); //Get file extension
        if (ext != '.png' && ext != '.jpg' && ext != '.gif') { //Must be these formats
            centerNOTY('notify', "Only able to show [ .png | .jpg | .gif ] files.", 4000);
            return;
        }
        let filePath = path.join(__dirname, "clr/assets/images/" + lastKey.join(",")) + ext;
        let isUrl = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test($(this).val()); //Determine if path is a valid url
        if (isUrl) {
            request.get({url: $(this).val(), encoding: null}, (err, res, buffer) => { //Try to access the web file and warn if unable
                if (err || res.statusCode != 200) {
                    centerNOTY('warning', "Unable to access that image file.", 3000);
                    console.log(JSON.stringify(err));
                } else {
                    fs.writeFile(filePath, buffer, (err) => {
                        if (err) {
                            centerNOTY('warning', "Error saving file for CLR.", 3000);
                            console.log(JSON.stringify(err));
                        } else {
                            sendImageChange(filePath, ext);
                        }
                    });
                }
            });
        } else {
            fs.access($(this).val(), fs.R_OK, (err) => { //Try to access the web file and warn if unable
                if (err) {
                    centerNOTY('warning', "Unable to access that image file.", 3000);
                    console.log(JSON.stringify(err));
                } else {
                    fs.readFile($(this).val(), (err, data) => {
                        if (!err) {
                            fs.writeFile(filePath, data, (err) => {
                                if (err) {
                                    centerNOTY('warning', "Error saving file for CLR.", 3000);
                                    console.log(JSON.stringify(err));
                                } else {
                                    sendImageChange(filePath, ext);
                                }
                            });
                        } else {
                            console.log(JSON.stringify(err));
                        }
                    });
                }
            });
        }
    });

    $('#browse').click(function () { //Browse for audio file button was pressed
        dialog.showOpenDialog({ //Open dialog to choose a file
            title: "Choose Audio File",
            filters: [
                {name: 'Audio', extensions: ['mp3', 'wav', 'ogg']} //Restrict allowed files to these formats
            ],
            properties: ["openFile"] //Only allow 1 file to be chosen
        }, (file) => {
            $('#audio_path').val(file).trigger('change'); //When we get the file name that was chosen, input it into the form
        })
    });

    $('#clr_browse').click(function () { //Browse for clr image file button was pressed
        dialog.showOpenDialog({ //Open dialog to choose a file
            title: "Choose Image File",
            filters: [
                {name: 'Image', extensions: ['png', 'jpg', 'gif']} //Restrict allowed files to these formats
            ],
            properties: ["openFile"] //Only allow 1 file to be chosen
        }, (file) => {
            $('#clr_path').val(file).trigger('change'); //When we get the file name that was chosen, input it into the form
        })
    });


    //Options Changed


    $('.opt').on('input change', function () { //A savable option was changed, update the key config
        let keyConfig = getKeyConfig();
        set(keyConfig, $(this).data('config'), $(this).val());
        config.keys[lastKey.join(",")] = keyConfig;
        colorKey(lastKey, 'release');
        checkmarks();
    });


    //CSS syntax highlighter


    css_editor = ace.edit("clr_css");
    css_editor.setTheme("ace/theme/tomorrow_night_eighties");
    css_editor.getSession().setMode("ace/mode/css");
    css_editor.getSession().setTabSize(2);
    css_editor.$blockScrolling = Infinity;

    css_editor.getSession().on('change', function (e) {
        let keyConfig = getKeyConfig();
        keyConfig.clr.css = css_editor.getSession().getValue();
        config.keys[lastKey.join(",")] = keyConfig;
    });

    $('#reset_clr_css').click(function () {
        css_editor.setValue(getDefaultKeyConfig().clr.css);
        css_editor.clearSelection();
    });

    $('.ace_text-input').on('blur', function () {
        let e = $('.ace_error').length;
        if (e) centerNOTY('warning', "There is an error in the custom CSS", 3000);
    });

    $('.num_input').numeric({
        allowMinus: false,
        allowThouSep: false,
        allowDecSep: true,
        maxDecimalPlaces: 3,
        maxPreDecimalPlaces: 3
    });

    $('#flush_clr').click(function() {
        clrIO.emit('flush');
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
    $('#volume_slider').slider('value', parseInt(keyConfig.audio.volume));
    $('#vol_val').text(keyConfig.audio.volume + "%");
    $('input[name="audio_type"][value=' + keyConfig.audio.type + ']').prop('checked', true);
    $('#clr_path').val(keyConfig.clr.path);
    $('#clr_pos').val(keyConfig.clr.pos);
    $('#animate-open').val(keyConfig.clr.animate.open.type);
    $('#animate-close').val(keyConfig.clr.animate.close.type);
    $('.open .delay').val(keyConfig.clr.animate.open.delay);
    $('.open .duration').val(keyConfig.clr.animate.open.duration);
    $('.close .delay').val(keyConfig.clr.animate.close.delay);
    $('.close .duration').val(keyConfig.clr.animate.close.duration);
    css_editor.setValue(keyConfig.clr.css);
    css_editor.clearSelection();
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
            type: "normal",
            volume: "50"
        },
        clr: {
            path: "",
            pos: "",
            animate: {
                open: {
                    delay: "0.0",
                    type: "fadeIn",
                    duration: "1.0"
                },
                close: {
                    delay: "2.0",
                    type: "fadeOut",
                    duration: "1.0"
                }
            },
            css: ".img {\n  width: 50%;\n}"
        }
    }
}

function getKeyConfig() { //Take all the key config values from the gui and save them to the settings config
    return get(config, "keys." + lastKey.join(',')) || getDefaultKeyConfig(); //Get the key config or defaults
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
        $('.clr_options .check_mark').hide();
        return;
    }
    if (thisKey.color.press != "OFF" || thisKey.color.release != "OFF") {
        $('.color .check_mark').show();
    } else {
        $('.color .check_mark').hide();
    }
    if (thisKey.hotkey.string != "") {
        $('.hotkey .check_mark').show();
    } else {
        $('.hotkey .check_mark').hide();
    }
    if (thisKey.audio.path != "") {
        $('.audio .check_mark').show();
    } else {
        $('.audio .check_mark').hide();
    }
    if (thisKey.clr.path != "") {
        $('.clr_options .check_mark').show();
    } else {
        $('.clr_options .check_mark').hide();
    }
}

function sendImageChange(filePath, ext) {
    fs.stat(path.join(filePath), (err, stats) => {
        if (!err) {
            let m = Date.parse(stats.mtime.toString()) / 1000;
            let k = lastKey.join(",");
            clrIO.emit('image_change', {key: k, src: "images/" + k + ext + "?m=" + m});
        } else {
            console.log(JSON.stringify(err));
        }
    });
}
