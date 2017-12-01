var dash_button = require('node-dash-button');
var curl = require('curlrequest');
var Sound = require('aplay');
var fs = require('fs');
var Moment = require('moment');
var Secrets = require('./secrets.js');
var Settings = {
  timeFormat: 'HH:mm',
};

var playing = false;
var paused = false;
var music = new Sound();

var chooseFile = function(which) {
  return (which === 'state') ? '/home/pi/gapp_state.json' : '/home/pi/gapp_commands.json';
};

var readFile = function(which, callback) {
  fs.readFile(chooseFile(which), function(errRead, fileContents) {
      if (errRead) return console.log('Error reading', errRead);
      callback(JSON.parse(fileContents));
    });
};

var writeStateFile = function(data, callback) {
  fs.writeFile(chooseFile('state'), JSON.stringify(data), function(errRead, fileContents) {
      if (errRead) return console.log('Error reading', errRead);
      callback();
    });
};

var getTimeStamp = function() {
  return Moment().format(Settings.timeFormat);
};

// Compare two dates, with a duration of minutes added to first
var timePlusDurationIsAfterTime = function(firstTime, duration, secondTime) {
  var first = Moment(firstTime, Settings.timeFormat);
  var second = Moment(secondTime, Settings.timeFormat);
  first.add(duration, 'm');
  console.log(first.format('DD HH:mm'), second.format('DD HH:mm'));
  var rtn = first.isAfter(second);
  return rtn;
};

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
  music.pause();
  paused = true;
  console.log('Paused sound...');
};

var resumeIt = function() {
  music.resume();
  paused = false;
  console.log('Resuming sound...');
};

var dashListen = function() {
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
};


// Main think process
var thinkProcess = function(state, commands) {
  // Play Duration
  if (commands.playDuration !== state.playDuration){
    state.playDuration = commands.playDuration;
  }
  // Playing
  if (commands.playing && !state.playing) {
    playIt();
    state.playing = true;
    state.playStartedTime = getTimeStamp();           // timestamp the start
  }
  else if (typeof commands.playing !== 'undefined' && (!commands.playing && state.playing)) {      // if changing playing state to false
    pauseIt();
    state.playing = false;
  }
  console.log('------');
  // Consider time
  if (timePlusDurationIsAfterTime(state.playStartedTime, state.playDuration, getTimeStamp())) {    // Within play-time
    console.log('Within the time limit - play it!');
    console.log('state of playing', state.playing);
    if (!state.playing) {
      console.log('Not playing already - play it!');
      playIt();
      state.playing = true;  
    }    
  } else {                                      // Outside the play-time
    console.log('Outside the time-limit, STOP IT!');
    pauseIt();
    state.playing = false;
  } 
  
  return state;
};

var think = function() {
  readFile('commands', function(commands){
    readFile('state', function(state) {
      state = thinkProcess(state, commands);
      console.log('state:::', state);
      writeStateFile(state, function() {
        setTimeout(function(){
          console.log('Finished writing --');
          think();
        }, 5000);
      });
    });
  });
};
think();
