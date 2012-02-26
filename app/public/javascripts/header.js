var minispinner;
var minispinner_o = {
	lines: 8, // The number of lines to draw
	length: 2, // The length of each line
	width: 2, // The line thickness
	radius: 4, // The radius of the inner circle
	color: '#000', // #rgb or #rrggbb
	speed: 1, // Rounds per second
	trail: 62, // Afterglow percentage
	shadow: false, // Whether to render a shadow
	hwaccel: false // Whether to use hardware acceleration
};

function viewminispinner(){
	minispinner_t = document.getElementById('minispinner');
	minispinner = new Spinner(minispinner_o).spin(minispinner_t);
}

function hideminispinner(){
	minispinner.stop();
}
