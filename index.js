var dash_button = require('node-dash-button');
var curl = require('curlrequest');
var Secrets = require('./secrets.js');

var dash = dash_button([Secrets.dash1], null, null, 'all'); //address from step above
dash.on("detected", function (dash_id){
    if (dash_id === Secrets.dash1){
        console.log("Pushed it!");
        curl.request('https://maker.ifttt.com/trigger/dash_push/with/key/' + Secrets.ifttt_key, function(err, data) {
           if (err)
              console.log('error:::', err);
           console.log('data:::', data);
       });

    } 
});
