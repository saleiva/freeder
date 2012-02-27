//http://blog.martindoms.com/2010/01/20/using-the-google-reader-api-part-3/#comment-105
//http://blog.martindoms.com/2009/08/15/using-the-google-reader-api-part-1/
//http://timbroder.com/2007/08/google-reader-api-functions.html
//http://groups.google.com/group/fougrapi
//http://code.google.com/p/google-reader-api/wiki/Authentication
//http://code.google.com/p/google-reader-gadget/source/browse/trunk/edit.js
//http://undoc.in/googlereader.html

/**
* Module dependencies.
*/

var express = require('express')
var routes = require('./routes');
var querystring = require('querystring');
var http = require('http');
var fs = require('fs');

var aUrl = ["https://www.google.com/accounts/ClientLogin?service=reader&",
            "http://www.google.com/reader/api/0/token",
            "http://www.google.com/reader/api/0/unread-count?output=json",
            "http://www.google.com/reader/api/0/subscription/list?output=json",
            "http://www.google.com/reader/api/0/stream/contents/",
            "/reader/api/0/edit-tag?client=freeder"]

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

// Routes
app.get('/', function(req, res){
    res.render('home');
});

app.get('/articles', function(req, res){
    res.render('articles');
});

app.get('/login/:email/:pwd', function(req, res){   
    
    function sendError(r){
        r.writeHead(200, { 'Content-Type': 'text/plain' });   
        r.write("KO");
        r.end();
    }

    if(req.params.email != "" && req.params.pwd !=""){
        _urlAuth = aUrl[0] +"Email="+req.params.email+"&Passwd="+req.params.pwd;
        var options = {host: 'www.google.com', port: 80, path: _urlAuth, method: 'GET'};

        http.get(options, function(resp) {
            data = "";
            resp.on('data', function (chunk) {
                data +=chunk;
            });
            resp.on('end', function () {
                if(data.indexOf("Auth=") != -1){
                    auth = data.substring(data.indexOf("Auth=")+5).replace('\n','');
                    _urlToken = aUrl[1];
                    var options = {host: 'www.google.com', port: 80, path: _urlToken, method: 'GET', headers: {'Authorization': 'GoogleLogin auth='+ auth}};
                    http.get(options, function(resp) {
                        token = "";
                        resp.on('data', function (chunk) {
                            token +=chunk;
                        });
                        resp.on('end', function () {
                            res.setHeader("Auth_token", auth);
                            res.setHeader("Action_token", token);
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.write("OK");
                            res.end();
                        });
                        resp.on('error', function(e) {
                            sendError(res);
                        });
                    });
                }else{
                    sendError(res);
                }
            });
            resp.on('error', function(e) {
                sendError(res);
            });
        });
    }else{
        console.log("Google username / password are empty");
        sendError(res);
    }
});

app.get('/get/:query', function(req, res){

    if (req.params.query === "unread-count"){
        _url = aUrl[2];
    }else if (req.params.query === "subscription-list"){
        _url = aUrl[3];
    };

    var options = {
        host: 'www.google.com',
        port: 80,
        path: _url,
        method: 'GET',
        headers: {
            'Authorization': 'GoogleLogin auth='+ req.headers['auth_token']
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

app.get('/get/feed/:url/:unread', function(req, res){
    _url = aUrl[4]+decodeURIComponent(req.params.url)+"?&r=n&n=100";
    if(req.params.unread=="t"){
        _url += "&xt=user/-/state/com.google/read";
    }
    var options = {
        host: 'www.google.com',
        port: 80,
        path: _url,
        method: 'GET',
        headers: {
            'Authorization': 'GoogleLogin auth='+ req.headers['auth_token']
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

//MARK AS READ SERVICE
app.get('/markasread/:url/:pid', function(req, res){

    var post_data = "a=user/-/state/com.google/read&r=user/-/state/com.google/kept-unread&async=true&s="+req.params.url+"&i="+req.params.pid+"&T="+req.headers['action_token'].substring(2);
    var post_options = {
        host: 'www.google.com',
        port: 80,
        path: aUrl[5],
        method: 'POST',
        headers: {
            'Authorization': 'GoogleLogin auth='+ req.headers['auth_token'],
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': post_data.length
        }
    };
    var post_req = http.request(post_options, function(resp) {
        data = "";
        resp.on('data', function (chunk) {
            data += chunk;
        });
        resp.on('end', function (){
            if (data == "OK"){
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.write(data);
                res.end();
            }
        });
    });
    post_req.write(post_data);
    post_req.end();

});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
