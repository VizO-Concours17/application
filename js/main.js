
var scene, camera, renderer, labelRenderer;
var ancx = -1, ancy = -1, start;
var phi = 0, teta = 60, target;
var precise = .3;
var raycaster, labels;


var meshPerYear, currentYear;

var points;

/**
   15h30 20 janvier

   Pour les couleurs : 

   - Pas recherchée : pas de boule
   - Cherchée non-quantifiée : 

   --- valeur ...
   |
   |
   --- limite de quantification : 0.1 ug / L
   |
   |
   |
   --- limite de détéction : 0.05 ug / L  

   
   Code couleur : {pas de quantif : blanc, < 0.1 : jaune, 0.1 < x < 0.5 : orange, 0.5 < x < 5 : rouge, > 5 : rouge/noir}
*/

/**
   cylindre suivi d'un polygone (par défaut une sphere)
   | label top
   | label bottom
   | x
   | y
   | z 
   | couleur de ligne
   | epaisseur ligne
   | bottom color
   | bottom radius
   | bottom shape
*/


init ();
animate ();

/**
   Fonction qui initialise le contexte
*/
function init() {

    createBasicRender ();
    createPickingDatas ();

    
    computeViewMatrix ();
    var datas = fillPoints ();           
    createDatas (datas);


    for (var i = 0; i < meshPerYear [0].length; i++) {
	scene.add (meshPerYear [0][i]);
    }
    currentYear = 0;

    
    var range = window.parent.document.getElementById ('range');
    if (range != null) {
	range.max = meshPerYear.length - 1;
	range.value = 0;
	range.onchange = rangeChanged;
    }
}


/**
   On a changer l'ann�e en cours, on modifie les mesh a afficher
*/
function rangeChanged () {
    var range = window.parent.document.getElementById ('range');
    var y1 = currentYear;
    currentYear = range.value;
    changeYear (y1, currentYear);
}


/**
   Fonction qui va appeler les informations de la base pour connaitre les differents points.
   TODO, pour le moment on fait au hasard
   Cette fonction devra aussi r�cuperer les informations de masse d'eau, params...
*/
function fillPoints () {
    var points = [];
    for (var i = 0; i < 50; i++) {
	points.push ([])
	var x = (Math.random () * 1000) - 500, y = (Math.random () * 1000) - 500, z = (Math.random () * 100);
	for (var year = 0; year  < 4; year++) {	    
	    points [i].push ({x : x,
			      y : y,
			      z : z,
			      labelBot : 'Bottom',
			      labelTop : 'Top',
			      depth : Math.random () * 100 + 200,
			      lineColor : (Math.random()*0xFFFFFF<<0),
			      lineWidth : (Math.random () * 10) + 5,
			      sphereColor : (Math.random()*0xFFFFFF<<0),
			      sphereRadius : (Math.random () * 10) + 15});
	    
	}
    }
    return points;
}

/**
   On cree les meshs associes aux points.
*/
function createDatas (datas) {
    meshPerYear = [];
    if (datas.length > 0) {
	for (var year = 0; year < datas [0].length; year++) {
	    var total = [];
	    for (var i = 0; i < datas.length; i++) {
		var ret = createBoxe (datas [i][year]);
		for (var m = 0; m < ret.length; m++) {
		    total.push (ret [m]);
		    ret [m].idObj = i;
		}
	    }
	    meshPerYear.push (total);
	}
    }
}

/**
   Le range a changer, on change les mesh que l'on affiche
*/
function changeYear (y1, y2) {
    for (var i = 0; i < meshPerYear [y1].length; i++)
	scene.remove (meshPerYear [y1][i]);
    for (var i = 0; i < meshPerYear [y2].length; i++)
	scene.add (meshPerYear [y2][i]);
}

