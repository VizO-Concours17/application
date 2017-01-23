
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
	var buttonOk = document.getElementById('map-ok');
	
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
		// On r�cupre l'image qu'on va convertir en texture
		var texture = document.getElementById('3d-texture');
		texture.src = canvas.toDataURL('image/png');

		// on r�cupere les coordon�es de la map a envoyer au serveur		
		var extent = map.getView ().calculateExtent (map.getSize ());
		var coords = ol.proj.transformExtent (extent, 'EPSG:3857', 'EPSG:4326');		
	    });
	    map.renderSync ();
	    setDisplay ();
	}, false);

	var search = document.getElementById('geoSearch');
	search.onsubmit = function (e) {
	    var value = document.getElementById('geoSearchValue').value;
	    $.ajax ({
		url: "http://maps.google.com/maps/api/geocode/json?address=" + value + "+France",
	    }).done (function (data) {
		console.log (data);
		map.getView ().setCenter (ol.proj.transformExtent ([data.results[0].geometry.bounds.northeast.lng,
								    data.results[0].geometry.bounds.northeast.lat,
								    data.results[0].geometry.bounds.southwest.lng,
								    data.results[0].geometry.bounds.southwest.lat],
								   'EPSG:4326', 'EPSG:3857'));

		map.getView().fit(ol.proj.transformExtent ([data.results[0].geometry.bounds.northeast.lng,
							    data.results[0].geometry.bounds.northeast.lat,
							    data.results[0].geometry.bounds.southwest.lng,
							    data.results[0].geometry.bounds.southwest.lat],
							   'EPSG:4326', 'EPSG:3857'), map.getSize ());
		map.updateSize ();
		console.log (map.getView ().calculateExtent (map.getSize ()));
	    });
	    
	    return false;
	};
    }
    
    //$(document).ready (resizeMap);
    //window.onresize = resizeMap;
    //resizeMap ();    
    onOk ();
}

/**
   Retaille la map apr�s un changement de taille d'ecran
*/
function resizeMap () {

}



/**
   Retaille le rendu 3d quand on change la taille de la fenetre
*/
function resize3dContent () {
    var viewer = document.createElement ("iframe");
    viewer.id = "viewer";
    
    var container = document.getElementById('3d-frame');

   
    for (var i = 0; i < container.children.length; i++)
	container.removeChild (container.children [0]);

    container.appendChild (viewer);
    
    var nav = document.getElementById ('navbar');
    
    var location = window.location.href;
    location = location.substr (0, location.lastIndexOf ('/'));
    viewer.src = location + "/pages/iframe.html";
    
    viewer.contentDocument.images += ($('#3d-texture').innerHtml);
    
    viewer.width = '100%';
    viewer.border = '';
    //viewer.height = (window.outerHeight - nav.clientHeight) * 0.6;
    viewer.height = '100%';
    viewer.setAttribute('scrolling', 'no');
    viewer.setAttribute('style', 'border:none');

}

/**
   On affiche le rendu 3d.
   Met a jour les �v�nements
*/
function setDisplay () {
    $(document).ready(resize3dContent);
    window.onresize = resize3dContent;
    resize3dContent();

    //TODO : Charger les donn�es du filtre puis afficher le filtre
    $('.subblockmenu').css('visibility', 'visible');
}


