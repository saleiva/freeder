$(document).ready(function() {

	$('.sources ul').on("mouseenter mouseleave", 'li', function(event){
		$(this).toggleClass("over");
		$(this).find('div a').toggleClass("over");
	});

	$('.sources ul').on("click", 'li', function(event){
		setFeed($(this).attr('id'));
	});

	$('.sources_area').bind("mouseenter", function(event){
		$('.sources').fadeIn(150);
		$('.sources_area').css('width','300px');
		//JSCROLLPANE 
		var api = $('.scroll-pane').data('jsp');
		api.reinitialise();
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
		$(this).fadeOut(150);
		$('.sources_area').css('width','170px');
	});

});