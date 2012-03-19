/*
 ______               __        __               
/\__  _\             /\ \__  __/\ \__            
\/_/\ \/   ___   _ __\ \ ,_\/\_\ \ ,_\    __     
   \ \ \  / __`\/\`'__\ \ \/\/\ \ \ \/  /'__`\   
    \ \ \/\ \L\ \ \ \/ \ \ \_\ \ \ \ \_/\ \L\.\_ 
     \ \_\ \____/\ \_\  \ \__\\ \_\ \__\ \__/.\_\
      \/_/\/___/  \/_/   \/__/ \/_/\/__/\/__/\/_/ 
*/

var 
  arrPosts       = new Array(),
  arrSources     = new Array(),
  lastFaviconURL = "",
  currentArticle = 0,
  readArticleMark = 0,
  unreadFlag     = "f",
  spinner, target,
  spinnerOpts = {lines: 12, length: 5, width: 4, radius: 21, color: '#000', speed: 1, trail: 64, shadow: false, hwaccel: false};
  
  var modalSpinner,
  modalSpinnerOpts = {lines: 8, length: 2, width: 2, radius: 4, color: '#000', speed: 1, trail: 64, shadow: false, hwaccel: false};

$(document).ready(function() {

    target = document.getElementById('spinner');
    spinner = new Spinner(spinnerOpts).spin(target);

    $('.article').hide();
    $('.noUnread').hide();

    // Keyboard bindings for humans and nerds
    $(document).bind('keydown', 'left', prevArticle);
    $(document).bind('keydown', 'right', nextArticle);
    $(document).bind('keydown', 'k', prevArticle);
    $(document).bind('keydown', 'j', nextArticle);
    $(document).bind('keydown', 'a', function(e) { e.preventDefault(); $("#addFeed").modal("toggle"); });

    // Button binding
    $('.menu .next').bind("click", nextArticle);

    // Hides the sources pane after 2000 ms
    var hideSourcesTimeOut = setTimeout(function(self){
        hideSources();
    }, 5000, this);

    // if the mouse is inside the sources pane, cancel the hiding
    $(".sources").on("mouseover", function() {
        clearTimeout(hideSourcesTimeOut);
    });

    // Add feed modal binding
    $('#addFeed .close').on("click", function(e) {
        e.preventDefault();
        $("#addFeed").modal("hide");
    });

    $('#addFeed').on('shown', function () {
        modalSpinner = new Spinner(modalSpinnerOpts);
        $('#addFeed input[type="text"]').focus();
    });

    // Add feed submission bindings
    $('#addFeed a').click(addFeed);

    // TODO: add form into the modal window so we don't need the following
    $('#addFeed input[type="text"]').keypress(function(e){ 
        if (e.which == 13) addFeed(e);
    });

    getSubscriptionList();
});

function addFeed(e) {
    e.preventDefault();

    var t = document.getElementById('modalSpinner');
    modalSpinner.spin(t);

    $("#addFeed").removeClass('error');

    var url = $('#addFeed').find('input[type="text"]').val();

    // Tries to discover the RSS of the URL, then tries to subscribe to it
    google.feeds.lookupFeed(url, subscribeToFeed); 
}

//Ask for all the blogs where the user is subscribed
function getSubscriptionList() {

    $('.sources ul').empty(); // empty the sources list

    var sreq = $.ajax({
        url: "/get/subscription-list",
        type: 'GET',
        beforeSend: function(r) {
            r.setRequestHeader("Auth_token", sessvars.Auth_token);
        },
        error: function(e) {
            spinner.stop();
            if (e.status == 401) window.location.href = "/login"; 
            // TODO: implement error messages
        },
        success: function(res) {
            $('.sources ul').append('<li id="allfeeds"><div><a href="#">All unread items</a><span>0</span></div></li>');
            jQuery.each(res.subscriptions, function(i,obj){
                var url = obj.htmlUrl;
                var name = obj.title;
                arrSources[sanitize(obj.id)] = obj.id;
                $('.sources ul').append('<li id="'+sanitize(obj.id)+'"><div><a href="#">'+name+'</a><span>0</span></div></li>');
                $('li#'+sanitize(obj.id)+' div a').truncate({width:200});
            });

            showSources();

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
                        } else {
                            $('li#'+sanitize(obj.id)+' div span').text(obj.count);
                            $('li#'+sanitize(obj.id)+' div span').show();
                        }
                    });
                    setFeed('all','t');
                    setSelected('allfeeds');
                }
            });

            $('.sources div.wrap').addClass("scroll-pane");
            $('.scroll-pane').jScrollPane();
        }
    });
}

