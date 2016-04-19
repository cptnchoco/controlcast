'use strict';
function keyEvent(source, key, action, edit) { //All midi and gui key events land here
    //console.log(source + " key " + ((action == 'press') ? "pressed" : "release") + ": " + key); //Log the key action
    if (!edit) { //Only perform these actions if not right-click on key
        colorKey(key, action); //Color the key based on the action
        playAudio(key, action); //Play Audio if used
        sendCLR(key, action); //Send CLR event if used
        sendHotkey(key, action); //Send Hotkey if used
    }
    if (action == 'press') {
        lastKey = key; //Update what the last key pressed was
        $('.options .key_pos_label').text("(" + lastKey.join(",") + ")"); //Change key label to show last pressed key
        setKeyOptions(); //Update the Edit key options fields
    }
}

$(document).ready(function () { //On DOM ready
    let launchpadGuiKey = $('.launchpad .key');
    launchpadGuiKey.mousedown(function (e) { //Launchpad gui key was pressed
        let key = getKeyPosition(this); //Get key position array
        if (e.which == 3) { //Mouse click was a 'right-click'
            keyEvent('gui', key, 'press', 'right-click');
            return;
        }
        keyEvent('gui', key, 'press'); //Forward to key event handler
    });

    launchpadGuiKey.mouseup(function () { //Launchpad gui key was released
        releasedKey(this);
    });

    launchpadGuiKey.mouseleave(function () { //Mouse left Launchpad gui key
        if ($(this).hasClass('pressed')) releasedKey(this); //Release if mouse left key while pressed
    });
});

function releasedKey(that) { //Gui key was released
    let key = getKeyPosition(that); //Get key position array
    keyEvent('gui', key, 'release'); //Forward to key event handler
}

function getKeyPosition(that) {
    let pos = $(that).data('pos').split(','); //Gets key position number
    pos[0] = parseInt(pos[0]);
    pos[1] = parseInt(pos[1]);
    return pos; //Returns key position as an array
}

function setAllLights() { //Sets all key lights to their released state color (background color)
    for (let c = 0; c < 9; c++) {
        for (let r = 0; r < 9; r++) {
            if (c == 8 && r == 8) break; //8,8 does not exist on the pad
            colorKey([c, r], 'release'); //Color the button
        }
    }
}

function colorKey(key, action) {
    let guiKey = getGuiKey(key); //Find key in DOM
    let oldColor = guiKey.data('color'); //Get current key color class
    guiKey.removeClass(oldColor); //Remove old color class
    let keyColor = get(config, "keys." + key.join(",") + ".color." + action) || "OFF"; //Try to get key color
    guiKey.addClass(keyColor); //Add new key color class
    guiKey.data('color', keyColor); //Store color to data attribute
    action == 'press' ? guiKey.addClass('pressed') : guiKey.removeClass('pressed');
    action == 'press' ? $('.c' + key.join("-")).addClass('pressed') : $('.c' + key.join("-")).removeClass('pressed');
    if (launchpad) { //Set midi color if launchpad is connected
        let button = launchpad.getButton(key[0], key[1]); //Get button object
        button.light(color[keyColor]); //Color the key
    }
    let usingHotkey = get(config.keys, key.join(",") + '.hotkey.string'); //Gets bool if we are using hotkey
    let usingAudio = get(config.keys, key.join(",") + '.audio.path'); //Gets bool if we are using audio
    let usingCLR = null;
    if (config.app.clr.enabled) usingCLR = get(config.keys, key.join(",") + '.clr.path'); //Gets bool if we are using clr
    let j = 0;
    if (usingHotkey) j++;
    if (usingAudio) j++;
    if (usingCLR) j++;
    guiKey.html("<div><span>" + (usingHotkey ? "<img src='images/hotkey.png'>" : "") +
        (usingAudio ? "<img src='images/audio.png'>" : "") + (usingCLR ? "<img src='images/clr.png'>" : "") + "</span></div>"); //Sets the inner key div to show associated icons to events
    if (j > 2) {
        $(guiKey).find('div').addClass('shift_up');
    } else {
        $(guiKey).find('div').removeClass('shift_up');
    }
}

function getGuiKey(key) { //Find the respective gui element with the key position
    return $('.launchpad .key[data-pos="' + key.join(",") + '"]');
}

ipc.on('all_dark', () => { //Message to turn off all the midi key lights
    if (launchpad) launchpad.allDark(); //Turn off all lights if launchpad is connected
});

