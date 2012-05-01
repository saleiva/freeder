
function getActionToken(req, res, callback) {
  // TODO: The actionToken lasts 30 min, so we shouldn't hit the url for every mark as read request
  // http://code.google.com/p/google-reader-api/wiki/ActionToken

  if (req.session.refreshToken === false && req.session.actionToken !== null) {

    if (callback) {
      callback(req, res);
    }
    return
  }

  console.log("Ok, refreshing the token");

  var post_options = {
    host: conf.HOST,
    port: conf.HTTP_PORT,
    path: ourl.actionToken,
    method: 'GET',
    headers: { 'Authorization': 'Bearer '+ req.session.accessToken }
  };

  var post_req = http.request(post_options, function(resp) {

    var actionToken = "";

    resp.on('data', function (chunk) {
      actionToken += chunk;
    });

    resp.on('end', function () {
      console.log("Token refreshed! Look: ", actionToken);
      req.session.refreshToken = false;
      req.session.actionToken = actionToken;
      callback(req, res);
    });
  });

  post_req.end();
}

// Subscribes to feed
function addFeed(req, res) {
  var post_data = "s=feed/" + req.params.url + "&ac=subscribe&T=" + req.session.actionToken;

  var post_options = {
    host: conf.HOST,
    port: conf.HTTPS_PORT,
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

    resp.on('end', function () {

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
function markAsRead(req, res) {

  var post_data = "i=" + req.params.pid + "&a=user/-/state/com.google/read&a=user/-/state/com.google/tracking-kept-unread&s=" + req.params.url + "&T=" + req.session.actionToken;

  console.log('Marking as read', post_data);

  var post_options = {
    host: conf.HOST,
    port: conf.HTTPS_PORT,
    path: ourl.markAsRead,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length,
      'Authorization': 'Bearer '+ req.session.accessToken }
  };

  var post_req = https.request(post_options, function(resp) {

    var data = "";

    resp.on('data', function (chunk) {
      data += chunk;
    });

    resp.on('end', function () {
      console.log("mark as read", resp.statusCode);

      res.writeHead(resp.statusCode, { 'Content-Type': 'text/plain' });
      res.write(data);
      res.end();

    });
  });

  post_req.write(post_data);
  post_req.end();
}

// Marks an item as unread
function markAsUnread(req, res) {

  var post_data = "i=" + req.params.pid + "&a=user/-/state/com.google/kept-unread&r=user/-/state/com.google/read&a=user/-/state/com.google/tracking-kept-unread&s=" + req.params.url + "&T=" + req.session.actionToken;

  var post_options = {
    host: conf.HOST,
    port: conf.HTTPS_PORT,
    path: ourl.markAsRead,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length,
      'Authorization': 'Bearer '+ req.session.accessToken }
  };

  var post_req = https.request(post_options, function(resp) {

    var data = "";

    resp.on('data', function (chunk) {
      data += chunk;
    });

    resp.on('end', function () {
      if (data == "OK") { // the item has been marked as unread
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

  var options = { host: conf.HOST, port: conf.HTTP_PORT, path: url, method: 'GET', headers: {'Authorization': 'Bearer '+ accessToken}};

  http.get(options, function(resp) {
    var data = "";

    resp.on('data', function (chunk) {
      data +=chunk;
    });

    resp.on('end', function () {
      console.log(resp.statusCode);
      res.writeHead(resp.statusCode, { 'Content-Type': 'application/json' });
      res.write(data);
      res.end();
    });

    resp.on('error', function(e) {
      console.log(e);
    });
  });
}
