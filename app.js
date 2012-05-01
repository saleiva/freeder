// http://blog.martindoms.com/2010/01/20/using-the-google-reader-api-part-3/#comment-105
// http://blog.martindoms.com/2009/08/15/using-the-google-reader-api-part-1/
// http://timbroder.com/2007/08/google-reader-api-functions.html
// http://groups.google.com/group/fougrapi
// http://code.google.com/p/google-reader-api/wiki/Authentication
// http://code.google.com/p/google-reader-gadget/source/browse/trunk/edit.js
// http://undoc.in/googlereader.html

/**
 * Module dependencies.
 */

var
express = require('express')
, routes = require('./routes')
, querystring = require('querystring')
, http = require('http')
, https = require('https')
, fs = require('fs')
, un = require('underscore')
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

var conf = {
  HOST: 'www.google.com',
  HTTP_PORT: 80,
  HTTPS_PORT: 443
};

everyauth.google
.myHostname(config[mode].host)
.appId(config[mode].google.appID)
.appSecret(config[mode].google.appSecret)
.scope(config[mode].google.scope)
.findOrCreateUser( function (sess, accessToken, extra, googleUser) {
  googleUser.refreshToken = extra.refresh_token;
  googleUser.expiresIn = extra.expires_in;

  console.log(extra);

  // Let's store some basic info in the session variable
  sess.email        = googleUser.email;
  sess.accessToken  = accessToken;
  sess.refreshToken = null;
  //sess.refreshToken = extra.refresh_token;

  return usersByGoogleId[googleUser.id] || (usersByGoogleId[googleUser.id] = googleUser);
}).redirectPath('/login');

var ourl = new Object();
ourl.actionToken      = '/reader/api/0/token';
ourl.unreadCount      = '/reader/api/0/unread-count?output=json';
ourl.readingList      = '/reader/api/0/stream/contents/user/-/state/com.google/reading-list?';
ourl.subscriptionList = '/reader/api/0/subscription/list?output=json';
ourl.feedContents     = '/reader/api/0/stream/contents/';
ourl.markAsRead       =  '/reader/api/0/edit-tag?client=sirope';
ourl.markAsUnread     =  '/reader/api/0/edit-tag?client=sirope';
ourl.addFeed          =  '/reader/api/0/subscription/edit';

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
app.configure(function() {
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
    compile: function(str, options) {
      return function(locals) {
        return str;
      };
    }
  });
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});


