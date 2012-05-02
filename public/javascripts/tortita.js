/*
 ______               __        __
/\__  _\             /\ \__  __/\ \__
\/_/\ \/   ___   _ __\ \ ,_\/\_\ \ ,_\    __
   \ \ \  / __`\/\`'__\ \ \/\/\ \ \ \/  /'__`\
    \ \ \/\ \L\ \ \ \/ \ \ \_\ \ \ \ \_/\ \L\.\_
     \ \_\ \____/\ \_\  \ \__\\ \_\ \__\ \__/.\_\
      \/_/\/___/  \/_/   \/__/ \/_/\/__/\/__/\/_/
*/

var debug = true;

var
  totalCount        = 0,
  unreadCounters    = [],
  articles          = [],
  sources           = [],
  lastFaviconURL    = "",
  currentArticle    = 0,
  readArticleMark   = 0,
  unreadFlag        = "f",
  spinner,
  miniSpinner,
  target,
  miniTarget,
  modalSpinner,
  spinnerOpts       = { lines: 12, length: 5, width: 4, radius: 21, color: '#000', speed: 1, trail: 64, shadow: false, hwaccel: false },
  modalSpinnerOpts  = { lines: 8, length: 2, width: 2, radius: 4, color: '#000', speed: 1, trail: 64, shadow: false, hwaccel: false },
  miniSpinnerOpts   = { lines: 8, length: 2, width: 2, radius: 4, color: '#000', speed: 1, trail: 64, shadow: false, hwaccel: false };


  function _debug(str) {
    if (debug) {
      console.log(str);
    }
  }

function isEmpty(str) {
  return !str.match(/\S/g);
}

function sanitize(str) {
  return str.replace(/[^a-z0-9]+/g,'-'); // TODO:^ is insecure, try this instead: /\bhttps?:\/\/[-\w+&@#/%?=~|$!:,.;]*[\w+&@#/%=~|$]/g
}

//Show an item on the UI
function showArticle(i) {

  currentArticle = i;
  var article = articles[i];

  if (article) {
    $('.article .title h1 a').html(article.title);
    $('.article .title h1 a').attr('href', article.alternate[0].href);
    $('.article .title h2 a').attr('href', article.origin.htmlUrl);

    // Show human date
    var date = new Date(0);
    date.setUTCSeconds(article.published);
    $('.article .title h2 .date').html(humaneDate(date));

    var faviconURL = article.origin.htmlUrl.replace("http://", "");

    if (faviconURL !== lastFaviconURL) {
      $('.article .title h2 a').css("background", 'url(http://getfavicon.org/?url='+encodeURIComponent(faviconURL)+') 0 0 no-repeat');
      lastFaviconURL = faviconURL;
    }

    $('.article .title h2 a').html(article.origin.title);
    $('.article .content').text("");

    if (article.content) {
      $('.article .content').append(article.content.content);
    } else if (article.summary) {
      $('.article .content').append('<p>'+article.summary.content+'</p><p><a href="'+article.alternate[0].href+'">Read more</a></p>');
    }
    cleanArticle();
  }
}

