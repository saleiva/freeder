$(document).ready(function() {

  $("body").mousemove(function(e){
    $('.cursors_icon').fadeIn(300).css({
      left:  e.pageX +10,
      top:   e.pageY +5
    }).delay(5000).fadeOut(300, function(){
      $('.cursors_icon').remove();
    });
    if(e.pageX > window.innerWidth/2){
      $("body").css("cursor","e-resize");
    }else if((e.pageX < window.innerWidth/2)){
      $("body").css("cursor","w-resize");
    }
  });

  $("body").mousedown(function(e) {
    if(e.target == $("body")[0]){
      if(e.pageX > window.innerWidth/2){
        nextArticle(e);
      }else if(e.pageX < window.innerWidth/2){
        prevArticle(e);
      }
    }
  });

});
