
function cleanpost(){
	
	//Add float to links containning images
	//Fixes Yorokobu
	$('.content').find('a').each(function() {
			if ($(this).has('img').length){
				$(this).css('float','left');	
			}
	});

	//Remove empty pharagraphs
	//Fixes Yorokobu
	$('.content').find('p').each(function() {
			if ($(this).html() == "&nbsp;"){
				$(this).remove();
			}
			if ($(this).html() == ""){
				$(this).remove();
			}
	});

	//Remove tables
	//Fixes actualidadIpad,
	$('.content').find('table').each(function() {	
		$(this).remove();
	});

	//Clean inline styles on images and 1x1 images
	$('.content').find('img').each(function() {	

		if($(this).attr('height') == '1' && $(this).attr('width') == '1'){
			$(this).remove();
		}

		$(this).removeAttr('style');
		$(this).removeAttr('width');
		$(this).removeAttr('height');
	});

	//Clean inline styles on paraghraphs
	$('.content').find('p').each(function() {	
		$(this).removeAttr('style');
	});


}