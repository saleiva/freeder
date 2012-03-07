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
, routes = require('./routes')
, querystring = require('querystring')
, http = require('http')
, https = require('https')
, fs = require('fs')
, everyauth = require('everyauth')
, connect = require('connect')
, everyauthRoot = __dirname + '/..';

everyauth.debug = true;

var usersByGoogleId = {};

// everyauth.everymodule.moduleTimeout(-1); // to turn off timeouts

everyauth.everymodule
.findUserById( function (id, callback) {
    callback(null, usersById[id]);
});

// TODO: move appID and appSecret to configuration file
everyauth.google
.myHostname('http://localhost:3000')
.appId('922312178735.apps.googleusercontent.com')
.appSecret('QSBzmYitaoUPhr_kOXopjGgA')
.scope('https://www.googleapis.com/auth/userinfo.email http://www.google.com/reader/api')
.findOrCreateUser( function (sess, accessToken, extra, googleUser) {
    googleUser.refreshToken = extra.refresh_token;
    googleUser.expiresIn = extra.expires_in;
    sess.accessToken = accessToken;
    return usersByGoogleId[googleUser.id] || (usersByGoogleId[googleUser.id] = googleUser);
})
.redirectPath('/read');

// TODO: use a hash instead for the urls so we can invoke the URL using an string handler and not a number 
var aUrl = ["https://www.google.com/accounts/ClientLogin?service=reader&",
"http://www.google.com/reader/api/0/token",
"http://www.google.com/reader/api/0/unread-count?output=json",
"http://www.google.com/reader/api/0/subscription/list?output=json",
"http://www.google.com/reader/api/0/stream/contents/",
"/reader/api/0/edit-tag?client=freeder"]

    var app = module.exports = express.createServer(
            express.bodyParser()
            , express.static(__dirname + "/public")
            , express.favicon()
            , express.cookieParser()
            , express.session({ secret: 'htuayreve'})
            , everyauth.middleware()
            );

    everyauth.helpExpress(app);

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

function getActionToken(req, res, callback) {
    // TODO: The actionToken lasts 30 min, so we shouldn't hit the url for every mark as read request
    // http://code.google.com/p/google-reader-api/wiki/ActionToken

    var post_options = {
        host: 'www.google.com',
        port: 80,
        path: "/reader/api/0/token",
        method: 'GET',
        headers: { 'Authorization': 'Bearer '+ req.session.accessToken }
    };

    var post_req = http.request(post_options, function(resp) {

        actionToken = "";

        resp.on('data', function (chunk) {
            actionToken += chunk;
        });

        resp.on('end', function () {
            callback(req, res, actionToken);
        });
    });

    post_req.end();
}

// Marks an item as read
function markAsRead(req, res, actionToken) {

    var post_data = "i="+req.params.pid+"&a=user/-/state/com.google/read&s="+req.params.url+"&T="+actionToken;

    var post_options = { 
        host: 'www.google.com',
        port: 443,
        path: "/reader/api/0/edit-tag?client=freeder",
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': post_data.length,
            'Authorization': 'Bearer '+ req.session.accessToken }
    };

    var post_req = https.request(post_options, function(resp) {

        data = "";

        resp.on('data', function (chunk) {
            data += chunk;
        });

        resp.on('end', function (){

            if (data == "OK") { // the item has been marked as read
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.write(data);
                res.end();
            }
        });
    });

    post_req.write(post_data);
    post_req.end();
}

// Makes a request with authorization headers
function request(res, accessToken, url) {

    var options = { host: 'www.google.com', port: 80, path: _url, method: 'GET', headers: {'Authorization': 'Bearer '+ accessToken}};

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
            sendError(res);
        });
    });
}

// Routes
app.get('/', function(req, res){
    res.render('index');
});

app.get('/login', function(req, res){
    if (req.session.accessToken) {
        res.redirect('/read');
    } else {
        res.redirect('/auth/google');
    }
});

app.get('/read', function(req, res){
    res.render('articles');
});

app.get('/get/:query', function(req, res){

    if (req.params.query === "unread-count"){
        _url = aUrl[2];
    } else if (req.params.query === "subscription-list"){
        _url = aUrl[3];
    };

    request(res, req.session.accessToken, _url);
});

app.get('/get/feed/:url/:unread', function(req, res){
    _url = aUrl[4]+decodeURIComponent(req.params.url)+"?&r=n&n=100";

    if (req.params.unread=="t"){
        _url += "&xt=user/-/state/com.google/read";
    }

    request(res, req.session.accessToken, _url);
});

// Mark as read service
app.get('/markasread/:url/:pid', function(req, res){
    getActionToken(req, res, markAsRead);
});

var port = process.env.PORT || 3000;

app.listen(port);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
