var selected = false;

init ();

function init () {
    if (!selected) {
	setMapSize ();
    } else {
	setDisplay ();
    }
}

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
	    map.once ('postcompose', function (event) {
		var canvas = event.context.canvas;
		console.log (canvas.toDataURL ('image/png'));
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

function resizeMap () {
    var map = document.getElementById ('map');

    var retour = document.getElementById ('RETOUR-map');
    retour.style.display = 'none';

    var ok = document.getElementById ('OK-map');	
    ok.style.display = 'ok';
    
    var modal = document.getElementById ('map-modal');
    var container = document.getElementById ('frame');	
    container.hidden = true;
    
    var nav = document.getElementById ('navbar');
    
    $('#map-modal').height( (window.outerHeight - nav.clientHeight) * 0.6);
    console.log ($('#map-modal').height ());
    $('#map-modal').width(map.clientWidth);
    $('#map-modal').height (map.clientHeight);
    var map_frame = document.getElementById ('map-frame');
    $('#map-frame').height (map.clientHeight); 
}


function afficheMap () {
    var retour = document.getElementById ('RETOUR-map');
    retour.style.display = 'none';

    var ok = document.getElementById ('OK-map');	
    ok.style.display = '';
    
    var container = document.getElementById ('frame');	
    container.hidden = true;    

    var map = document.getElementById ('map-frame');
    map.hidden = false;
    
    window.onresize = resizeMap;    
}

function resizeFrame () {
    var viewer = document.createElement ("iframe");
    var container = document.getElementById('frame');
    container.hidden = false;

    var retour = document.getElementById ('RETOUR-map');	
    retour.style.display = '';

    var ok = document.getElementById ('OK-map');	
    ok.style.display = 'none';


    retour.addEventListener ('click', afficheMap, false);
    
    for (var i = 0; i < container.children.length; i++)
	container.removeChild (container.children [0]);

    container.appendChild (viewer);
    
    var nav = document.getElementById ('navbar');
    viewer.src="pages/iframe.html";
    
    viewer.width = $('#frame').width ();
    viewer.height = (window.outerHeight - nav.clientHeight) * 0.6;
    viewer.setAttribute( 'scrolling', 'no' );  
}

function setDisplay () {

    $(document).ready (resizeFrame);
    window.onresize = resizeFrame;
    resizeFrame ();

    var map = document.getElementById ('map-frame');    
    map.hidden = true;

}


