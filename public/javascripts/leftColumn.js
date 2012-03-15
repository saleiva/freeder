$(document).ready(function() {

    var _selectedSource;

    $('.sources ul').on("mouseenter mouseleave", 'li', function(event){
        if($(this) != _selectedSource){
            $(this).toggleClass("over");
        }
    });

    $('.sources ul').on("click", 'li', function(event){
        event.preventDefault();
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

    $('.sources_area').bind("mouseenter", function(event){
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

    $('.sources').bind("mouseleave", function(event){
        hideSources();
        $('.sources_area').css('width','170px');
    });

});

function updateTotalCounter(n){
    p = (n==1000) ? "+" : "";
    $('.sources ul li#allfeeds div span').text(	p+n);
    $('.sources ul li#allfeeds div span').show();
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