//Function for changing the source for viewing
function setFeed(feedSource, u) {
  _debug('Loading source');

  var streamID = null;

  spinner.stop();
  spinner = new Spinner(spinnerOpts).spin(target);

  miniSpinner.stop();

  $('.article').fadeOut();

  articles = []; // empty article list

  if (feedSource !== 'all') {
  _debug('Loading single source');

    streamID    = sources[feedSource];

    var unreadCount = unreadCounters[streamID];

    _debug('Unread count: ' + unreadCount);
    _debug(articles);

    if (unreadCount > 0 || u === undefined) {
      unreadFlag = "t";
      $('.article .next').text('Keep as unread');
    } else {
      unreadFlag = "f";
      $('.article .next').text('Mark as unread');
    }

  } else{
    _debug('Loading all sources');
    streamID = 'all';
    unreadFlag = "t";
  }

  if ($('.noUnread').is(':visible')) {
    $('.noUnread').hide();
  }

  $.ajax({
    url: 'get/feed/' + encodeURIComponent(streamID) + "/" + unreadFlag,
    type: 'GET',
    beforeSend: function(r) {
      r.setRequestHeader("Auth_token", sessvars.Auth_token);
    },
    success: function(data) {
      spinner.stop();
      miniSpinner.stop();

      if (data.items.length > 0) {

        if (streamID != 'all') {
          if (unreadCounters[streamID]) {
            totalCount = totalCount - unreadCounters[streamID] + data.items.length;
          } else {
            totalCount += data.items.length;
          }
          unreadCounters[streamID] = data.items.length;
          updateCount(streamID);
          updateTotalCounter(totalCount);
        }

        $.each(data.items, function(i, obj) {
          articles[i] = obj;
        });

        showArticle(0);
        readArticleMark = 0;
        $('.article').fadeIn();
      } else {
        console.log("Nothing else to read!");

        $('.article').fadeOut('slow', function() {
          $('.noUnread').fadeIn();
        });

      }
    },
    error: function(r) {
      console.log("Error: ", r);
    }
  });
}

