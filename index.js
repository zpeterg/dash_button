var dash_button = require('node-dash-button');
var curl = require('curlrequest');
var Sound = require('aplay');
var Secrets = require('./secrets.js');

var playing = false;
var paused = false;
var music = new Sound();
var playIt = function() {

  // with ability to pause/resume:
  music.play('/home/pi/test.wav');

  // you can also listen for various callbacks:
  if (!playing) {                                // Only set listener the first time
    music.on('complete', function () {
      playIt();
    });
  }
  playing = true;
};

// Toggle-function that pauses/resumes the music per above
var pauseIt = function() {
  if (!paused) {
    music.pause();
    paused = true;
    console.log('Paused sound...');
  } else {
    music.resume();
    paused = false;
    console.log('Resuming sound...');
  }
}

var dash = dash_button([Secrets.dash1, Secrets.dash2], null, null, 'all'); //address from step above
dash.on("detected", function (dash_id){
  if (dash_id === Secrets.dash1){
      console.log("Pushed Emaili!");
      curl.request('https://maker.ifttt.com/trigger/dash_push/with/key/' + Secrets.ifttt_key, function(err, data) {
         if (err)
            console.log('error:::', err);
         console.log('data:::', data);
     });
  }
  if (dash_id === Secrets.dash2){
    console.log("Pushed Play!");
    if (playing) {
      pauseIt();
    } else {
      playIt();
    }
  }
});

