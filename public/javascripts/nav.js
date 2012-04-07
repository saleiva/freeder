$(document).ready(function() {

	$("body").mousemove(function(e){
		if(e.pageX > window.innerWidth/2){
			$("body").css("cursor","e-resize");
		}else if((e.pageX < window.innerWidth/2)){
			$("body").css("cursor","w-resize");
		}
	});

	$("body").mousedown(function(e){;
		if(e.target == $("body")[0]){
			if(e.pageX > window.innerWidth/2){
				nextArticle(e);
			}else if(e.pageX < window.innerWidth/2){
				prevArticle(e);
			}
		}
	});

});