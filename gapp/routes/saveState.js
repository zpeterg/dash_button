var express = require('express');
var router = express.Router();
var fs = require('fs');

// Allow cross-origin requests
router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/* POST */ 
router.post('/', function (req, res) {
  // Write commands
  fs.writeFile('/home/pi/gapp_commands.json', JSON.stringify(req.body), function(err) {
    if (err) return console.log('Error saving', err);
    // Read/return state
    fs.readFile('/home/pi/gapp_state.json', function(errRead, fileContents) {
      if (errRead) return console.log('Error reading', errRead);
      res.send(fileContents);
    });
  });
});

module.exports = router;

