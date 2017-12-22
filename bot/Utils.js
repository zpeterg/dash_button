var Moment = require('moment');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var Settings = require('./Settings.js');

var chooseFile = function(which) {
  return (which === 'state') ? '/home/pi/gapp_state.json' : '/home/pi/gapp_commands.json';
};

var convertCelsius = function(celsius) {
  return 1.8 * celsius + 32;
};

var getTimeStamp = function() {
  return Moment().format(Settings.timeFormat);
};

var getTimeStampBackUpALittle = function() {
  return Moment().subtract(Settings.timeStampBackUpMinutes, 'm').format(Settings.timeFormat);
};

var readFile = function(which) {
  return new Promise(function(resolve, reject) {
    fs.readFileAsync(chooseFile(which))
      .then(function(fileContents) {
        var rtn = {};
        if(fileContents) {
          try {
              rtn = JSON.parse(fileContents);       // Use the JSON, if working
          } catch(e) {
              reject('>>>>>>>There was an error reading ' + which + '.<<<<<<<<<');
          }
        }
        resolve(rtn);
      })
      .catch(function(err) {
        reject('Error reading:', err);
      });
  });
};

module.exports = {
  chooseFile: chooseFile,
  getTimeStamp: getTimeStamp,
  getTimeStampBackUpALittle: getTimeStampBackUpALittle,
  readFile: readFile,
};