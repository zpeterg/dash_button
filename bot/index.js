var curl = require('curlrequest');
var Sound = require('aplay');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var Moment = require('moment');
var Si7021 = require('si7021-sensor');
var Secrets = require('./secrets.js');
var Settings = require('./Settings.js');
var DashListen = require('./DashListen.js');
var Utils = require('./Utils.js');

var playing = false;
var paused = false;
var music = new Sound();
var changingThermo = false;
var constThermoAdjust = {
  adjustHistory: [],
  adjustToTemp: 0,
  blockAdjust: true,
  timeoutAdjust: null,
};

// Setup sensor 
var si7021 = new Si7021({ i2cBusNo: 1 });

///// Thermo adjust temp
var wipeTimeout = function() {
  clearTimeout(constThermoAdjust.timeoutAdjust);
  constThermoAdjust.timeoutAdjust = null;
};
var thermoIsExcursion = function(adjust) {
  var total = 0;
  constThermoAdjust.adjustHistory.map(function(o) { total += +o });
  total += +adjust;                                                              // get the total, including the new adjustment (so that corrections back down are allowed)
  var rtn = total > Settings.adjustHistoryDownLimit & total < Settings.adjustHistoryUpLimit;       // the temp hasn't been adjusted outside the excursion limits
  if (Settings.debug) {
    console.log('The total for the adjustHistory ' + JSON.stringify(constThermoAdjust.adjustHistory) + ' is ' + total + ' resulting in answer ' + rtn);
  }
  return rtn; 
};
var thermoAdjustLimit = function(adjust) {
  var rtn = 0;
  if (adjust > 0.9) return 1;
  else if (adjust < -0.9) return -1;
  var isExcursion = thermoIsExcursion(rtn);
  return isExcursion ? 0 : rtn;                   // Don't adjust if there's been an excursion
};
var thermoAdjustTemp = function(currTemp) {
  if (constThermoAdjust.blockAdjust) return 0;
  constThermoAdjust.blockAdjust = true;
  wipeTimeout();
  var rtn = thermoAdjustLimit(constThermoAdjust.adjustToTemp - currTemp);
  constThermoAdjust.adjustToTemp = 0;
  constThermoAdjust.adjustHistory.push(rtn);                // Add to history
  if (constThermoAdjust.adjustHistory.length > Settings.adjustTempHistoryLimit) {
    constThermoAdjust.adjustHistory = constThermoAdjust.adjustHistory.shift();              // remove earliest from history
  }
  return rtn;
};
var thermoAdjustTempSet = function(minutes, force) {
  if (!force && constThermoAdjust.timeoutAdjust !== null) return true;          // Defer to currently running, unless forcing
  if (force && constThermoAdjust.timeoutAdjust !== null) wipeTimeout();         // If something running & forcing, cancel what's running
  constThermoAdjust.timeoutAdjust = setTimeout(function() {
    si7021.readSensorData()
      .then((data) => {
        console.log(`data = ${JSON.stringify(data, null, 2)}`);
        console.log(`temp = ${Utils.convertCelsius(data.temperature_C)}`);
        
        constThermoAdjust.blockAdjust = false;                    // allow adjustment to happen
        constThermoAdjust.adjustToTemp = Math.round(Utils.convertCelsius(data.temperature_C));      // record new temp
      })
      .catch((err) => {
        console.log(`Si7021 read error: ${err}`);
      });
  }, minutes * 60 * 1000);
};


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
var nowIsBetweenTimes = function(firstTime, secondTime) {
  var first = Moment(firstTime, Settings.timeFormat);
  var second = Moment(secondTime, Settings.timeFormat);
    var now = Moment();
  if (second.isBefore(first)) {         // If second is before first, presume one is supposed to be on a different day
    if (first.isAfter(now) && second.isAfter(now)) first.subtract(1, 'day');    // If both after now, more first to yesterday
    else if (first.isBefore(now) && second.isBefore(now)) second.add(1, 'day');             
  }
  if (Settings.debug) console.log('now is checking for between ' + first.format('DD HH:mm') + ' and ' + second.format('DD HH:mm'));
  var rtn = now.isBetween(first, second);
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

//// Thermo
var setThermo = function(currTemp, newTemp) {
  if (Settings.debug) console.log('------ Start of setting thermo -----');
  changingThermo = true;                          // block out double-calls
  let which = 'increase';
  const degrees = Math.abs(newTemp - currTemp);
  if (newTemp < currTemp) which = 'decrease';
  if (Settings.debug) console.log('------ About to set thermo -----');
  return new Promise(function(resolve, reject) {
    const callUrl = 'http://localhost/changeThermo/which/' + which + '/degrees/' + degrees + '/';
    curl.request(
      callUrl, 
      function(err, data) {
        changingThermo = false;                   // allow next call
        if (err) {
          if (Settings.debug) console.log('Error with setThermo curl for ' + callUrl + ':', err);
          reject('Error with setThermo curl for ' + callUrl + ':' + err);
        }
        if (data !== 'success') {
          if (Settings.debug) console.log('setThermo curl failed with response for ' + callUrl + ':', data);
          reject('setThermo curl failed with response for ' + callUrl + ':' + data);
        }
        if (Settings.debug) console.log('setThermo result:::', data);
        resolve();
      }
    );
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

var ifPresentAndDifferent = function(propName, state, commands) {
  if (typeof commands[propName] !== 'undefined' && commands[propName] !== state[propName]){
    state[propName] = commands[propName];
  }
  return state;
};

var processTemp = function(tempName, state, commands) {
  if (typeof state[tempName] === 'undefined') state[tempName] = Settings.defaultTemp;
  if (commands[tempName] < Settings.tempMin || commands[tempName] > Settings.tempMax) return state;                 // refuse to process if temp out of range
  return ifPresentAndDifferent(tempName, state, commands);
};
var processTime = function(timeName, state, commands) {
  if (typeof state[timeName] === 'undefined') state[timeName] = Settings.defaultStartTime;
  return ifPresentAndDifferent(timeName, state, commands);
};


// Main think process
var thinkProcess = function(state, commands) {
  var thinkExecution = [];                    // list of promises to run at the end

  ///// Thermo adjust temp
  var adjustDiffTemp = thermoAdjustTemp(state.thermoTemp);
  if (Settings.debug) console.log('temp to adjust to ' + adjustDiffTemp + ' and current is ' + state.thermoTemp + '.');
  var adjustTemp = +state.thermoTemp + thermoAdjustLimit(adjustDiffTemp);
  if (Settings.debug) console.log('temp after adjust limit is ' + adjustTemp);
  state.thermoTemp = adjustTemp;          // check for updates
  thermoAdjustTempSet(Settings.adjustTempDelayNormal);            // 
  
  ///// Thermo
  state = processTemp('thermo0Temp', state, commands);
  state = processTemp('thermo1Temp', state, commands);
  state = processTime('thermo1StartedTime', state, commands);
  state = processTime('thermo1EndedTime', state, commands);
  state = processTemp('thermoOutingTemp', state, commands);
  state = processTemp('thermoBoostTemp', state, commands);
  state = processTime('thermoBoostStartedTime', state, commands);
  if (typeof state.thermoOutingOn === 'undefined') state.thermoOutingOn = false;
  if (typeof commands.thermoOutingOn !== 'undefined' && commands.thermoOutingOn !== state.thermoOutingOn) {
    state.thermoOutingOn = commands.thermoOutingOn;
  } 
  
  // OutingOn
  var isThermoBetween = nowIsBetweenTimes(state.thermo1StartedTime, state.thermo1EndedTime);
  if (!changingThermo && state.thermoOutingOn && state.thermoTemp !== state.thermoOutingTemp) {             // If On Outing & not there already
    if (Settings.debug) console.log('Changing thermo to OutingTemp: ' + state.thermoOutingTemp);
    thinkExecution.push(
      setThermo(state.thermoTemp, state.thermoOutingTemp)              // Set temp to OutingTemp
        .then(function() {
          console.log('Set thermoOuting as ' + state.thermoOutingTemp + '.');
          state.thermoTemp = state.thermoOutingTemp;
        })
    );
  }                                                                                 // If not On Outing      
  // Change to current temp0
  if (!changingThermo 
    && !state.thermoOutingOn 
    && !isThermoBetween
    && state.thermoTemp !== state.thermo0Temp
  ) {                     // Simply set the tempto thermo0
    if (Settings.debug) console.log('Changing thermo to Temp0: ' + state.thermo0Temp);
    thinkExecution.push(setThermo(
      state.thermoTemp, state.thermo0Temp)
        .then(function() {
          state.thermoTemp = state.thermo0Temp;
          thermoAdjustTempSet(Settings.adjustTempDelay, true);                          // set timeout to adjust temp later
          console.log('Set baseline temp as ' + state.thermo0Temp + '.');
        })
    );
  }
  // Change to Time Span temp
  if (!changingThermo 
    && !state.thermoOutingOn 
    && state.thermoTemp !== state.thermo1Temp 
    && isThermoBetween
  ){
    thinkExecution.push(
      setThermo(state.thermoTemp, state.thermo1Temp)
        .then(function() {
          state.thermoTemp = state.thermo1Temp;
          console.log('Set Time Span temp as ' + state.thermo1Temp + '.');
        })
    );
  }
  
  
  ///// Play
  // Play Duration
  if (typeof state.playDuration === 'undefined') state.playDuration = Settings.defaultDuration;     // default state
  state = ifPresentAndDifferent('playDuration', state, commands);
  // Play PlayStartedTime
  if (typeof state.playStartedTime === 'undefined') state.playStartedTime = Settings.defaultStartTime;  // default state
  state = ifPresentAndDifferent('playStartedTime', state, commands);
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
              })
              .catch(function(err) {
                reject('Error coming back from writeStateFile:' + err);
              });
          })
          .catch(function(err) {
            reject('Error coming back from thinkProcess:' + err);
          });
      })
      .catch(function(err) {
        reject('Error coming back from file reading:' + err);
      });
  });
};
DashListen();                 // start listeners
think()
  .catch(function(err) {
    console.log('Error at top:', err);
  });                      // Start loop
