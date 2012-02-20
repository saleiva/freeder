//http://blog.martindoms.com/2010/01/20/using-the-google-reader-api-part-3/#comment-105
//http://blog.martindoms.com/2009/08/15/using-the-google-reader-api-part-1/
//http://timbroder.com/2007/08/google-reader-api-functions.html
//http://blog.martindoms.com/2010/01/20/using-the-google-reader-api-part-3/#comment-105
//http://groups.google.com/group/fougrapi
//http://code.google.com/p/google-reader-api/wiki/Authentication

/**
* Module dependencies.
*/

var express = require('express')
var routes = require('./routes');
var querystring = require('querystring');
var http = require('http');
var fs = require('fs');

var app = module.exports = express.createServer();
// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'html');
    app.set("view options", {layout: false});
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));

    //Make a custom html template
    //Be able to render HTML files - No templates
    app.register('.html', {
        compile: function(str, options){
            return function(locals){
                return str;
            };
        }
    });
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

var Auth ="";
var user_email = "your_username";
var user_pwd = "your_pwd";



function getAuth(){
    _url = "https://www.google.com/accounts/ClientLogin?service=reader&Email="+user_email+"&Passwd="+user_pwd;
    
    var options = {host: 'www.google.com', port: 80, path: _url, method: 'GET'};

    http.get(options, function(resp) {
        data = "";
        resp.on('data', function (chunk) {
            data +=chunk;
        });
        resp.on('end', function () {
            Auth = data.substring(data.indexOf("Auth=")+5).replace('\n','');
        });
        resp.on('error', function(e) {
            console.log("Got error: " + e.message);
        });
    });
}

// Routes
app.get('/', function(req, res){
    res.render('index');
    getAuth();
});

app.get('/articles', function(req, res){
    res.render('articles');
});

app.get('/get/:query', function(req, res){

    if (req.params.query === "unread-count"){
        _url = "http://www.google.com/reader/api/0/unread-count?output=json";
    }else if (req.params.query === "subscription-list"){
        _url = "http://www.google.com/reader/api/0/subscription/list?output=json";
    };

    var options = {
        host: 'www.google.com',
        port: 80,
        path: _url,
        method: 'GET',
        headers: {
            'Authorization': 'GoogleLogin auth='+ Auth
        }
    };

    http.get(options, function(resp) {
        data = "";
        resp.on('data', function (chunk) {
            data +=chunk;
        }); 
        resp.on('end', function () {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(data);
            res.end();
        });
        resp.on('error', function(e) {
            console.log("Got error: " + e.message);
        });
    });


});

app.get('/get/feed/:url', function(req, res){
    _url = "http://www.google.com/reader/api/0/stream/contents/"+decodeURIComponent(req.params.url)+"?&r=n&xt=user/-/state/com.google/read&n=100";
    var options = {
        host: 'www.google.com',
        port: 80,
        path: _url,
        method: 'GET',
        headers: {
            'Authorization': 'GoogleLogin auth='+ Auth
        }
    };

    http.get(options, function(resp) {
        data = "";
        resp.on('data', function (chunk) {
            data +=chunk;
        }); 
        resp.on('end', function () {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(data);
            res.end();
        });
        resp.on('error', function(e) {
            console.log("Got error: " + e.message);
        });
    });

});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
