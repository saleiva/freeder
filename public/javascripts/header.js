var minispinner;
var minispinner_o = {lines: 8, length: 2, width: 2, radius: 4, color: '#000', speed: 1, trail: 64, shadow: false, hwaccel: false};

function viewminispinner(){
	minispinner_t = document.getElementById('minispinner');
	minispinner = new Spinner(minispinner_o).spin(minispinner_t);
}

function updateTotalCounter(n){
	p = (n==1000) ? "+" : "";
	$('.header span').text("("+p+n+")");
	minispinner.stop();
}