var player = require('play-sound')(opts = {})
var audio = null;
var musicFiles = [
  '/media/usb/02.wav',
  '/media/usb/03.wav',
];

 
function play(){
  audio = player.play(['/media/usb/02.wav'], function(err){
    if (err && !err.killed) console.log('There was an audio error:', err);
  });
}

function stop(){
  if (audio !== null){
    audio.kill();
    audio = null;
  }
}
 
module.exports = {
  play: play,
  stop: stop,
};