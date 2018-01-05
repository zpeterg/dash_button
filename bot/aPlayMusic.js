var Sound = require('aplay');
var started = false;
var paused = false;
var playingIndex = 0;
var musicFiles = [
  '/media/usb/01.wav',
  '/media/usb/02.wav',
  '/media/usb/03.wav',
  '/media/usb/04.wav',
  '/media/usb/05.wav',
  '/media/usb/06.wav',
  '/media/usb/07.wav',
  '/media/usb/08.wav',
  '/media/usb/09.wav',
  '/media/usb/10.wav',
];

var audio = new Sound();
audio.stop();
 
function play(){
  if (started === true) {
    paused = false;
    audio.resume();
  } else {
    
    audio.play(musicFiles[0]);
    if (!started) {
      audio.on('complete', function() {             // Move on to next file
        playingIndex += 1;
        if (playingIndex > 10) playingIndex = 0;
        console.log('Switching to next song ' + playingIndex + '.');
        audio.play(musicFiles[playingIndex]);
      });  
    }
    paused = false;
    started = true;    
  }
}

function stop(){
  if (started === true) {
    paused = true;
    audio.pause();
  } else {
    paused = false;
    started = false;
    audio.stop();
  }
}
 
module.exports = {
  play: play,
  stop: stop,
};