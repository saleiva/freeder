$(document).ready(function() {

    var _selectedSource;

    $('.sources ul').on("mouseenter mouseleave", 'li', function(e){
        if($(this) != _selectedSource){
            $(this).toggleClass("over");
        }
    });

    $('.sources ul').on("click", 'li', function(e){
        e.preventDefault();

        if ($(this).attr('id')=='allfeeds'){
            getAllFeeds();
        } else{
            setFeed($(this).attr('id'));
        }

        if (_selectedSource){
            _selectedSource.removeClass("selected");
        }

        _selectedSource = $(this);
        _selectedSource.addClass("selected");
    });

    $('.sources_area').bind("mouseenter", function(e){
        showSources();
        $('.sources_area').css('width','300px');
        //JSCROLLPANE 
        if ($('.scroll-pane').length > 0) {
            var api = $('.scroll-pane').data('jsp');
            api.reinitialise();
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