ipc.on('save_config_callback', (e, err) => { //Callback from main app after saving config
    if (err) {
        centerNOTY('error', "There was an error saving the settings.")
    } else {
        centerNOTY('success', "Save Successful!")
    }
});

function centerNOTY(type, text, timeout) { //Display notification on center of window that auto disappears and darkens the main content
    $('.blanket').fadeIn(200); //Darken the body
    let n = noty({ //Show NOTY
        layout: 'center',
        type: type,
        text: text,
        animation: {
            open: 'animated flipInX', // Animate.css class names
            close: 'animated flipOutX' // Animate.css class names
        },
        timeout: timeout || 1500,
        callback: {
            onClose: function () {
                $('.blanket').fadeOut(1000); //Restore body
            }
        }
    });
}

function playAudio(key, action) { //Handle Audio playback
    let audio = get(config, "keys." + key.join(",") + ".audio"); //Get key audio settings if they exist
    if (!audio || !audio.path) return; //Return if no settings or disabled
    let track = tracks[key.join(",")]; //Get loaded track from memory
    switch (action) {
        case 'press':
            if (!track) { //Track was created in edit mode
                tracks[key.join(",")] = new Audio(audio.path); //Create and add new track to tracks
                tracks[key.join(",")].play();
            }
            if (track.played.length == 0 || track.ended) { //Start the track if it hasn't played before or has finished playing
                if (audio.path != track.src) { //The path was changed or local file
                    let localPath = "file:///" + audio.path.replace(/\\/g, "/").replace(/ /g, "%20"); //Convert to local format and check for match
                    if (localPath != track.src) track = new Audio(audio.path); //Yup, the path was changed, load new audio object
                }
                track.play();
                return;
            }
            if (!track.ended) { //What do we do if the key is repressed while the track is playing
                switch (audio.type) {
                    case 'toggle': //Stops the track
                        stopAudio(track);
                        break;
                    case 'restart': //Restarts the track
                        stopAudio(track);
                        track.play();
                        break;
                }
                return;
            }
            break;
        case 'release':
            if (track && !track.ended && audio.type == 'hold') {
                stopAudio(track); //Stop audio on release if that is what's set
            }
            break;
    }
}

function stopAudio(track) { //Stops the track
    let tmp = track.src; //Stores the current source
    track.src = ""; //Clears the source, this is what actually stops the audio
    track.src = tmp; //Restore the source for next play
}

function sendHotkey(key, action) {
    let hotkey = get(config, "keys." + key.join(",") + ".hotkey"); //Get key audio settings if they exist
    if (!hotkey || !hotkey.string) return; //Return if no settings or disabled
    let keys = hotkey.string.split(" + "); //Split hotkey string into an array
    switch (hotkey.type) {
        case 'send': //Send and release hotkeys
            if (action != 'press') return;
            kbAction(keys, 'down', () => {
                kbAction(keys, 'up');
            });
            break;
        case 'hold':
            switch (action) {
                case 'press': //Hold hotkeys
                    kbAction(keys, 'down');
                    break;
                case 'release': //Release Hotkeys
                    kbAction(keys, 'up');
                    break;
            }
            break;
    }
}

function resolveKey(key) { //Match up the different key names from the 2 different libraries we are using
    key = key.toLowerCase().replace("numpad ", "NUM");
    switch (key) {
        case 'ctrl':
            return 'control';
            break;
        case 'esc':
            return 'escape';
            break;
        case 'page up':
            return 'pageup';
            break;
        case 'page down':
            return 'pagedown';
            break;
        default:
            return key;
            break;
    }
}

function kbAction(keys, action, callback) {
    for (let i = 0; i < keys.length; i++) {
        let c = keyboard[keys[i]] || 0;
        switch (action) {
            case 'down':
                c++;
                keyboard[keys[i]] = c;
                if (c > 1) continue;
                break;
            case 'up':
                c--;
                keyboard[keys[i]] = c;
                if (c != 0) continue;
                break;
        }
        ipc.send('send_key', {key: resolveKey(keys[i]), action: action});
    }
    if (callback) callback();
}

function sendCLR(key, action) {
    if (!config.app.clr.enabled) return;
    if (action == "release") return;
    let clr = get(config, "keys." + key.join(",") + ".clr");
    if (!clr || !clr.path) return;
    clrIO.emit('key_press', {key: key.join(","), options: clr});
}
