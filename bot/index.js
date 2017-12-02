var dash_button = require('node-dash-button');
var curl = require('curlrequest');
var Sound = require('aplay');
var fs = require('fs');
var Moment = require('moment');
var Secrets = require('./secrets.js');
var Settings = {
  defaultStartTime: '0:00',
  defaultDuration: 0,
  loopSeconds: 2 * 1000,
  timeFormat: 'HH:mm',
};
var debug = false;

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
  var firstPlusDuration = Moment(first).add(duration, 'm');
  if (debug) console.log(firstPlusDuration.format('DD HH:mm') + ' is ' + firstTime + ' plus ' + duration + ' and is maybe after ' + second.format('DD HH:mm'));
  var rtn = first.isBefore(second) && firstPlusDuration.isAfter(second);            // second is between first and first+duration
  return rtn;
};

//// Switch1
var switch1On = function() {
  curl.request('https://maker.ifttt.com/trigger/switch1On/with/key/' + Secrets.ifttt_key, function(err, data) {
    if (err) console.log('error:::', err);
    if (debug) console.log('data:::', data);
  });
};
var switch1Off = function() {
  curl.request('https://maker.ifttt.com/trigger/switch1Off/with/key/' + Secrets.ifttt_key, function(err, data) {
    if (err) console.log('error:::', err);
    if (debug) console.log('data:::', data);
  });
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
  if (debug) console.log('Paused sound...');
};

var resumeIt = function() {
  music.resume();
  paused = false;
  if (debug) console.log('Resuming sound...');
};

var dashListen = function() {
  var dash = dash_button([Secrets.dash1, Secrets.dash2], null, null, 'all'); //address from step above
  dash.on("detected", function (dash_id){
    if (dash_id === Secrets.dash1){
        if (debug) console.log("Pushed Emaili!");
        curl.request('https://maker.ifttt.com/trigger/dash_push/with/key/' + Secrets.ifttt_key, function(err, data) {
           if (err)
              console.log('error:::', err);
           if (debug) console.log('data:::', data);
       });
    }
    if (dash_id === Secrets.dash2){
      if (debug) console.log("Pushed Play!");
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
  ///// Play
  // Play Duration
  if (typeof state.playDuration === 'undefined') state.playDuration = Settings.defaultDuration;     // default state
  if (typeof commands.playDuration !== 'undefined' && commands.playDuration !== state.playDuration){
    state.playDuration = commands.playDuration;
  }
  // Play PlayStartedTime
  if (typeof state.playStartedTime === 'undefined') state.playStartedTime = Settings.defaultStartTime;  // default state
  if (typeof commands.playStartedTime !== 'undefined' && commands.playStartedTime !== state.playStartedTime){
    state.playStartedTime = commands.playStartedTime;
  }  
  // Consider time for play
  if (timePlusDurationIsAfterTime(state.playStartedTime, state.playDuration, getTimeStamp())) {    // Within play-time
    if (debug) console.log('Within the time limit - play it!');
    if (debug) console.log('state of playing', state.playing);
    if (!state.playing) {
      if (debug) console.log('Not playing already - play it!');
      playIt();
      state.playing = true;  
    }    
  } else {                                      // Outside the play-time
    if (debug) console.log('Outside the time-limit, STOP IT!');
    pauseIt();
    state.playing = false;
  } 
  
  ///// Switch1
  // Switch1 Duration
  if (typeof state.switch1Duration === 'undefined') state.switch1Duration = Settings.defaultDuration;     // default state
  if (typeof commands.switch1Duration !== 'undefined' && commands.switch1Duration !== state.switch1Duration){
    state.switch1Duration = commands.switch1Duration;
  }
  // Switch1StartedTime
  if (typeof state.switch1StartedTime === 'undefined') state.switch1StartedTime = Settings.defaultStartTime;  // default state
  if (typeof commands.switch1StartedTime !== 'undefined' && commands.switch1StartedTime !== state.switch1StartedTime){
    state.switch1StartedTime = commands.switch1StartedTime;
  }
  // Consider time for switch1
  if (timePlusDurationIsAfterTime(state.switch1StartedTime, state.switch1Duration, getTimeStamp())) {    // Within switch1-time
    if (debug) console.log('Within the time limit - switch1 it!');
    if (debug) console.log('state of switch1On', state.switch1On);
    if (!state.switch1On) {
      if (debug) console.log('Not switch1On already - switch1 turn-on!');
      switch1On();
      state.switch1On = true;  
    }    
  } else {                                      // Outside the switch1-time
    if (debug) console.log('Outside the time-limit, STOP SWITCH1 IT!');
    if (state.switch1On) {
      switch1Off();
      state.switch1On = false;
    }
  } 
  
  return state;
};

var think = function() {
  readFile('commands', function(commands){
    readFile('state', function(state) {
      state = thinkProcess(state, commands);
      if (debug) console.log('state:::', state);
      writeStateFile(state, function() {
        setTimeout(function(){
          think();
        }, Settings.loopSeconds);
      });
    });
  });
};
think();
