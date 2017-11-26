var Sound = require('node-aplay');

// with ability to pause/resume: 
var music = new Sound('~/test.wav');
music.play();
/*
setTimeout(function () {
    music.pause(); // pause the music after five seconds 
}, 5000);

setTimeout(function () {
    music.resume(); // and resume it two seconds after pausing 
}, 7000);
*/
// you can also listen for various callbacks: 
music.on('complete', function () {
    console.log('Done with playback!');
});