//Function for changing the source for viewing
function setFeed(f,u){
    spinner.stop();
    $('.article').fadeOut();
    spinner = new Spinner(spinnerOpts).spin(target);
    arrPosts = new Array();

    if(f!='all'){
        if ((parseInt($('li#'+sanitize(arrSources[f])+' div span').text())>0) || (u == 'undefined')){
            unreadFlag = "t";
        } else {
            unreadFlag = "f";
        }
        _feed = encodeURIComponent(arrSources[f]);
    }else{
        _feed = 'all';
        unreadFlag = "t";
    }

    if ($('.noUnread').is(':visible')){
        $('.noUnread').hide();
    }

    $.ajax({
        url: 'get/feed/'+_feed+"/"+unreadFlag,
        type: 'GET',
        beforeSend: function(r) {
            r.setRequestHeader("Auth_token", sessvars.Auth_token);
        },
        success: function(resc) {
            jQuery.each(resc.items, function(i,obj){
                arrPosts[i] = obj;
            });
            showArticle(0);
            readArticleMark = 0;
            $('.article').fadeIn();
            spinner.stop();
        }
    });
}

function getMorePosts(f){
    _a = new Array();
    $.ajax({
        url: 'get/feed/'+f+"/"+unreadFlag,
        type: 'GET',
        beforeSend: function(r) {
            console.log('get/feed/'+f+"/"+unreadFlag);
            r.setRequestHeader("Auth_token", sessvars.Auth_token);
        },
        success: function(resc) {
            jQuery.each(resc.items, function(i,obj){
                _a[i] = obj;
            });
            _a.splice(0,5);
            arrPosts = arrPosts.concat(_a);
        }
    });
}

//Show an item on the UI
function showArticle(i){
    currentArticle = i;
    post = arrPosts[i];

    if (post) {
        $('.article .title h1 a').html(post.title);
        $('.article .title h1 a').attr('href', post.alternate[0].href);
        $('.article .title h2 a').attr('href', post.origin.htmlUrl);

        var faviconURL = post.origin.htmlUrl.replace("http://", "");
        $('.article .title h2 a').css("background", 'url(http://getfavicon.org/?url='+encodeURIComponent(faviconURL)+') 0 0 no-repeat');

        $('.article .title h2 a').html(post.origin.title);
        $('.article .content').text("");

        if (post.content){
            $('.article .content').append(post.content.content);
        } else if (post.summary) {
            $('.article .content').append('<p>'+post.summary.content+'</p><p><a href="'+post.alternate[0].href+'">Read more</a></p>');
        }
        cleanpost();
    }
}

function subscribeToFeed(result) {
    if (!result.error && result.url != null) {
        var url = result.url;

        $.ajax({
            type: 'GET',
            url: 'subscribe/'+encodeURIComponent(url),
            beforeSend: function(r) {
                r.setRequestHeader("Auth_token", sessvars.Auth_token);
            },
            success: function() {
                $("#addFeed").modal("hide");
                $('#addFeed').find('input[type="text"]').val("");
                modalSpinner.stop();
                getSubscriptionList()
            },
            error: function(resc) {
                console.log(resc);
            }
        });
    } else { // on error
        modalSpinner.stop();
        $("#addFeed").addClass('error');
        console.log(result.error.message);
    }
}

//Show the next item and mark this as unread
function nextArticle(e){
    e.preventDefault();

    if (!arrPosts[currentArticle]) return; 

    f = encodeURIComponent(arrPosts[currentArticle].origin.streamId);
    p = encodeURIComponent(arrPosts[currentArticle].id);
    _id = sanitize(arrPosts[currentArticle].origin.streamId);
    _c = parseInt($('li#'+_id+' div span').text());
    _t = getTotalCounter();
    console.log('current: '+currentArticle+'- readArticleMark: '+readArticleMark);
    if((unreadFlag=='t') && (currentArticle >= readArticleMark)){
        viewminispinner();
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
    }
    if (currentArticle < arrPosts.length-1){
        showArticle(currentArticle+1);
        readArticleMark = (currentArticle > readArticleMark) ? currentArticle : readArticleMark;
        if(currentArticle == arrPosts.length - 5){
            console.log('get more posts!!')
            getMorePosts(f);
        }
    } else {
        $('.article').fadeOut('slow', function(){
            $('.noUnread').fadeIn();
        });
    }
    window.scroll();
}

function prevArticle(e){
    e.preventDefault();
    if(currentArticle>0){
        showArticle(currentArticle-1);
    }
}

function isEmpty(str) { 
    return !str.match(/\S/g); 
}

function goToPermalink(){
    window.open(arrPosts[currentArticle].alternate[0].href);
}

// Function for removing shitty characters from the id property
function sanitize(str){
    if (isEmpty(str)) return;
    return str.replace('http://','').replace('www','').replace(/\//g,'-').replace(/\?/g,'_').replace(/\./g,'_');
}

// Sharing methods
function shareOnTwitter(){
    if ((arrPosts[currentArticle].title).length > 70){
        _t = (arrPosts[currentArticle].title).substring(0,70)+"..."
    } else {
        _t = arrPosts[currentArticle].title
    }
    _url = "http://twitter.com/home?status="+_t+ " - " +(arrPosts[currentArticle].alternate[0].href) + " - As read on @Siropeapp";
    window.open(_url);
}

function shareOnFacebook(){
    _url = "http://www.facebook.com/sharer.php?t="+arrPosts[currentArticle].title+"&u="+(arrPosts[currentArticle].alternate[0].href);
    window.open(_url);
}

