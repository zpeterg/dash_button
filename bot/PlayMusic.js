var player = require('play-sound')(opts = {})
var audio = null;
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

 
function play(){
  audio = player.play(['/media/usb/02.wav'], function(err){
    if (err && !err.killed) console.log('There was an audio error:', err);
  });
}

function stop(){
  if (audio !== null){
    audio.kill();
  }
}
 
module.exports = {
  play: play,
  stop: stop,
};