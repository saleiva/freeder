
function doLogin(){
	_u = $('form > input#email_input').val();
	_p = $('form > input#pwd_input').val();
	var ajxreq = $.ajax({
		url: 'http://localhost:3000/login/'+_u+'/'+_p,
		type: 'GET',
		success: function(resc) {
   			if (resc == "KO"){
   				console.log("ERROR ON LOGIN");
   			}else{
   				sessvars.Auth_token = ajxreq.getResponseHeader('Auth_token');
   				console.log(sessvars.Auth_token);
   				sessvars.Action_token = ajxreq.getResponseHeader('Action_token');
   				window.location.href='http://localhost:3000/articles';
   			}
		}
	});
}