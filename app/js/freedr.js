$(document).ready(function() {


	$('.sources ul li').bind("mouseenter mouseleave", function(event){
		$(this).toggleClass("over");
	});

	$('.sources_area').bind("mouseenter", function(event){
		$('.sources').fadeIn();
	});

$('.sources').bind("mouseleave", function(event){
		$(this).fadeOut();
	});

});