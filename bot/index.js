var curl = require('curlrequest');
var Sound = require('aplay');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var Moment = require('moment');
var Secrets = require('./secrets.js');
var Settings = require('./Settings.js');
var DashListen = require('./DashListen.js');
var Utils = require('./Utils.js');

var playing = false;
var paused = false;
var music = new Sound();

var writeStateFile = function(data) {
  return fs.writeFileAsync(Utils.chooseFile('state'), JSON.stringify(data));
};


// Compare two dates, with a duration of minutes added to first
var timePlusDurationIsAfterTime = function(firstTime, duration, secondTime) {
  var first = Moment(firstTime, Settings.timeFormat);
  var second = Moment(secondTime, Settings.timeFormat);
  var firstPlusDuration = Moment(first).add(duration, 'm');
  if (Settings.debug) console.log(firstPlusDuration.format('DD HH:mm') + ' is ' + firstTime + ' plus ' + duration + ' and is maybe after ' + second.format('DD HH:mm'));
  var rtn = first.isBefore(second) && firstPlusDuration.isAfter(second);            // second is between first and first+duration
  return rtn;
};

//// Switch1
var switch1On = function() {
  return new Promise(function(resolve, reject) {
    curl.request('https://maker.ifttt.com/trigger/switch1On/with/key/' + Secrets.ifttt_key, function(err, data) {
      if (err) reject('Error with switch1On curl', err);
      if (Settings.debug) console.log('data:::', data);
      resolve();
    });
  });
};
var switch1Off = function() {
  return new Promise(function(resolve, reject) {
    curl.request('https://maker.ifttt.com/trigger/switch1Off/with/key/' + Secrets.ifttt_key, function(err, data) {
      if (err) reject('Error with switch1Off curl', err);
      if (Settings.debug) console.log('data:::', data);
      resolve();
    });
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
  if (Settings.debug) console.log('Paused sound...');
};

var resumeIt = function() {
  music.resume();
  paused = false;
  if (Settings.debug) console.log('Resuming sound...');
};




// Main think process
var thinkProcess = function(state, commands) {
  var thinkExecution = [];                    // list of promises to run at the end
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
  if (timePlusDurationIsAfterTime(state.playStartedTime, state.playDuration, Utils.getTimeStamp())) {    // Within play-time
    if (Settings.debug) console.log('Within the time limit - play it!');
    if (Settings.debug) console.log('state of playing', state.playing);
    if (!state.playing) {
      if (Settings.debug) console.log('Not playing already - play it!');
      playIt();
      state.playing = true;  
    }    
  } else {                                      // Outside the play-time
    if (Settings.debug) console.log('Outside the time-limit, STOP IT!');
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
  if (timePlusDurationIsAfterTime(state.switch1StartedTime, state.switch1Duration, Utils.getTimeStamp())) {    // Within switch1-time
    if (Settings.debug) console.log('Within the time limit - switch1 it!');
    if (Settings.debug) console.log('state of switch1On', state.switch1On);
    if (!state.switch1On) {
      if (Settings.debug) console.log('Not switch1On already - switch1 turn-on!');
      thinkExecution.push(switch1On().then(state.switch1On = true));
    }    
  } else {                                      // Outside the switch1-time
    if (Settings.debug) console.log('Outside the time-limit, STOP SWITCH1 IT!');
    if (state.switch1On) {
      thinkExecution.push(switch1Off().then(state.switch1On = false));
    }
  } 
  
  return new Promise(function(resolve, reject) {
    Promise.all(thinkExecution)
      .then(function() {
        resolve(state);                     // return the global state after all modifications
      })
      .catch(function(err) {
        reject('Error in ThinkProcess:', err);
      });
  });
};

var think = function() {
  return new Promise(function(resolve, reject) {
    Promise.all([
      Utils.readFile('commands'), 
      Utils.readFile('state')
    ])
      .then(function(results) {
        
        return thinkProcess(results[1], results[0])         // get thinkProcess
          .then(function(state) {
            if (Settings.debug) console.log('state:::', state);
            return writeStateFile(state)
              .then(function() {
                setTimeout(function(){
                  think()
                    .then(function() {
                      resolve();
                    })
                    .catch(function(err) {
                      reject('Error in Think', err);
                    });
                }, Settings.loopSeconds);
              });
          });
      });
  });
};
DashListen();                 // start listeners
think();                      // Start loop
