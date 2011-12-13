$(document).ready(function() {

	$('.scroll-pane').jScrollPane();

//http://code.google.com/p/pyrfeed/wiki/GoogleReaderAPI

	$.ajax({

	    //url: 'http://www.google.com/reader/api/0/subscription/list?output=json',
	    url: 'http://localhost:8888/data/subscription-list.json',
	    type: 'GET',
	    success: function(res) {
	        jQuery.each(res.subscriptions, function(i,obj){
	        	var url = obj.htmlUrl;
	        	var name = obj.title;
      			$('.sources ul').append('<li class="'+sanitize(obj.id)+'"><div><a href="'+url+'">'+name+'</a><span>0</span></div></li>');
      			$('li.'+sanitize(obj.id)+' div a').truncate({width:200});
   			});

   			$.ajax({
			    //url: 'http://www.google.com/reader/api/0/unread-count?output=json',
			    url: 'http://localhost:8888/data/unread-count.json',
			    type: 'GET',
			    success: function(resc) {
			    	console.log(resc);
			        jQuery.each(resc.unreadcounts, function(i,obj){
		      			$('li.'+sanitize(obj.id)+' div span').text(obj.count);
		      			$('li.'+sanitize(obj.id)+' div span').show();
		   			});
			    }
			});
		$('.sources div.wrap').addClass("scroll-pane");
	    }
	});
});

//Function for removing shitty characters from the id property
function sanitize(str){
	return str.replace('http://','').replace('www','').replace(/\//g,'-').replace(/\?/g,'_').replace(/\./g,'_');
}