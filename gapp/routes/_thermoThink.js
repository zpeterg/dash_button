var Gpio = require('onoff').Gpio;
var Settings = require('./Settings.js');
var relayUp = new Gpio(4, 'out');
relayUp.writeSync(Settings.gpioOff);                                                 // Turn-off by default
var relayDown = new Gpio(17, 'out');
relayDown.writeSync(Settings.gpioOff);                                               // Turn-off by default
var Promise = require("bluebird");
var prePush = true;                                                    // If true, push once before
                                                                        // To switch display on thermostat
var prePushTimeout;
  
// Function for setting out the timeout above
var setPrePushTimeout = function() {
  clearTimeout(prePushTimeout);
  prePushTimeout = setTimeout(function() {                                           // Set timeout for which display reverts
    prePush = true;
  }, Settings.prePushPause);
};  
  
var thinkLoop = function(thisRelay, degreesLeft, callback) {
  try {
    if (degreesLeft > 0) {
      setTimeout(function() {                                           // pad
        prePush = false;
        thisRelay.writeSync(Settings.gpioOn);                                         // start press
        setTimeout(function() {
          thisRelay.writeSync(Settings.gpioOff);                                       // stop press
          setTimeout(function() {                                       // pad
            thinkLoop(thisRelay, degreesLeft -= 1, callback);           // loop for next
          }, Settings.timePressPadding);
        }, Settings.timePress);
      }, Settings.timePressPadding) 
    }
    else {                                                              // Reached goal
      callback();
    }
  }
  catch(err) {                                      // error
    callback('error: ' + err);
  }
};

var prePushThenLoop = function(thisRelay, degreesLeft, callback) {
  function triggerIt() {
    thinkLoop(thisRelay, degreesLeft, function() {
      setPrePushTimeout();
      callback();
    });
  }
  if (prePush) {                                                        // thermostat display is sleeping
    thinkLoop(relayUp, 1, function(err) {                               // If waking up, click once
      if (err) callback('Error on prepush: ' + err);
      triggerIt();
    })
  }
  else {                                                                // display already active
    triggerIt();
  }
};

var think = function(which, degrees) {
  return new Promise(function(resolve, reject) {
    
    var thisRelay = (which === 'increase') ? relayUp : relayDown;
    
    prePushThenLoop(thisRelay, degrees, function(err) {
      if (err) reject(err);                     // fail if error
      resolve();                                // success
    });
  }); 
};
                                             // Close relay when finished
/*
console.log('starting---');
relayUp.writeSync(1);

setTimeout(function() {
  console.log('push button...');
  relayUp.writeSync(0);

  setTimeout(function() {
    console.log('release button...');
    relayUp.writeSync(1);

    setTimeout(function() {
      console.log('...stopping');
      relayUp.unexport();
      return true;
    }, 2000);
  }, 100);

}, 2000);
*/

module.exports = think;