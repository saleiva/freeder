//http://code.google.com/p/pyrfeed/wiki/GoogleReaderAPI
//http://blog.martindoms.com/2009/10/16/using-the-google-reader-api-part-2/

var arrPosts = new Array();
var currentArticle = 0;

$(document).ready(function() {

	var arrSources = new Array();

	//Ask for all the blogs where the user is subscripted
	$.ajax({

	    //url: 'http://www.google.com/reader/api/0/subscription/list?output=json',
	    url: 'http://localhost:8080/data/subscription-list.json',
	    //url: "http://localhost:8080/http://www.google.com/reader/api/0/subscription/list?output=json"
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
			    //url: 'http://www.google.com/reader/api/0/unread-count?output=json',
			    url: 'http://localhost:8888/data/unread-count.json',
			    type: 'GET',
			    success: function(resc) {
			    	total_count = 0;
			        jQuery.each(resc.unreadcounts, function(i,obj){
		      			$('li#'+sanitize(obj.id)+' div span').text(obj.count);
		      			$('li#'+sanitize(obj.id)+' div span').show();
		      			total_count += obj.count;
		   			});
		   			console.log("total unread items: "+total_count)
			    }
			});
			$('.sources div.wrap').addClass("scroll-pane");
			$('.scroll-pane').jScrollPane();
		
			//Get items for the first source on the source list
			first_source = $('.sources ul li').first();
			//THIS EXCLUDES READ ITEMS -- http://www.google.com/reader/api/0/stream/contents/feed/http://astronomycast.com/podcast.xml?&r=n&xt=user/-/state/com.google/read&n=20
			//http://www.google.com/reader/api/0/stream/contents/feed/http://astronomycast.com/podcast.xml?&r=n&n=20
			f_url = "http://www.google.com/reader/api/0/stream/contents/"+arrSources["feed-_actualidadipad_com-feed-"]+"?&r=n&n=20"
			console.log(f_url);
			$.ajax({
				url: 'http://localhost:8888/data/feed_yorokobu.json',
				type: 'GET',
				success: function(resc) {
					jQuery.each(resc.items, function(i,obj){
		      			arrPosts[i] = obj;
		   			});
		   			showArticle(0);
				}
			});
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