//Ask for all the blogs where the user is subscribed
function getSubscriptionList() {
  _debug("Getting subscription list");

  $('.sources ul').empty(); // empty the sources list

  $.ajax({
    url: "/get/subscription-list",
    type: 'GET',
    beforeSend: function(r) {
      r.setRequestHeader("Auth_token", sessvars.Auth_token);
    },
    error: function(e) {
      spinner.stop();
      miniSpinner.stop();

      if (e.status === 401) {
        window.location.href = "/auth/google"; // TODO: refresh token
      } else if (e.status === 400) {
        console.log('We should refresh token');
      }

      throw new Error('Error ' + e.status + ":" + e);
    },
    success: function(res) {

      miniSpinner.stop();
      $('.sources ul').append('<li id="allfeeds"><div><a href="#">All unread items</a><span>0</span></div></li>');
      $.each(res.subscriptions, function(i,obj) {

        var
          url  = obj.htmlUrl,
          name = obj.title,
          id   = sanitize(obj.id);

        sources[id] = obj.id;

        $('.sources ul').append('<li id="' + id + '"><div><a href="#">' + name + '</a><span>0</span></div></li>');
        $('li#' + id + ' div a').truncate({ width: 200 });
      });

      showSources();

      //Get the counters for the unread articles
      $.ajax({
        url: '/get/unread-count',
        type: 'GET',
        beforeSend: function(r) {
          r.setRequestHeader("Auth_token", sessvars.Auth_token);
          miniSpinner.spin(miniTarget);
        },
        success: function(resc) {
          miniSpinner.stop();

          var re = new RegExp(/\/state\/com\.google\/reading-list/);

          $.each(resc.unreadcounts, function(i, obj) {

            if (obj.id.match(re)) {
              totalCount = obj.count;
              updateTotalCounter(totalCount);
            } else {
              unreadCounters[obj.id] = obj.count;
              updateCount(obj.id);
            }

          });

          setFeed('all', 't');
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
      url: 'subscribe/' + encodeURIComponent(url),
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
  var feedSource = $('.sources ul li.selected').attr('id');
  setFeed(feedSource);
}

function getMoreArticles(streamID) {
  _debug("[GET] Getting more articles");

  var extraArticles = [];

  $.ajax({
    url: 'get/feed/' + encodeURIComponent(streamID) + "/" + unreadFlag,
    type: 'GET',
    beforeSend: function(r) {
      r.setRequestHeader("Auth_token", sessvars.Auth_token);
    },
    success: function(resc) {
      miniSpinner.stop();

      $.each(resc.items, function(i, obj) {
        extraArticles[i] = obj;
      });

      extraArticles.splice(0, 5);
      articles = articles.concat(extraArticles);
    }
  });
}

//Show the next item and mark this as unread
function nextArticle(e) {
  _debug("Next article");

  e.preventDefault();

  if (!articles[currentArticle]) {
    miniSpinner.stop();
    return;
  }

  var
  streamID    = articles[currentArticle].origin.streamId,
  articleID   = articles[currentArticle].id;

  if ((unreadFlag === 't') && (currentArticle >= readArticleMark) && (!$('.noUnread').is(':visible'))) {
    miniSpinner.spin(miniTarget);

  _debug("Mark as read");
  _debug('/markasread/' + encodeURIComponent(streamID) + '/' + encodeURIComponent(articleID));

    $.ajax({
      url: '/markasread/' + encodeURIComponent(streamID) + '/' + encodeURIComponent(articleID),
      type: 'GET',
      beforeSend: function(r) {
        r.setRequestHeader("Auth_token", sessvars.Auth_token);
        r.setRequestHeader("Action_token", sessvars.Action_token);
      },
      error: function(error) {
        spinner.stop();
        miniSpinner.stop();
        _debug("Error marking as read");
        _debug(error);
      },
      success: function(resc) {
        spinner.stop();
        miniSpinner.stop();
        _debug("Success");
        _debug(unreadCounters[streamID]);

        if (unreadCounters[streamID] > 0) {
          unreadCounters[streamID] -= 1;
          totalCount               -= 1;
        }

        updateCounters(streamID, totalCount);
      }
    });
  }

  if (currentArticle < articles.length-1) {
    miniSpinner.stop();
    showArticle(currentArticle + 1);
    readArticleMark = (currentArticle > readArticleMark) ? currentArticle : readArticleMark;

    if (currentArticle === articles.length - 5) {
      miniSpinner.stop();
      console.log('get more articles!!');
      getMoreArticles(streamID);
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

  if (!articles[currentArticle]) {
    return;
  }

  var
  streamID    = articles[currentArticle].origin.streamId,
  articleID   = articles[currentArticle].id;

  if ((unreadFlag === 'f') || (currentArticle < readArticleMark)) {
    miniSpinner.spin(miniTarget);
    $.ajax({
      url: '/markasunread/' + encodeURIComponent(streamID) + '/' + encodeURIComponent(articleID),
      type: 'GET',
      beforeSend: function(r) {
        r.setRequestHeader("Auth_token", sessvars.Auth_token);
        r.setRequestHeader("Action_token", sessvars.Action_token);
      },
      success: function(resc) {
        miniSpinner.stop();
        unreadCounters[streamID] += 1;
        totalCount               += 1;

        updateCounters(streamID, totalCount);
      }
    });
  }

  if (currentArticle < articles.length-1) {

    showArticle(currentArticle + 1);
    readArticleMark = (currentArticle > readArticleMark) ? currentArticle : readArticleMark;

    if (currentArticle === articles.length - 5) {
      //console.log('Get more articles!!');
      getMoreArticles(streamID);
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
  window.open(articles[currentArticle].alternate[0].href);
}

// Sharing methods
function shareOnTwitter() {
  var
  title      = articles[currentArticle].title,
  articleURL = articles[currentArticle].alternate[0].href;

  if (title.length > 70) {
    title = (articles[currentArticle].title).substring(0, 70) + "...";
  } else {
    title = articles[currentArticle].title;
  }

  var url = "http://twitter.com/home?status=" + title + " - " + articleURL + " - As read on @Siropeapp";
  window.open(url);
}

function shareOnFacebook() {
  var
  title      = articles[currentArticle].title,
  articleURL = articles[currentArticle].alternate[0].href,
  url        = "http://www.facebook.com/sharer.php?t=" + title + "&u="+ articleURL;

  window.open(url);
}

$(function() {

  // Spinners configuration
  target      = document.getElementById('spinner');
  spinner     = new Spinner(spinnerOpts).spin(target);

  miniTarget  = document.getElementById('minispinner');
  miniSpinner = new Spinner(miniSpinnerOpts).spin(miniTarget);

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
