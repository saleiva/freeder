$(document).ready(function() {

	$('.sources ul').on("mouseenter mouseleave", 'li', function(event){
		$(this).toggleClass("over");
		$(this).find('div a').toggleClass("over");
	});

	$('.sources_area').bind("mouseenter", function(event){
		$('.sources').fadeIn(250);
	});

	$('.sources').bind("mouseleave", function(event){
		$(this).fadeOut(250);
	});

});