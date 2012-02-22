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
	$('.content').find('a').each(function() {
			if ($(this).has('img').length){
				$(this).css('float','left');	
			}
	});

	//Remove empty pharagraphs
	$('.content').find('p').each(function() {
			if ($(this).html() == "&nbsp;"){
				$(this).remove();
			}
			if ($(this).html() == ""){
				$(this).remove();
			}
	});

	//Remove tables
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
	$('.content').find('span').each(function() {	
		$(this).removeAttr('style');
	});

	//Remove feedburner buttons for mail, digg and delicious
	$('.content').find('a:regex(href,feedburner)').each(function() {
		$(this).remove();
	});
	$('.content').find('a').find('img:regex(src,feedburner)').each(function() {
		$(this).parent().remove();
	});
	$('.content').find('a:regex(href,tweetmeme)').each(function() {
		$(this).remove();
	});


	//Remove Google ads
	$('.content').find('iframe:regex(src,feedads)').each(function() {
		console.log("Google ads removed");
		$(this).remove();
	});

	//TODO: Fix scroll on videos (yorokobu art.18)

}