var Sound = require('aplay');
  
var playIt = function() {

  // with ability to pause/resume:
  var music = new Sound();
  music.play('/home/pi/test.wav');
 
  setTimeout(function () {
      music.pause(); // pause the music after five seconds
  }, 1000);
 
  setTimeout(function () {
    music.resume(); // and resume it two seconds after pausing
  }, 2000);
 
  // you can also listen for various callbacks:
  music.on('complete', function () {
    console.log('Done with playback, starting over!');
    playIt();
  });
};

playIt();
