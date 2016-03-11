#ControlCast
A Launchpad Mini desktop application for streamers

<img src="http://dbkynd.com/l/3KIwh" width="400">

##What does it do?
ControlCast allows you to take control of your broadcast with the Launchpad Mini with hotkeys and also functions as a soundboard. 

Future plans for an internal CLR browser for displaying images on screen via an overlay.

##How does it work?
Most streaming softwares (OBS, XSplit) let you bind hotkeys to perform certain tasks when streaming to services like Twitch. Tasks like Start/Stop the stream, switching scenes, and muting your microphone. And 3rd party voice services often offer toggle to mute or hold to mute keybinds. (Discord, Skype, Teamspeak) 

With ControlCast you Edit the Midi Key to ``Send`` or ``Hold`` a configured hotkey. Or select an audio file to be played. Audio can be played in 4 different methods by selecting the desired functions. (``On Release`` & ``On Press While Still Playing``)

* Playthrough (``Keep Playing`` & ``Do Nothing``) Waits until the track is finished before starting again not matter how many times you press the midi key.
* Restart (``Keep Playing`` & ``Restart``) Restarts the track at the beginning every time you press the midi key.
* Toggle (``Keep Playing`` & ``Stop Playing``) Toggles the track on and off.
* Hold to Play (``Stop Playing`` & ``*``) Pressing the midi key will start the track and releasing the midi key will stop the track.

Artwork and beta testing by Annemunition