/**
   On cree les mesh associe a un point
*/
function createBoxe (data) {
    var box = new THREE.BoxGeometry (data['lineWidth'] * 4, 5, data['lineWidth'] * 4);
    var cyl = new THREE.CylinderGeometry (data['lineWidth'], data['lineWidth'], data['depth'], 10, 10, false, 0, 6.3);
    var sphere = new THREE.SphereGeometry (data['sphereRadius'], 10, 10);
    var cyl_mat = new THREE.MeshLambertMaterial ({color : data['lineColor']});    
    var sph_mat = new THREE.MeshLambertMaterial ({color : data['sphereColor']});

    var cyl_mesh = new THREE.Mesh (cyl, cyl_mat);
    cyl_mesh.position.x = data ['x'];
    cyl_mesh.position.y = (data ['z'] - data['depth'] / 2);
    cyl_mesh.position.z = data ['y'];
    cyl_mesh.castShadow = true;
    
    var box_mesh = new THREE.Mesh (box, cyl_mat);
    box_mesh.position.x = data['x'];
    box_mesh.position.z = data['y'];
    box_mesh.position.y = data ['z'];
    box_mesh.castShadow = true;
    box_mesh.name = data['labelTop'];
        
    var sph_mesh = new THREE.Mesh (sphere, sph_mat);
    sph_mesh.position.x = data['x'];
    sph_mesh.position.y = data['z'] - data['depth'];
    sph_mesh.position.z = data['y'];
    sph_mesh.castShadow = true;
    sph_mesh.name = data['labelBot'];
    
    return [sph_mesh, cyl_mesh, box_mesh];
}


/**
   Mise a jour de la camera quand on bouge la souris
*/
function cameraUpdate (event) {
    var x = event.clientX, y = event.clientY;
    if (event.buttons != 0) {
	if (ancx != -1) {
	    var posx = ancx - x;
	    var posy = ancy - y;
	    phi = (phi + Math.trunc (precise * posx)) % 360;
	    teta = (teta - Math.trunc(precise * posy)) % 360;
	    if (teta < 1) teta = 1;
	    if (teta > 170) teta = 179;
	}
	
	computeViewMatrix ();
	ancx = x;
	ancy = y;	
    } else {
	ancx = -1;
	ancy = -1;
    }
}

/**
   Calcule de la matrice de vue de la camera (coordonnées)
*/
function computeViewMatrix () {
    var pos = camera.position;
    var radius = Math.abs (pos.distanceTo(target));
    
    pos.x = target.x + radius * Math.sin (teta * Math.PI / 180.0) * Math.sin (phi * Math.PI / 180.0);
    pos.y = target.y + radius * Math.cos (teta * Math.PI / 180.0);
    pos.z = target.z + radius * Math.sin (teta * Math.PI / 180.0) * Math.cos (phi * Math.PI / 180.0);
    
    camera.position = pos;
    camera.lookAt (target);
    camera.updateMatrixWorld (true);
}

