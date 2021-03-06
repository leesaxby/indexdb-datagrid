var exports = module.exports = {};

exports.startServer = function() {

    var auth = require('../auth.js').getAuth();
    var express = require('express');
    var app = express();
    var http = require('http').Server(app);

    app.use(auth);
    app.use(express.static(__dirname + '/public'));

    http.listen(80, function(){
      console.log('listening on *:80');
    });

    return http;

}
