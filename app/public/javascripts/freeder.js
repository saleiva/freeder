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
      			$('.sources ul').append('<li id="'+sanitize(obj.id)+'"><div><a href="#">'+name+'</a><span>0</span></div></li>');
      			$('li#'+sanitize(obj.id)+' div a').truncate({width:200});
   			});

   			//Get the counters for the unread articles
   			$.ajax({
			    url: 'http://localhost:3000/get/unread-count',
			    type: 'GET',
			    success: function(resc) {
			    	total_count = 0;
			    	var fe = null;
			        jQuery.each(resc.unreadcounts, function(i,obj){
		      			$('li#'+sanitize(obj.id)+' div span').text(obj.count);
		      			$('li#'+sanitize(obj.id)+' div span').show();
		      			total_count += obj.count;
		   			});
		   			
		   			//SET TOP COUNTER
		   			$('.header span').text("("+total_count+")");
		   			
		   			//SHOW BY DEFAULT THE FIRST SOURCE WITH UNREAD ITEMS
		   			$('.sources ul li').each(function() {
						if(($(this).find('div span').text()!='0') && (fe == null)){
							fe = $(this).attr('id');
						}
					});
		   			getFirstFeed(encodeURIComponent(arrSources[fe]));
			    }
			});
			$('.sources div.wrap').addClass("scroll-pane");
			$('.scroll-pane').jScrollPane();

			function getFirstFeed(f){
				$.ajax({
					url: 'http://localhost:3000/get/feed/'+f,
					type: 'GET',
					success: function(resc) {
						arrPosts = new Array();
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

//Function for changing the source that we are viewing
function setFeed(f){
	console.log(f);
	arrPosts = new Array();
	f = encodeURIComponent(arrSources[f]);
	$.ajax({
		url: 'http://localhost:3000/get/feed/'+f,
		type: 'GET',
		success: function(resc) {
			jQuery.each(resc.items, function(i,obj){
      			arrPosts[i] = obj;
   			});
   			console.log("Total articles received: "+arrPosts.length);
   			showArticle(0);
		}
	});
}

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


