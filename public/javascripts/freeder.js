
var arrPosts = new Array();
var currentArticle = 0;
var currentSource = 0;
var arrSources = new Array();
var unreadFlag = "f";

var spinner, target;
var opts = {lines: 12, length: 5, width: 4, radius: 21, color: '#000', speed: 1, trail: 64, shadow: false, hwaccel: false};

$(document).ready(function() {

	target = document.getElementById('spinner');
	spinner = new Spinner(opts).spin(target);

	$('.article').hide();
	$('.noUnread').hide();

	$(document).bind('keydown', 'right', function(){
		nextArticle();
	});

	//Ask for all the blogs where the user is subscripted
	var sreq = $.ajax({

	    url: "/get/subscription-list",
	    type: 'GET',
	    beforeSend: function(r) {
    		r.setRequestHeader("Auth_token", sessvars.Auth_token);
  		},
        error: function(e) {
            spinner.stop();
            // TODO: implement error messages
            //console.log(e.responseText);
        },
	    success: function(res) {
	            //console.log(res);
	        jQuery.each(res.subscriptions, function(i,obj){
	            //console.log(i, obj);
	        	var url = obj.htmlUrl;
	        	var name = obj.title;
	        	arrSources[sanitize(obj.id)] = obj.id;
      			$('.sources ul').append('<li id="'+sanitize(obj.id)+'"><div><a href="#">'+name+'</a><span>0</span></div></li>');
      			$('li#'+sanitize(obj.id)+' div a').truncate({width:200});
   			});

   			//Get the counters for the unread articles
   			$.ajax({
			    url: '/get/unread-count',
			    type: 'GET',
				beforeSend: function(r) {
    				r.setRequestHeader("Auth_token", sessvars.Auth_token);
    				viewminispinner();
				},
			    success: function(resc) {
			    	total_count = 0;
			    	var fe = null;
			    	var re = new RegExp("\/state/com.google/reading-list\+");

		   			jQuery.each(resc.unreadcounts, function(i,obj){
		   				if(obj.id.match(re)){
		      				updateTotalCounter(obj.count);
		      				console.log(obj);
		      			}else{
							$('li#'+sanitize(obj.id)+' div span').text(obj.count);
		      				$('li#'+sanitize(obj.id)+' div span').show();
		      			}
		   			});
		   			
		   			//SHOW BY DEFAULT THE FIRST SOURCE WITH UNREAD ITEMS
		   			$('.sources ul li').each(function() {
						if(($(this).find('div span').text()!='0') && (fe == null)){
							fe = $(this).attr('id');
						}
					});
					currentSource = fe;
		   			getFirstFeed(encodeURIComponent(arrSources[fe]));
			    }
			});
			$('.sources div.wrap').addClass("scroll-pane");
			$('.scroll-pane').jScrollPane();

			function getFirstFeed(f){
				$.ajax({
					url: '/get/feed/'+f+'/t',
					type: 'GET',
					beforeSend: function(r) {
	    				r.setRequestHeader("Auth_token", sessvars.Auth_token);
					},
					success: function(resc) {
						arrPosts = new Array();
						jQuery.each(resc.items, function(i,obj){
			      			arrPosts[i] = obj;
			   			});
			   			spinner.stop();
			   			$('.article').fadeIn();
			   			showArticle(0);
					}, error: function(e) {
					    spinner.stop();
					    // TODO: implement error messages
					    // console.log(e.responseText);
                    }
				});
			}
		}
	});

	//Binding buttons events
	$('.menu .next').bind("click",function(event){
		nextArticle();
	});

});

//Function for changing the source for viewing
function setFeed(f,u){
	spinner.stop();
	$('.article').fadeOut();
	spinner = new Spinner(opts).spin(target);
	arrPosts = new Array();
	if((parseInt($('li#'+sanitize(arrSources[f])+' div span').text())>0) || (u == 'undefined')){
		_u = "t";
	}else{
		_u = "f";
		
	}
	if($('.noUnread').is(':visible')){
		$('.noUnread').hide();
	}
	$.ajax({
		url: 'get/feed/'+encodeURIComponent(arrSources[f])+"/"+_u,
		type: 'GET',
		beforeSend: function(r) {
	    	r.setRequestHeader("Auth_token", sessvars.Auth_token);
		},
		success: function(resc) {
			jQuery.each(resc.items, function(i,obj){
      			arrPosts[i] = obj;
   			});
   			currentSource = f;
   			showArticle(0);
   			$('.article').fadeIn();
   			spinner.stop();
		}
	});
}

//Show an item on the UI
function showArticle(i){
	currentArticle = i;
	post = arrPosts[i];
	$('.title h1 a').text(post.title);
	$('.title h1 a').attr('href',post.alternate[0].href);
	$('.title h2 a').attr('href',post.alternate[0].href);
	$('.title h2 a').text(post.origin.title);
	$('.content').text("");
	if(post.content){
		$('.content').append(post.content.content);
	}else{
		$('.content').append('<p>'+post.summary.content+'</p><p><a href="'+post.alternate[0].href+'">Read more</a></p>');
	}
	cleanpost();
}

//Show the next item and mark this as unread
function nextArticle(){
	f = encodeURIComponent(arrSources[currentSource]);
	p = encodeURIComponent(arrPosts[currentArticle].id);
	_id = sanitize(arrSources[currentSource]);
	_c = parseInt($('li#'+_id+' div span').text())
	_t = parseInt(($('.header p span').text()).substring(1,($('.header p span').text()).length-1));
	viewminispinner();
	// console.log("Marking as read: ", f, p);
	$.ajax({
		url: '/markasread/'+f+'/'+p,
		type: 'GET',
		beforeSend: function(r) {
	    	r.setRequestHeader("Auth_token", sessvars.Auth_token);
	    	r.setRequestHeader("Action_token", sessvars.Action_token);
		},
		success: function(resc) {
			if(_c>0){
				_c -= 1;
				_t -= 1;
			}
			$('li#'+_id+' div span').text(_c);
			updateTotalCounter(_t);
			if(_c==0){
				$('li#'+_id+' div span').hide();
			}
		}
	});
	if (currentArticle < arrPosts.length-1){
		showArticle(currentArticle+1);
	}else{
		$('.article').fadeOut('slow', function(){
			$('.noUnread').fadeIn();
		});
	}
	window.scroll();
}

function shareOnTwitter(){
	if ((arrPosts[currentArticle].title).length > 70){
		_t = (arrPosts[currentArticle].title).substring(0,70)+"..."
	}else{
		_t = arrPosts[currentArticle].title
	}
	_url = "http://twitter.com/home?status="+_t+ " - " +(arrPosts[currentArticle].alternate[0].href) + " - As read on @Siropeapp";
	window.open(_url);
}

function shareOnFacebook(){
	_url = "http://www.facebook.com/sharer.php?t="+arrPosts[currentArticle].title+"&u="+(arrPosts[currentArticle].alternate[0].href);
	window.open(_url);
}

function goToPermalink(){
	window.open(arrPosts[currentArticle].alternate[0].href);
}

//Function for removing shitty characters from the id property
function sanitize(str){
	return str.replace('http://','').replace('www','').replace(/\//g,'-').replace(/\?/g,'_').replace(/\./g,'_');
}