/**
   Initialise le contexte, affiche la carte, la grille et genere la scene.
*/
function createBasicRender () {
    scene = new THREE.Scene();    

    labels = new THREE.Scene ();
    
    scene.add( new THREE.AmbientLight( 0x101010 ) );
    
    var light = new THREE.SpotLight( 0xffffff, 1.5 );
    light.position.set( 0, 1000, 200 );
    light.castShadow = true;    
    light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 70, 1, 200, 2000 ) );
    light.shadow.bias = - 0.00022;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;

    scene.add (light);
    
    target = new THREE.Vector3 (0, 0, 0);
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    
    camera.position.z = 1000;
    camera.position.y = -500;
    camera.lookAt (target);

    var planeGeometry = new THREE.PlaneGeometry( 2000, 2000 );
    planeGeometry.rotateX( - Math.PI / 2 );
    var planeMaterial = new THREE.ShadowMaterial();
    planeMaterial.opacity = 0.1;
    
    var plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.position.y = -500;
    plane.receiveShadow = true;
    scene.add( plane );

    var img = window.parent.document.getElementById ('img');
    var texture1 = new THREE.Texture (img);
    texture1.needsUpdate = true;    
    
    var mapMaterial = new THREE.MeshBasicMaterial ({ map: texture1,  blending: THREE.NormalBlending });
    mapMaterial.transparent = true;
    mapMaterial.opacity = 0.9;

    
    map = new THREE.Mesh( planeGeometry, mapMaterial );
    map.position.y = 0;
    scene.add (map);
    
    var helper = new THREE.GridHelper( 1000, 100 );
    helper.position.y = -500;
    helper.material.opacity = 0.6;
    helper.material.transparent = true;
    scene.add( helper );

    
    renderer = new THREE.WebGLRenderer({antialias : true });    
    renderer.setClearColor( 0xf0f0f0 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.domElement.onmousemove = cameraUpdate;
    renderer.domElement.addEventListener ("mousemove", pick, false);

    labelRenderer = new THREE.CSS2DRenderer ();
    labelRenderer.setSize (window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';    
    
    document.body.appendChild( renderer.domElement );
    document.body.appendChild (labelRenderer.domElement);
    stats = new Stats();
    document.body.appendChild( stats.dom );
    
    var pos = camera.position;
    var radius = Math.abs (pos.distanceTo(target));    
    
    var gui = new dat.GUI ();
    var radiusController = {
	Distance: Math.ceil (radius),
	Transparence: 0.9
    };

    var distChange = function () {
	var radius = radiusController.Distance;
	var pos = camera.position;
	pos.x = target.x + radius * Math.sin (teta * Math.PI / 180.0) * Math.sin (phi * Math.PI / 180.0);
	pos.y = target.y + radius * Math.cos (teta * Math.PI / 180.0);
	pos.z = target.z + radius * Math.sin (teta * Math.PI / 180.0) * Math.cos (phi * Math.PI / 180.0);
	
	camera.position = pos;
	camera.lookAt (target);	
    }

    var transparence = (function () {
	mapMaterial.opacity = radiusController.Transparence;
    });

    gui.add (radiusController, "Distance", Math.ceil (radius), Math.ceil (2.0 * radius), Math.ceil (radius / 100.0)).onChange (distChange);
    gui.add (radiusController, "Transparence", 0.0, 1.0, 0.01).onChange (transparence);
    
}


function createPickingDatas () {
    raycaster = new THREE.Raycaster ();
}


var highlits = [];

function addToolTip () {
    
}

function pick (event) {
    var x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    var y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    var mouse = new THREE.Vector2 (x, y);
    raycaster.setFromCamera (mouse, camera);
    
    var intersects = raycaster.intersectObjects (meshPerYear [currentYear]);
    if (intersects.length > 0) {

        if ( highlits ) {
	    for (var i = 0; i < highlits.length; i++) {
		scene.remove (highlits [i]);
	    }
	    highlits = [];
	}            
	var sphere = meshPerYear [currentYear] [3 * intersects[0].object.idObj];
	var box = meshPerYear [currentYear] [3 * intersects[0].object.idObj + 2];
	
	for (var i = 0; i < 3; i++) {
	    var obj = meshPerYear [currentYear] [3 * intersects[0].object.idObj + i];
	    var mat2 = new THREE.MeshBasicMaterial ({color : 0x00ff00, side : THREE.BackSide });
	    var clone = new THREE.Mesh (obj.geometry, mat2);
	    clone.position.set (obj.position.x, obj.position.y, obj.position.z);
	    clone.scale.set (1.5, 1., 1.5);
	    highlits.push (clone);
	    scene.add (clone);
	}

	var text = document.createElement ('div');
	text.className = 'label';
	text.style.color = 'rgb(10,10,0)';
	text.style.backgroundColor = '#ffffff';
	text.style.border = '2px solid black';
	text.textContent = box.name;

	var label = new THREE.CSS2DObject (text);
	label.position.copy (box.position);	
	highlits.push (label);
	scene.add (label);

	var text2 = document.createElement ('div');
	text2.className = 'label';
	text2.style.color = 'rgb(10,10,0)';
	text2.style.backgroundColor = '#ffffff';
	text2.style.border = '2px solid black';
	text2.textContent = sphere.name;
	
	var label2 = new THREE.CSS2DObject (text2);
	label2.position.copy (sphere.position);	
	highlits.push (label2);
	scene.add (label2);
		    
	addToolTip (intersects [0].object.idObj);        
    } 
    else {
	if (highlits) {
	    for (var i = 0; i < highlits.length; i++) {
		scene.remove (highlits [i]);
	    }
        }

        highlits = [];
    }
}

function onPick (event) {
    var x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    var y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    var mouse = new THREE.Vector2 (x, y);
    raycaster.setFromCamera (mouse, camera);
    
    var intersects = raycaster.intersectObjects (meshPerYear [currentYear]);
    if (intersects.length > 0) {
	console.log ("print graph");
    }
}


/**
   Rendu de la scene
*/
function animate() {
    requestAnimationFrame( animate );       
    labelRenderer.render ( scene, camera );
    renderer.render( scene, camera );
    stats.update();    
}
