$(document).ready(function() {

	$('.sources ul').on("mouseenter mouseleave", 'li', function(event){
		$(this).toggleClass("over");
		$(this).find('div a').toggleClass("over");
	});

	$('.sources_area').bind("mouseenter", function(event){
		$('.sources').fadeIn(250);
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
		$(this).fadeOut(250);
	});

});