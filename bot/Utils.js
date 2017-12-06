var Moment = require('moment');
var fs = require('fs');
var Settings = require('./Settings.js');

var chooseFile = function(which) {
  return (which === 'state') ? '/home/pi/gapp_state.json' : '/home/pi/gapp_commands.json';
};

var getTimeStamp = function() {
  return Moment().format(Settings.timeFormat);
};

var getTimeStampBackUpALittle = function() {
  return Moment().subtract(Settings.timeStampBackUpMinutes, 'm').format(Settings.timeFormat);
};

var readFile = function(which, callback) {
  fs.readFile(chooseFile(which), function(errRead, fileContents) {
    if (errRead) return console.log('Error reading', errRead);
    var rtn = {};
    if(fileContents) {
      try {
          rtn = JSON.parse(fileContents);       // Use the JSON, if working
      } catch(e) {
          console.log('>>>>>>>There was an error reading ' + which + '.<<<<<<<<<');
      }
    }
    callback(rtn);
  });
};

module.exports = {
  chooseFile: chooseFile,
  getTimeStamp: getTimeStamp,
  getTimeStampBackUpALittle: getTimeStampBackUpALittle,
  readFile: readFile,
};