var _selectedSource;
var isiPad = navigator.userAgent.match(/iPad/i) != null;

$(document).ready(function() {

  $('.sources ul').on("mouseenter mouseleave", 'li', function(e){
    if($(this) != _selectedSource){
      $(this).toggleClass("over");
    }
  });

  $('.sources ul').on("click", 'li', function(e){
    e.preventDefault();

    if ($(this).attr('id') == 'allfeeds'){
      setFeed('all','t');
    } else{
      setFeed($(this).attr('id'));
    }

    if (_selectedSource){
      _selectedSource.removeClass("selected");
    }

    _selectedSource = $(this);
    _selectedSource.addClass("selected");
    if (isiPad) hideSources();
  });

  $('.sources_area').bind("mouseenter", function(e){
    showSources();
    $('.sources_area').css('width','300px');

    if (!isiPad) { //JSCROLLPANE
      if ($('.scroll-pane').length > 0) {
        var api = $('.scroll-pane').data('jsp');
        api.reinitialise();
      }
    }

    var throttleTimeout;
    $(window).bind('resize',function(){
      if ($.browser.msie) {
        // IE
        if (!throttleTimeout) {
          throttleTimeout = setTimeout(
            function(){
            api.reinitialise();
            throttleTimeout = null;
          },50
          );
        } else {
          api.reinitialise();
        }
      }
    });
  });

  $('.sources').bind("mouseleave", function(e){
    hideSources();
    $('.sources_area').css('width','170px');
  });

});

function getTotalCounter(){
  return getUnreadCount("allfeeds");
}

function getUnreadCount(streamID) {
  return parseInt($('.sources ul li#' + sanitize(streamID) + ' div span').text(), 10);
}

function updateCounters(streamID, total) {
  updateCount(streamID);
  updateTotalCounter(total);
}

function updateCount(streamID) {
  var $counter = $('.sources ul li#' + sanitize(streamID) + ' div span');

  $counter.text(unreadCounters[streamID]);
  (unreadCounters[streamID] <= 0) ?  $counter.hide() : $counter.show();
}

function updateTotalCounter(n){
  var
  p = (n >= 1000) ? "+" : "",
  $counter = $('.sources ul li#allfeeds div span');

  $counter.text(p + n);
  (n <= 0) ?  $counter.hide() : $counter.show();
}

function hideSources(){
  $('.sources').fadeOut(150);
}

function showSources(){
  $('.sources').fadeIn(150);
}

function setSelected(sel){
  _selectedSource = $('.sources ul li#'+sel);
  $('.sources ul li#'+sel).addClass('selected');
}
