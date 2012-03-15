$(document).ready(function() {

	var _selectedSource;

	$('.sources ul').on("mouseenter mouseleave", 'li', function(event){
		if($(this) != _selectedSource){
			$(this).toggleClass("over");
		}
	});

	$('.sources ul').on("click", 'li', function(event){
	event.preventDefault();
		setFeed($(this).attr('id'));
		if(_selectedSource){
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


function hideSources(){
	$('.sources').fadeOut(150);
}

function showSources(){
	$('.sources').fadeIn(150);
}
