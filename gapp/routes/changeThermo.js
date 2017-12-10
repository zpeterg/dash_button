var express = require('express');
var router = express.Router();
var thermoThink = require('./_thermoThink');

// Allow cross-origin requests
router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/* POST */ 
router.get('/which/:which/degrees/:degrees', function (req, res) {
  var which = req.params.which;
  var degrees = req.params.degrees;
  if (which !== 'increase' && which !== 'decrease') {
    res.send('error: invalid Which sent ' + which + '.');
    return true;
  }
  if (isNaN(degrees)) {
    res.send('error: invalid Degrees sent - ' + degrees + '.');
    return true;
  }
  degrees = Math.round(degrees);
  thermoThink(which, degrees) 
    .then(function() {
      res.send('success');
    })
    .catch(function(err) {
      res.send('error:' + err);
    });
});

module.exports = router;

