
/**
   Fichier complétement inutile.
*/

var map = new ol.Map ({
    target: 'map',
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


var exportPNGElement = document.getElementById ('export-png');

exportPNGElement.addEventListener ('click', function (e) {
    map.once('postcompose', function (event) {
	var canvas = event.context.canvas;
	console.log (event.feature.getGeometry ().getCoordinates ());
	exportPNGElement.href = canvas.toDataURL ('image/png');
    });
    map.renderSync ();
}, false);
	    



