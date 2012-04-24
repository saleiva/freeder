/*
 ______               __        __
/\__  _\             /\ \__  __/\ \__
\/_/\ \/   ___   _ __\ \ ,_\/\_\ \ ,_\    __
   \ \ \  / __`\/\`'__\ \ \/\/\ \ \ \/  /'__`\
    \ \ \/\ \L\ \ \ \/ \ \ \_\ \ \ \ \_/\ \L\.\_
     \ \_\ \____/\ \_\  \ \__\\ \_\ \__\ \__/.\_\
      \/_/\/___/  \/_/   \/__/ \/_/\/__/\/__/\/_/
*/

var
    posts             = [],
    sources           = [],
    lastFaviconURL    = "",
    currentArticle    = 0,
    readArticleMark   = 0,
    unreadFlag        = "f",
    spinner,
    target,
    modalSpinner,
    spinnerOpts       = {lines: 12, length: 5, width: 4, radius: 21, color: '#000', speed: 1, trail: 64, shadow: false, hwaccel: false};
    modalSpinnerOpts  = {lines: 8, length: 2, width: 2, radius: 4, color: '#000', speed: 1, trail: 64, shadow: false, hwaccel: false};

function isEmpty(str) {
  return !str.match(/\S/g);
}

function sanitize(str) {
  if (isEmpty(str)) {
    return str;
  }
  return str.replace(/[^a-z0-9]+/g,'-'); // TODO:^ is insecure, try this instead: /\bhttps?:\/\/[-\w+&@#/%?=~|$!:,.;]*[\w+&@#/%=~|$]/g
}
//Show an item on the UI
function showArticle(i) {
  currentArticle = i;
  var post = posts[i];

  if (post) {
    $('.article .title h1 a').html(post.title);
    $('.article .title h1 a').attr('href', post.alternate[0].href);
    $('.article .title h2 a').attr('href', post.origin.htmlUrl);
    // Show human date
    var date = new Date(0);
    date.setUTCSeconds(post.published);
    $('.article .title h2 .date').html(humaneDate(date));

    var faviconURL = post.origin.htmlUrl.replace("http://", "");

    if (faviconURL !== lastFaviconURL) {
      $('.article .title h2 a').css("background", 'url(http://getfavicon.org/?url='+encodeURIComponent(faviconURL)+') 0 0 no-repeat');
      lastFaviconURL = faviconURL;
    }

    $('.article .title h2 a').html(post.origin.title);
    $('.article .content').text("");

    if (post.content) {
      $('.article .content').append(post.content.content);
    } else if (post.summary) {
      $('.article .content').append('<p>'+post.summary.content+'</p><p><a href="'+post.alternate[0].href+'">Read more</a></p>');
    }
    cleanpost();
  }
}

//Function for changing the source for viewing
function setFeed(f, u) {
  var _feed = null;

  spinner.stop();
  $('.article').fadeOut();
  spinner = new Spinner(spinnerOpts).spin(target);
  posts = [];

  if (f!=='all') {
    if ((parseInt($('li#' + sanitize(sources[f])+' div span').text(), 10) > 0) || u === 'undefined') {
      unreadFlag = "t";
      $('.article .next').text('Keep as unread');
    } else {
      unreadFlag = "f";
      $('.article .next').text('Mark as unread');
    }
    _feed = encodeURIComponent(sources[f]);
  } else{
    _feed = 'all';
    unreadFlag = "t";
  }

  if ($('.noUnread').is(':visible')) {
    $('.noUnread').hide();
  }

  $.ajax({
    url: 'get/feed/'+_feed+"/"+unreadFlag,
    type: 'GET',
    beforeSend: function(r) {
      r.setRequestHeader("Auth_token", sessvars.Auth_token);
    },
    success: function(resc) {
      jQuery.each(resc.items, function(i,obj) {
        posts[i] = obj;
      });
      showArticle(0);
      readArticleMark = 0;
      $('.article').fadeIn();
      spinner.stop();
    }
  });
}

