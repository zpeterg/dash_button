var curl = require('curlrequest');
 
curl.request('http://google.com', function(err, data) {
   if (err)
       console.log('error:::', err);
   console.log('data:::', data);
});
