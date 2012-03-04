//HANDLES LOGIN MODAL WINDOW INTERACTIVITY


$(document).ready(function(){
    
    var cHTML = '<p class="modalTitle">Sign-in on Freeder with your Google account.</p><form><input type="text" id="email_input" placeholder="Google email"><input type="password" id="pwd_input" placeholder="Password"><a href="#" onClick="doLogin()" type="submit" class="btn">Sign in</a></form><div class="footer">Don’t remember your account data? <a href="#">Ask Google for them</a><div>';
    
    var mwidth = 600; 
    var mheight = 260;

    $('.bigButton').bind('click', function(){
        //Create background DIV
        var bgdiv = $('<div onclick=\"closeModal()\">').attr({
            className: 'bgtransparent',
            id: 'bgtransparent'
        });
        $('body').append(bgdiv);
        
        //Create modal window
        var moddiv = $('<div>').attr({
            className: 'bgmodal',
            id: 'bgmodal'
        });     
        $('body').append(moddiv);
        $('#bgmodal').append(cHTML);

        $('form > input#email_input').focus();

        $('form > input').focus(function(){
            $('form > input').removeClass('error');
        });

        $(window).resize();

    });

    $(window).resize(function(){
        //Get window size and position the bkg and the modal
        var wscr = $(window).width();
        var hscr = $(window).height();

        $('#bgtransparent').css("width", wscr);
        $('#bgtransparent').css("height", hscr);
        
        $('#bgmodal').css("width", mwidth+'px');
        $('#bgmodal').css("height", mheight+'px');
        
        $('#bgmodal').css("left", (wscr - mwidth)/2 +'px');
        $('#bgmodal').css("top", (hscr - mheight)/2 +'px');
    });

});

//Sends form contents to the proxy for Authentication
function doLogin(){
    var ajxreq = $.ajax({
        url: '/login/'+$('form > input#email_input').val()+'/'+$('form > input#pwd_input').val(),
        type: 'GET',
        success: function(resc) {
            console.log(resc);
            if (resc == "ERROR"){
                console.log("ERROR ON LOGIN");
                $('form > input').addClass('error');
            }else{
                sessvars.Auth_token = ajxreq.getResponseHeader('Auth_token');
                console.log(sessvars.Auth_token);
                sessvars.Action_token = ajxreq.getResponseHeader('Action_token');
                window.location.href='/read';
            }
        }
    });
}

//Closes modal window
function closeModal(){
    $('#bgmodal').remove();
    $('#bgtransparent').remove();
}