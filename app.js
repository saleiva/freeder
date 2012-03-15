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
, everyauthRoot = __dirname + '/..'
, conf = require('./conf');

everyauth.debug = true;

var usersByGoogleId = {};

// everyauth.everymodule.moduleTimeout(-1); // to turn off timeouts

everyauth.everymodule
.findUserById( function (id, callback) {
    callback(null, usersByGoogleId[id]);
});

var mode = "development";

// TODO: move appID and appSecret to configuration file
everyauth.google
.myHostname(config[mode].host)
.appId(config[mode].google.appID)
.appSecret(config[mode].google.appSecret)
.scope(config[mode].google.scope)
.findOrCreateUser( function (sess, accessToken, extra, googleUser) {
    googleUser.refreshToken = extra.refresh_token;
    googleUser.expiresIn = extra.expires_in;
    sess.email = googleUser.email;
    sess.accessToken = accessToken;
    return usersByGoogleId[googleUser.id] || (usersByGoogleId[googleUser.id] = googleUser);
}).redirectPath('/login');

var ourl = new Object();
ourl.actionToken = '/reader/api/0/token';
ourl.unreadCount = '/reader/api/0/unread-count?output=json';
ourl.readingList = '/reader/api/0/stream/contents/user/-/state/com.google/reading-list?';
ourl.subscriptionList = '/reader/api/0/subscription/list?output=json';
ourl.feedContents = '/reader/api/0/stream/contents/';
ourl.markAsRead =  '/reader/api/0/edit-tag?client=sirope';
ourl.addFeed =  '/reader/api/0/subscription/edit';

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
        path: ourl.actionToken,
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

// Subscribes to feed
function addFeed(req, res, actionToken) {

    var post_data = "s="+req.params.url+"&ac=subscribe&T="+actionToken;

    var post_options = { 
        host: 'www.google.com',
        port: 443,
        path: ourl.addFeed,
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

// Marks an item as read
function markAsRead(req, res, actionToken) {

    var post_data = "i="+req.params.pid+"&a=user/-/state/com.google/read&s="+req.params.url+"&T="+actionToken;

    var post_options = { 
        host: 'www.google.com',
        port: 443,
        path: ourl.markAsRead,
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

    var options = { host: 'www.google.com', port: 80, path: url, method: 'GET', headers: {'Authorization': 'Bearer '+ accessToken}};

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
        var name = req.session.email.split('@')[0].replace(/\./g, '');
        res.redirect('/' + name);
    } else {
        res.redirect('/auth/google');
    }
});


app.get('/get/:query', function(req, res){
    var url;

    if (req.params.query === "unread-count"){
        url = ourl.unreadCount;
    } else if (req.params.query === "subscription-list"){
        url = ourl.subscriptionList;
    };

    request(res, req.session.accessToken, url);
});

app.get('/get/feed/:url/:unread', function(req, res){
    
    if(req.params.url == "all"){
        var url = ourl.readingList+"?&r=n&n=100";
    }else{
        var url = ourl.feedContents+decodeURIComponent(req.params.url)+"?&r=n&n=100";
    }
    if (req.params.unread=="t"){
        url += "&xt=user/-/state/com.google/read";
    }

    request(res, req.session.accessToken, url);
});

// Mark as read service
app.get('/markasread/:url/:pid', function(req, res){
    getActionToken(req, res, markAsRead);
});


app.get('/:username', function(req, res){
    res.render('articles');
});

var port = process.env.PORT || 3000;

app.listen(port);

console.log("Express server listening on port %d in %s mode", app.address().port, mode);
