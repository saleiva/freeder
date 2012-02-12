var http = require("http");
var dns = require('dns');
var fs = require('fs');
var GoogleAuthorizer = require("./modules/google_reader_auth.js").GoogleAuthorizer;

http.createServer(function(req, res) {

  var googleAuth = new GoogleAuthorizer();

  //Avoid fucking favicon requests
  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end();
    console.log('favicon requested');
    return;
  }

  if (req.url === '/article') {
    res.writeHead(200, {'Content-Type': 'text/html'} );
    fs.readFile('./views/article.html',"UTF-8", function (err, data) {
      if (err){
        throw err;
      }else{
        res.write(data);
        res.end();
      }
    });
  }

  //First of all we have to authorize on Google Reader.
  googleAuth.on('authDone', function(access_token, access_token_secret) {
    var unixTimestamp = new Date().getTime();

    //Start authentication proccess with Google Reader
    //var url = 'http://www.google.com/reader/api/0/user-info?client=freeder&ck=' + unixTimestamp;
    var url = req;
    googleAuth.oa.get(url, access_token, access_token_secret, function(error, data) {

      //Shows user data
      //console.log(JSON.parse(data));

      //TODO: Do this in a proper way
      //Fake var for the get response
      var d;

      _url = "http://www.google.com/reader/api/0/unread-count?output=json";
      googleAuth.oa.get(_url, access_token, access_token_secret, function(error, data) {
        console.log("Calling: " + _url);
        if(error){ 
          console.log('Error: ' + error.statusCode);
        }else{
          console.log('Response received');
          console.log(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(data);
          res.end();
        }
      });

    });
  });

  googleAuth.on('verificationCodeNeeded', function(url) {
    console.log('Please go to ' + url);
    console.log('Please enter the verification code:');
    process.stdin.resume();
    process.stdin.once('data', function(code) {
      googleAuth.continueAuth(code.toString().trim());
    });
  });

  googleAuth.authWithGoogle();

}).listen(8080);