var dash_button = require('node-dash-button');
var fs = require('fs');
var Moment = require('moment');
var Secrets = require('./secrets.js');
var Settings = require('./Settings.js');
var Utils = require('./Utils.js');

var writeCommandsFile = function(data, callback) {
  if (Settings.debug) console.log('---- Commands about to written by DashListen --', JSON.stringify(data));
  fs.writeFile(Utils.chooseFile('commands'), JSON.stringify(data), function(errWrite, fileContents) {
    if (errWrite) return console.log('Error writing', errWrite);
    callback();
  });
};

var decideCommands = function(whichDash, state) {
  var commands = {};
  if (whichDash === 'play') {                                       // if playing or stopping
    if (Settings.debug) console.log('Playing...');
    if (state.playing) {                                          // if playing already, pause it
      if (Settings.debug) console.log('... pause the play');
      commands.playStartedTime = Settings.defaultPlayStartTime;
    } else {                                                      // if stopped, start playing
      if (Settings.debug) console.log('... actually play');
      commands.playStartedTime = Utils.getTimeStampBackUpALittle();
    }
    if (state.playDuration < Settings.defaultPlayDuration) {          // Default to minimum of default-duration
      commands.playDuration = Settings.defaultPlayDuration;
    }
  }
  else if (whichDash === 'switch1') {
    if (Settings.debug) console.log('Switching Switch1');
    if (state.switch1On) {                                          // if playing already, pause it
      commands.switch1StartedTime = Settings.defaultSwitch1StartTime;
    } else {                                                      // if stopped, start playing
      commands.switch1StartedTime = Utils.getTimeStampBackUpALittle();
    }
    if (state.switch1Duration < Settings.defaultSwitch1Duration) {          // Default to minimum of default-duration
      commands.switch1Duration = Settings.defaultSwitch1Duration;
    }
  }
  return commands;
}

var thinkDash = function(whichDash) {
  Utils.readFile('state', function(state) {
    if (Settings.debug) console.log('state:::', state);
    var commands = decideCommands(whichDash, state);
    writeCommandsFile(commands, function() {
      console.log('Done with writing commands for dash-push ' + whichDash + '.');
    });
  });
};

module.exports = function() {
  var dash = dash_button([Secrets.dash1, Secrets.dash2], null, null, 'all'); //address from step above
  dash.on("detected", function (dash_id){
    if (dash_id === Secrets.dash1) {
      thinkDash('play')
    } else if (dash_id === Secrets.dash2) {
      thinkDash('switch1');
    }  
  });
};