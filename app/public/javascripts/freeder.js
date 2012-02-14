//http://code.google.com/p/pyrfeed/wiki/GoogleReaderAPI
//http://blog.martindoms.com/2009/10/16/using-the-google-reader-api-part-2/

var arrPosts = new Array();
var currentArticle = 0;
var arrSources = new Array();

$(document).ready(function() {


	//Ask for all the blogs where the user is subscripted
	$.ajax({

	    url: "http://localhost:3000/get/subscription-list",
	    type: 'GET',
	    success: function(res) {
	        jQuery.each(res.subscriptions, function(i,obj){
	        	var url = obj.htmlUrl;
	        	var name = obj.title;
	        	arrSources[sanitize(obj.id)] = obj.id;
      			$('.sources ul').append('<li id="'+sanitize(obj.id)+'"><div><a href="'+url+'">'+name+'</a><span>0</span></div></li>');
      			$('li#'+sanitize(obj.id)+' div a').truncate({width:200});
   			});

   			//Get the counters for the unread articles
   			$.ajax({
			    url: 'http://localhost:3000/get/unread-count',
			    type: 'GET',
			    success: function(resc) {
			    	total_count = 0;
			        jQuery.each(resc.unreadcounts, function(i,obj){
		      			$('li#'+sanitize(obj.id)+' div span').text(obj.count);
		      			$('li#'+sanitize(obj.id)+' div span').show();
		      			total_count += obj.count;
		   			});
		   			console.log("total unread items: "+total_count)
		   			fe = $('.sources ul li').first().attr('id');
		   			getFirstFeed(encodeURIComponent(arrSources[fe]));
			    }
			});
			$('.sources div.wrap').addClass("scroll-pane");
			$('.scroll-pane').jScrollPane();

			//THIS EXCLUDES READ ITEMS -- http://www.google.com/reader/api/0/stream/contents/feed/http://astronomycast.com/podcast.xml?&r=n&xt=user/-/state/com.google/read&n=20
			function getFirstFeed(f){
				console.log('GET FIRST FEED FROM: http://localhost:3000/get/feed/'+f+'?&r=n&n=20');
				$.ajax({
					url: 'http://localhost:3000/get/feed/'+f+'?&r=n&n=20',
					type: 'GET',
					success: function(resc) {
						jQuery.each(resc.items, function(i,obj){
			      			arrPosts[i] = obj;
			   			});
			   			showArticle(0);
					}
				});
			}
		}
	});

	//Binding buttons events
	$('.menu .skip').bind("click",function(event){
		nextArticle();
	});
	$('.menu .next').bind("click",function(event){
		nextArticle();
	});

});

//Function for showing the information of an article on the UI
function showArticle(i){
	currentArticle = i;
	console.log("showing article: "+ currentArticle)

	post = arrPosts[i];
	$('.title h1').text(post.title);
	$('.title h2 a').attr('href',post.origin.htmlUrl);
	$('.title h2 a').text(post.origin.title);

	//TODO. Restyle the content. Now it's ugly
	$('.content').text("");
	$('.content').append(post.content.content);
	cleanpost();

}

//Function for going to the next article
function nextArticle(){
	//TODO: Mark actual article as read
	showArticle(currentArticle+1);
}

//Function for removing shitty characters from the id property
function sanitize(str){
	return str.replace('http://','').replace('www','').replace(/\//g,'-').replace(/\?/g,'_').replace(/\./g,'_');
}


