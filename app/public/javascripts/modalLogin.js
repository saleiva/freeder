$(document).ready(function(){
        //parametros principales
        
        var contenidoHTML = '<p class="modalTitle">Sign-in on Freeder with your Google account.</p><form><input type="text" id="email_input" placeholder="Google email"><input type="password" id="pwd_input" placeholder="Password"><a href="#" onClick="doLogin()" type="submit" class="btn">Sign in</a></form><div class="footer">Don’t remember your account data? <a href="#">Ask Google for them</a><div>';
        
        var ancho = 600; 
        var alto = 260;

        $('.bigButton').bind('click', function(){
                // fondo transparente
                // creamos un div nuevo, con dos atributos
                var bgdiv = $('<div onclick=\"closeModal()\">').attr({
                                        className: 'bgtransparent',
                                        id: 'bgtransparent'
                                        });
                
                // agregamos nuevo div a la pagina
                $('body').append(bgdiv);
                
                // obtenemos ancho y alto de la ventana del explorer
                var wscr = $(window).width();
                var hscr = $(window).height();
                
                //establecemos las dimensiones del fondo
                $('#bgtransparent').css("width", wscr);
                $('#bgtransparent').css("height", hscr);
                
                // ventana modal
                // creamos otro div para la ventana modal y dos atributos
                var moddiv = $('<div>').attr({
                                        className: 'bgmodal',
                                        id: 'bgmodal'
                                        });     
                
                // agregamos div a la pagina
                $('body').append(moddiv);

                // agregamos contenido HTML a la ventana modal
                $('#bgmodal').append(contenidoHTML);
                
                // redimensionamos para que se ajuste al centro y mas
                $(window).resize();
        });

        $(window).resize(function(){
                // dimensiones de la ventana del explorer 
                var wscr = $(window).width();
                var hscr = $(window).height();

                // estableciendo dimensiones de fondo
                $('#bgtransparent').css("width", wscr);
                $('#bgtransparent').css("height", hscr);
                
                // estableciendo tamaño de la ventana modal
                $('#bgmodal').css("width", ancho+'px');
                $('#bgmodal').css("height", alto+'px');
                
                // obtiendo tamaño de la ventana modal
                var wcnt = $('#bgmodal').width();
                var hcnt = $('#bgmodal').height();
                
                // obtener posicion central
                var mleft = ( wscr - wcnt ) / 2;
                var mtop = ( hscr - hcnt ) / 2;
                
                // estableciendo ventana modal en el centro
                $('#bgmodal').css("left", mleft+'px');
                $('#bgmodal').css("top", mtop+'px');
        });
        
 });
        
function closeModal(){
        // removemos divs creados
        $('#bgmodal').remove();
        $('#bgtransparent').remove();
}