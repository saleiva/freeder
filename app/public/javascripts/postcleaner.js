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
	$('.content').find('a:regex(href,comments)').each(function() {
		$(this).remove();
	});
	$('.content').find('a:regex(href,twitter)').each(function() {
		$(this).remove();
	});
	$('.content').find('a:regex(href,digg)').each(function() {
		$(this).remove();
	});
	$('.content').find('a:regex(href,delicious)').each(function() {
		$(this).remove();
	});
	$('.content').find('a:regex(href,facebook)').each(function() {
		$(this).remove();
	});
	$('.content').find('a:regex(href,tumbl)').each(function() {
		$(this).remove();
	});
	$('.content').find('a:regex(href,reddit)').each(function() {
		$(this).remove();
	});


	//Remove Google ads
	$('.content').find('iframe:regex(src,feedads)').each(function() {
		$(this).remove();
	});
	$('.content').find('a:regex(href,feedads)').each(function() {
		$(this).remove();
	});

    for (var i = 0; i < document.images.length; i++) {
    	console.log(document.images[i]);
        if (!isImageOk(document.images[i])) {
            document.images[i].style.display = "none";
        }
    }

}

function isImageOk(img) {
    // During the onload event, IE correctly identifies any images that
    // weren't downloaded as not complete. Others should too. Gecko-based
    // browsers act like NS4 in that they report this incorrectly.
    if (!img.complete) {
        return false;
    }

    // However, they do have two very useful properties: naturalWidth and
    // naturalHeight. These give the true size of the image. If it failed
    // to load, either of these should be zero.
    if (typeof img.naturalWidth != "undefined" && img.naturalWidth <= 50) {
        return false;
    }

    // No other way of checking: assume it's ok.
    return true;
}
