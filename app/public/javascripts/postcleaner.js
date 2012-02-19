jQuery.expr[':'].regex = function(elem, index, match) {
    var matchParams = match[3].split(','),
        validLabels = /^(data|css):/,
        attr = {
            method: matchParams[0].match(validLabels) ? 
                        matchParams[0].split(':')[0] : 'attr',
            property: matchParams.shift().replace(validLabels,'')
        },
        regexFlags = 'ig',
        regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g,''), regexFlags);
    return regex.test(jQuery(elem)[attr.method](attr.property));
}

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

	//Remove feedburner buttons for mail, digg and delicious
	//Fixes Axis Maps,
	$('.content').find('a:regex(href,feedburner)').each(function() {
		console.log("feedburner removed");
		$(this).remove();
	});

	//TODO: Fix scroll on videos (yorokobu art.18)

}