var Sirope = (function() {

  // Generate a hash with request options
  _getRequestOptions = function(host, port, path, method, headers) {
    return { host: host, port: port, path: path, method: method, headers: headers };
  }

  _get = function(res, accessToken, url) {
    var options = { host: conf.HOST, port: conf.HTTP_PORT, path: url, method: 'GET', headers: { 'Authorization': 'Bearer ' + accessToken } };

    http.get(options, function(resp) {
      var data = "";

      resp.on('data', function(chunk) {
        data += chunk;
      });

      resp.on('end', function() {
        res.writeHead(resp.statusCode, { 'Content-Type': 'application/json' });
        res.write(data);
        res.end();
      });

      resp.on('error', function(e) {
        console.log(e);
      });

    });

  };

  _post = function(res, options, data) {
    var post_req = https.request(options, function(resp) {

      var data = "";

      resp.on('data', function (chunk) {
        data += chunk;
      });

      resp.on('end', function () {
        res.writeHead(resp.statusCode, { 'Content-Type': 'text/plain' });
        res.write(data);
        res.end();
      });
    });

    post_req.write(data);
    post_req.end();
  };

  _getActionToken = function(req, res, callback) {

    if (req.session.refreshToken == false && req.session.actionToken != null) {

      if (callback) {
        callback(req, res);
      }

      return;
    }

    var
      headers = { 'Authorization': 'Bearer ' + req.session.accessToken },
      options = Sirope.getRequestOptions(conf.HOST, conf.HTTP_PORT, ourl.actionToken, "GET", headers);

    var post_req = http.request(options, function(response) {

      var actionToken = "";

      response.on('data', function(chunk) {
        actionToken += chunk;
      });

      response.on('error', function(e) {
        console.log("Error", e);
      });

      response.on('end', function() {
        console.log("Action token", actionToken);

        req.session.refreshToken = false;
        req.session.actionToken  = actionToken;

        if (callback) {
          callback(req, res);
        }
      });
    });

    post_req.end();
  };

  _addFeed = function(req, res) {
    var
      data     = "s=feed/" + req.params.url + "&ac=subscribe&T=" + req.session.actionToken,
      headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': data.length, 'Authorization': 'Bearer ' + req.session.accessToken },
      options  = Sirope.getRequestOptions(conf.HOST, conf.HTTPS_PORT, ourl.addFeed, "POST", headers);

    Sirope.post(res, options, data);
  };

  _markAsRead = function(req, res) {
    var
      data     = "i=" + req.params.pid + "&a=user/-/state/com.google/read&a=user/-/state/com.google/tracking-kept-unread&s=" + req.params.url + "&T=" + req.session.actionToken,
      headers  = { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': data.length, 'Authorization': 'Bearer '+ req.session.accessToken },
      options  = Sirope.getRequestOptions(conf.HOST, conf.HTTPS_PORT, ourl.markAsRead, "POST", headers);

    Sirope.post(res, options, data);
  };

  _markAsUnRead = function(req, res) {
    var
    data    = "i=" + req.params.pid + "&a=user/-/state/com.google/kept-unread&r=user/-/state/com.google/read&a=user/-/state/com.google/tracking-kept-unread&s=" + req.params.url + "&T=" + req.session.actionToken,
    headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': data.length, 'Authorization': 'Bearer '+ req.session.accessToken },
    options = Sirope.getRequestOptions(conf.HOST, conf.HTTPS_PORT, ourl.markAsUnRead, "POST", headers);

    Sirope.post(res, options, data);
  };

  return {
    getRequestOptions: _getRequestOptions,
    getActionToken:    _getActionToken,
    addFeed:           _addFeed,
    markAsRead:        _markAsRead,
    markAsUnRead:      _markAsUnRead,
    get:               _get,
    post:              _post
  };

}());


// Routes
app.get('/', function(req, res) {
  res.render('index');
});

app.get('/login', function(req, res) {
  if (req.session.accessToken) {
    var name = req.session.email.split('@')[0].replace(/\./g, '');
    req.session.userName = name;
    res.redirect('/' + req.session.userName);
  } else {
    res.redirect('/auth/google');
  }
});

app.get('/get/:query', function(req, res) {
  var url = null;

  if (req.params.query === "unread-count") {
    url = ourl.unreadCount;
  } else if (req.params.query === "subscription-list") {
    url = ourl.subscriptionList;
  }

  Sirope.get(res, req.session.accessToken, url);
});

app.get('/get/feed/:url/:unread', function(req, res) {
  var url = null;

  if (req.params.url === "all") {
    url = ourl.readingList + "?&r=n&n=100";
  } else {
    url = ourl.feedContents+decodeURIComponent(req.params.url) + "?&r=n&n=100";
  }

  if (req.params.unread === "t") {
    url += "&xt=user/-/state/com.google/read";
  }

  Sirope.get(res, req.session.accessToken, url);
});


/**
* ROUTES
*/

// Subscribe to feed service
app.get('/subscribe/:url', function(req, res) {
  Sirope.getActionToken(req, res, Sirope.addFeed);
});

// Mark as read service
app.get('/markasread/:url/:pid', function(req, res) {
  Sirope.getActionToken(req, res, Sirope.markAsRead);
});

// Mark as unread service
app.get('/markasunread/:url/:pid', function(req, res) {
  Sirope.getActionToken(req, res, Sirope.markAsUnread);
});

app.get('/refresh', function(req, res) {
  console.log("Time to refresh the token");

  if (req.session && req.session.userName) {

    Sirope.getActionToken(req, res, function() {
      console.log("Refreshed. Rendering", req.session.userName);

      req.session.refreshToken = true;
      res.redirect('/' + req.session.userName);
    });

  } else {
    res.redirect("/auth/google");
  }
});

// Custom URL for user
app.get('/:username', function(req, res) {
  res.render('articles');
});

var port = process.env.PORT || 3000;

app.listen(port);

console.log("Express server listening on port %d in %s mode", app.address().port, mode);
