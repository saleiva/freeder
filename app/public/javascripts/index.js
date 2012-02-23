function doLogin(){
	_u = $('form > input#email_input').val();
	_p = $('form > input#pwd_input').val();
	console.log(_u +"...."+_p);
	$.ajax({
		url: 'http://localhost:3000/login/'+_u+'/'+_p,
		type: 'GET',
		success: function(resc) {
   			if (resc == "KO"){
   				console.log("ERROR ON LOGIN");
   			}else{
   				console.log("LOGIN OK");
   				window.location.href='http://localhost:3000/articles';
   			}
		}
	});
}