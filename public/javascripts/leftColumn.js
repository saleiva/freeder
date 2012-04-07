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

function updateTotalCounter(n){
    p = (n==1000) ? "+" : "";
    $('.sources ul li#allfeeds div span').text(p+n);
    $('.sources ul li#allfeeds div span').fadeIn(350);
    minispinner.stop();
    minispinner = null;
}

function getTotalCounter(){
    return parseInt($('.sources ul li#allfeeds div span').text());
}

function hideSources(){
    $('.sources').fadeOut(150); 
}

function showSources(){
    $('.sources').fadeIn(150);
}

function setSelected(sel){
    console.log(sel);
    _selectedSource = $('.sources ul li#'+sel);
    $('.sources ul li#'+sel).addClass('selected');
}