//Ask for all the blogs where the user is subscribed
function getSubscriptionList() {

  $('.sources ul').empty(); // empty the sources list

  var sreq = $.ajax({
    url: "/get/subscription-list",
    type: 'GET',
    beforeSend: function(r) {
      r.setRequestHeader("Auth_token", sessvars.Auth_token);
    },
    error: function(e) {
      spinner.stop();
      if (e.status === 401) {
        window.location.href = "/auth/google"; // TODO: refresh token
      }

      throw new Error('Error ' + e.status + ":" + e);
    },
    success: function(res) {
      $('.sources ul').append('<li id="allfeeds"><div><a href="#">All unread items</a><span>0</span></div></li>');
      jQuery.each(res.subscriptions, function(i,obj) {
        var url = obj.htmlUrl;
        var name = obj.title;
        var id = sanitize(obj.id);
        sources[id] = obj.id;
        $('.sources ul').append('<li id="'+id+'"><div><a href="#">'+name+'</a><span>0</span></div></li>');
        $('li#'+id+' div a').truncate({width:200});
      });

      showSources();

      //Get the counters for the unread articles
      $.ajax({
        url: '/get/unread-count',
        type: 'GET',
        beforeSend: function(r) {
          r.setRequestHeader("Auth_token", sessvars.Auth_token);
          viewminispinner();
        },
        success: function(resc) {
          var fe = null;
          var re = new RegExp(/\/state\/com\.google\/reading-list/);

          jQuery.each(resc.unreadcounts, function(i,obj) {
            if (obj.id.match(re)) {
              updateTotalCounter(obj.count);
            } else {
              $('li#'+sanitize(obj.id)+' div span').text(obj.count);
              $('li#'+sanitize(obj.id)+' div span').show();
            }
          });

          setFeed('all','t');
          setSelected('allfeeds');
        }
      });

      $('.sources div.wrap').addClass("scroll-pane");
      $('.scroll-pane').jScrollPane();
    }
  });
}
function subscribeToFeed(result) {
  if (!result.error && result.url !== null) {
    var url = result.url;

    $.ajax({
      type: 'GET',
      url: 'subscribe/'+encodeURIComponent(url),
      beforeSend: function(r) {
        r.setRequestHeader("Auth_token", sessvars.Auth_token);
      },
      success: function() {
        $("#addFeed").modal("hide");
        $('#addFeed').find('input[type="text"]').val("");
        modalSpinner.stop();
        getSubscriptionList();
      },
      error: function(resc) {
        console.log("Error: ", resc);
      }
    });
  } else { // on error
    modalSpinner.stop();
    $("#addFeed").addClass('error');
    console.log(result.error.message);
  }
}

function addFeed(e) {
  e.preventDefault();

  var t = document.getElementById('modalSpinner');
  modalSpinner.spin(t);

  $("#addFeed").removeClass('error');
  var url = $('#addFeed').find('input[type="text"]').val();

  // Tries to discover the RSS of the URL, then tries to subscribe to it
  google.feeds.lookupFeed(url, subscribeToFeed);
}

function showAlreadyRead() {
  var _e = $('.sources ul li.selected').attr('id');
  setFeed(_e);
}

function getMorePosts(streamID) {
  var extraPosts = [];

  $.ajax({
    url: 'get/feed/' + encodeURIComponent(streamID) + "/" + unreadFlag,
    type: 'GET',
    beforeSend: function(r) {
      console.log('get/feed/' + encodeURIComponent(streamID) + "/" + unreadFlag);
      r.setRequestHeader("Auth_token", sessvars.Auth_token);
    },
    success: function(resc) {

      jQuery.each(resc.items, function(i, obj) {
        extraPosts[i] = obj;
      });

      extraPosts.splice(0, 5);
      posts = posts.concat(extraPosts);
    }
  });
}

//Show the next item and mark this as unread
function nextArticle(e) {
  e.preventDefault();

  if (!posts[currentArticle]) {
    return;
  }

  var streamID  = posts[currentArticle].origin.streamId;
  var articleID = posts[currentArticle].id;
  var sanitizedStreamID = sanitize(streamID);

  var _c = parseInt($('li#' + sanitizedStreamID + ' div span').text(), 10);
  var _t = getTotalCounter();

  if ((unreadFlag === 't') && (currentArticle >= readArticleMark) && (!$('.noUnread').is(':visible'))) {
    viewminispinner();
    $.ajax({
      url: '/markasread/' + encodeURIComponent(streamID) + '/' + encodeURIComponent(articleID),
      type: 'GET',
      beforeSend: function(r) {
        r.setRequestHeader("Auth_token", sessvars.Auth_token);
        r.setRequestHeader("Action_token", sessvars.Action_token);
      },
      success: function(resc) {

        if (_c > 0) {
          _c -= 1;
          _t -= 1;
        }

        $('li#' + sanitizedStreamID + ' div span').text(_c);
        updateTotalCounter(_t);

        if ( _c === 0 ) {
          $('li#' + sanitizedStreamID + ' div span').hide();
        }

      }
    });
  }

  if (currentArticle < posts.length-1) {
    showArticle(currentArticle + 1);
    readArticleMark = (currentArticle > readArticleMark) ? currentArticle : readArticleMark;

    if (currentArticle === posts.length - 5) {
      console.log('get more posts!!');
      getMorePosts(streamID);
    }

  } else {

    $('.article').fadeOut('slow', function() {
      $('.noUnread').fadeIn();
    });

  }
  window.scroll();
}

