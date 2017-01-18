
var selected = false;

init ();


/**
   A l'initialisation, on affiche la carte
*/
function init () {
    if (!selected) {
	setMapSize ();
    } else {
	setDisplay ();
    }
}

/**
   Centre la map sur la france, genere l'evenement du bouton OK
*/
function setMapSize () {
   
    function onOk () {
	
	var map = new ol.Map ({
	    target: 'map-frame',
	    layers: [
		new ol.layer.Tile ({
		    source: new ol.source.OSM ()
		})
	    ],
	    view: new ol.View ({		
		center: [2., 46.5],
		zoom: 5
	    })
	});

	map.getView().setCenter (ol.proj.transform ([2, 46.5], 'EPSG:4326', 'EPSG:3857'));
	var buttonOk = document.getElementById ('OK-map');
	buttonOk.addEventListener ('click', function (e) {
	    map.once ('precompose', function (event) {
		var canvas = event.context.canvas;
		var dpi = 500;
		var scaleFactor = dpi / 96;
		canvas.width = Math.ceil(canvas.width * scaleFactor);
		canvas.height = Math.ceil(canvas.height * scaleFactor);
		var ctx=canvas.getContext("2d");
		ctx.scale(scaleFactor, scaleFactor);	
	    });
	    
	    map.once ('postcompose', function (event) {
		var canvas = event.context.canvas;
		// On récupre l'image qu'on va convertir en texture
		var img = document.getElementById ('img');		
		img.src = canvas.toDataURL ('image/png');

		// on récupere les coordonées de la map a envoyer au serveur		
		var extent = map.getView ().calculateExtent (map.getSize ());
		var coords = ol.proj.transformExtent (extent, 'EPSG:3857', 'EPSG:4326');		
	    });
	    map.renderSync ();
	    setDisplay ();
	}, false);
    }
    
    $(document).ready (resizeMap);
    window.onresize = resizeMap;
    resizeMap ();
    onOk ();
}

/**
   Retaille la map après un changement de taille d'ecran
*/
function resizeMap () {
    var map = document.getElementById ('map');

    var retour = document.getElementById ('RETOUR-map');
    retour.style.display = 'none';

    var ok = document.getElementById ('OK-map');	
    ok.style.display = 'ok';
    
    var modal = document.getElementById ('map-modal');
    var container = document.getElementById ('3d-content');	
    container.hidden = true;
    
    var nav = document.getElementById ('navbar');
    
    $('#map-modal').height( (window.outerHeight - nav.clientHeight) * 0.6);    
    $('#map-modal').width ($('#map-modal').height ());       
    $('#map-frame').height (map.clientHeight); 
}


/**
   Affiche la map (utilisé quand on appuie sur le bouton retour), et remet les événements comme il faut
 */
function afficheMap () {
    var retour = document.getElementById ('RETOUR-map');
    retour.style.display = 'none';

    var ok = document.getElementById ('OK-map');	
    ok.style.display = '';
    
    var container = document.getElementById ('3d-content');	
    container.hidden = true;    

    var map = document.getElementById ('map-frame');
    map.hidden = false;
    
    window.onresize = resizeMap;
    $('#map-modal').width(map.clientHeight);
    $('#map-modal').height (map.clientHeight);
    resizeMap ();
}

/**
   Retaille le rendu 3d quand on change la taille de la fenetre
*/
function resizeFrame () {
    var viewer = document.createElement ("iframe");
    viewer.id = "viewer";
    var d3 = document.getElementById ('3d-content');
    d3.hidden = false;
    
    var container = document.getElementById('frame');

    var retour = document.getElementById ('RETOUR-map');	
    retour.style.display = '';

    var ok = document.getElementById ('OK-map');	
    ok.style.display = 'none';


    retour.addEventListener ('click', afficheMap, false);
    
    for (var i = 0; i < container.children.length; i++)
	container.removeChild (container.children [0]);

    container.appendChild (viewer);
    
    var nav = document.getElementById ('navbar');
    viewer.src = "pages/iframe.html";
    viewer.contentDocument.images += ($('#img').innerHtml);
    
    $('#map-modal').width(map.clientWidth);
    $('#map-modal').height (map.clientHeight);
    
    viewer.width = $('#frame').width ();
    viewer.height = (window.outerHeight - nav.clientHeight) * 0.6;
    viewer.setAttribute( 'scrolling', 'no' );

}

/**
   On affiche le rendu 3d.
   Met a jour les événements
*/
function setDisplay () {
    
    $(document).ready (resizeFrame);
    window.onresize = resizeFrame;
    resizeFrame ();

    var map = document.getElementById ('map-frame');    
    map.hidden = true;
}