//TODO: test this well
function keepAsUnread(e) {

  e.preventDefault();

  if (!posts[currentArticle]) {
    return;
  }

  var streamID  = posts[currentArticle].origin.streamId;
  var articleID = posts[currentArticle].id;
  var sanitizedStreamID = sanitize(streamID);

  var _c = parseInt($('li#' + sanitizedStreamID + ' div span').text(), 10);
  var _t = getTotalCounter();

  if ((unreadFlag === 'f') || (currentArticle<readArticleMark)) {
    viewminispinner();
    $.ajax({
      url: '/markasunread/' + encodeURIComponent(streamID) + '/' + encodeURIComponent(articleID),
      type: 'GET',
      beforeSend: function(r) {
        r.setRequestHeader("Auth_token", sessvars.Auth_token);
        r.setRequestHeader("Action_token", sessvars.Action_token);
      },
      success: function(resc) {
        _c += 1;
        _t += 1;

        $('li#' + sanitizedStreamID + ' div span').text(_c);
        updateTotalCounter(_t);

        if ( _c === 1 ) {
          $('li#' + sanitizedStreamID + ' div span').show();
        }
      }
    });
  }

  if (currentArticle < posts.length-1) {

    showArticle(currentArticle + 1);
    readArticleMark = (currentArticle > readArticleMark) ? currentArticle : readArticleMark;

    if (currentArticle === posts.length - 5) {
      console.log('get more posts!!');
      getMorePosts(streamID);
    }
  } else {

    $('.article').fadeOut('slow', function() {
      $('.noUnread').fadeIn();
    });

  }

  window.scroll();
}

function prevArticle(e) {
  e.preventDefault();
  if (currentArticle>0) {
    showArticle(currentArticle-1);
  }
}

function goToPermalink() {
  window.open(posts[currentArticle].alternate[0].href);
}

// Sharing methods
function shareOnTwitter() {
  var _t = null;
  if ((posts[currentArticle].title).length > 70) {
    _t = (posts[currentArticle].title).substring(0, 70) + "...";
  } else {
    _t = posts[currentArticle].title;
  }

  var _url = "http://twitter.com/home?status="+_t+ " - " +(posts[currentArticle].alternate[0].href) + " - As read on @Siropeapp";
  window.open(_url);
}

function shareOnFacebook() {
  var _url = "http://www.facebook.com/sharer.php?t="+posts[currentArticle].title+"&u="+(posts[currentArticle].alternate[0].href);
  window.open(_url);
}

$(function() {

  target  = document.getElementById('spinner');
  spinner = new Spinner(spinnerOpts).spin(target);

  $('.article').hide();
  $('.noUnread').hide();

  // Keyboard bindings for humans and nerds
  $(document).bind('keydown', 'left', prevArticle);
  $(document).bind('keydown', 'right', nextArticle);
  $(document).bind('keydown', 'k', prevArticle);
  $(document).bind('keydown', 'j', nextArticle);
  $(document).bind('keydown', 'return', goToPermalink);
  $(document).bind('keydown', 'a', function(e) { e.preventDefault(); $("#addFeed").modal("toggle"); });

  // Button binding
  $('.menu .next').bind("click", keepAsUnread);

  // Hides the sources pane after 2000 ms
  var hideSourcesTimeOut = setTimeout(function(self) {
    hideSources();
  }, 5000, this);

  // if the mouse is inside the sources pane, cancel the hiding
  $(".sources").on("mouseover", function() {
    clearTimeout(hideSourcesTimeOut);
  });

  // Add feed modal binding
  $('#addFeed .close').on("click", function(e) {
    e.preventDefault();
    $("#addFeed").modal("hide");
  });

  $('#addFeed').on('shown', function () {
    modalSpinner = new Spinner(modalSpinnerOpts);
    $('#addFeed input[type="text"]').focus();
  });

  // Add feed submission bindings
  $('#addFeed a').click(addFeed);

  // TODO: add form into the modal window so we don't need the following
  $('#addFeed input[type="text"]').keypress(function(e) {
    if (e.which === 13) {
      addFeed(e);
    }
  });

  getSubscriptionList();
});

