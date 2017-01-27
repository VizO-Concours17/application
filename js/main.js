
var scene, camera, renderer, labelRenderer;
var ancx = -1, ancy = -1, start;
var phi = 0, teta = 60, target;
var precise = .3;
var raycaster, labels;


var meshPerYear, currentYear;
var years;
var aspect;

var orScene, orCube, orCamera;

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
    createOrientationRender ();
    
    computeViewMatrix ();

    
    function arrangeDatas (datas) {
	createDatas (datas);	
	currentYear = meshPerYear.length - 1;
	
	for (var i = 0; i < meshPerYear [currentYear].length; i++) {
	    scene.add (meshPerYear [currentYear][i]);
	}

	var rangeDiv = window.parent.document.getElementById ('rangeDiv');	
	if (rangeDiv != null) {
	    while (rangeDiv.children.length > 0)
		rangeDiv.removeChild (rangeDiv.children [0]);
	    var tabs = [];
	    for (var i in years) tabs.push (i);
	    
	    
	    var range = window.parent.document.createElement ('input');
	    range.className = 'slider';
	    range.setAttribute ('data-slider-orientation', 'horizontal');
	    range.setAttribute ('data-slider-ticks', '[' + tabs.toString () + ']');
	    range.setAttribute ('data-slider-ticks-labels', '[' + years.toString () + ']');
	    range.setAttribute ('data-slider-tooltip', 'hide');
	    range.setAttribute ('type', 'text');
	    range.setAttribute ('id', 'range');
	    var label = window.parent.document.createElement ('label');
	    label.id = 'rangeText';
	    
	    rangeDiv.appendChild (label);
	    rangeDiv.appendChild (range);
	    
	    range.setAttribute ('value', '0');	    
	    range.onchange = rangeChanged;
	}
	window.parent.reloadStyle ();
	$('#rangeText', window.parent.document).text ("Ann\351e des donn\351es");
    };

    fillPoints (arrangeDatas);
    
    var buttonValide = window.parent.document.getElementById ('form-ok');
    if (buttonValide != null) {
	buttonValide.addEventListener ('click', function () {
	    formOk (arrangeDatas);
	});
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


function formOk (callback) {
    // On supprime les donnees de la scene
    if (meshPerYear.length > 0) {
	for (var i = 0; i < meshPerYear [currentYear].length; i++)
	    scene.remove (meshPerYear [currentYear][i]);
	
	meshPerYear = [];
    }
    
    var location = window.location.href;
    location = location.substr (0, location.lastIndexOf ('/'));
    console.log (location);
    var coords = window.parent.document.getElementById ('3d-coords').innerHTML.replace (/&amp;/g, '&');
    var masse = "";
    var list = window.parent.document.getElementById ('masseList');
    for (var ch = 0 ; ch <  list.children.length; ch++) {
	var div = list.children [ch].children [0].children [0];
	if (div && (div.getAttribute ('aria-checked') == 'true' || div.className.indexOf ('checked') != -1)) {
	    masse += "&masse[]=" + list.children [ch].children [0].getAttribute ('name');	    
	}
    }
    
    $.ajax ({
	url: location + "/php/criteres.php?" + coords + masse 
    }).done (function (data) {
	data = $.parseJSON (data);
	callback (data);
    });    
    
}

/**
   Fonction qui va appeler les informations de la base pour connaitre les differents points.
   TODO, pour le moment on fait au hasard
   Cette fonction devra aussi r�cuperer les informations de masse d'eau, params...
*/
function fillPoints (callback) {
    var location = window.location.href;
    location = location.substr (0, location.lastIndexOf ('/'));
    var coords = window.parent.document.getElementById ('3d-coords').innerHTML.replace (/&amp;/g, '&');
    console.log (coords);
    $.ajax ({
	url: location + "/php/criteres.php?" + coords 
    }).done (function (data) {
	data = $.parseJSON (data);
	callback (data);
    });    
}

/**
   On cree les meshs associes aux points.
*/
function createDatas (datas) {
    meshPerYear = [];
    years = [];
    for (var key in datas) {
	years.push ('"' + key + '"');
	var total = [];
	var i = 0;
	for (var elem in datas [key]) {
	    var ret = createBoxe (datas [key] [elem]);
	    for (var m = 0; m < ret.length; m++) {
		total.push (ret [m]);
		ret [m].idObj = i;
	    }
	    i++;
	}
	meshPerYear.push (total);
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
	    if (teta < 0) teta = 0;
	    if (teta > 180) teta = 180;
	}
	
	computeViewMatrix ();
	computeViewMatrix (orCamera);
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
function computeViewMatrix (cam) {
    if (!cam) cam = camera;
    var pos = cam.position;
    var radius = Math.abs (pos.distanceTo(target));
    pos.x = target.x + radius * Math.sin (teta * Math.PI / 180.0) * Math.sin (phi * Math.PI / 180.0);
    pos.y = target.y + radius * Math.cos (teta * Math.PI / 180.0);
    pos.z = target.z + radius * Math.sin (teta * Math.PI / 180.0) * Math.cos (phi * Math.PI / 180.0);
    
    cam.position.copy (pos);
    cam.lookAt (target);
    cam.updateProjectionMatrix ();
    cam.updateMatrixWorld ();
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
    aspect = window.innerWidth / window.innerHeight;
    // camera = new THREE.OrthographicCamera (1000 *aspect / -2, 1000 *aspect/ 2,
    // 					   1000 * aspect/ 2, 1000 *aspect/ -2,
    // 					   -5000, 10000);

    camera.position.z = 1500;
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

    var img = window.parent.document.getElementById ('3d-texture');
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
    renderer.domElement.addEventListener ("mousemove", pickCube, false);
    renderer.domElement.addEventListener ("click", pickCubeClick, false);
    renderer.autoClear = false;
    
    labelRenderer = new THREE.CSS2DRenderer ();
    labelRenderer.setSize (window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';    
    labelRenderer.autoClear = false;

    
    document.body.appendChild( renderer.domElement );
    document.body.appendChild (labelRenderer.domElement);
    stats = new Stats();

    
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
	
	camera.position.copy (pos);
	camera.lookAt (target);
	if (camera.isOrthographicCamera) {
	    camera.zoom = 1000 / radius;
	    camera.updateProjectionMatrix ();
	} else camera.saveZoom = 1000 / radius;
	camera.updateMatrixWorld ();
    }

    var transparence = (function () {
	mapMaterial.opacity = radiusController.Transparence;
    });

    gui.add (radiusController, "Distance", Math.ceil (10), Math.ceil (2.0 * radius), Math.ceil (radius / 100.0)).onChange (distChange);
    gui.add (radiusController, "Transparence", 0.0, 1.0, 0.01).onChange (transparence);

    var mode = {};
    mode.Perspective = true;
    gui.add (mode, 'Perspective').onChange (function () {
	console.log (camera.isOrthographicCamera);
	if (camera.isOrthographicCamera) {
	    var position = camera.position;
	    var saveZoom = camera.zoom;
	    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
	    camera.position.copy (position);
	    camera.saveZoom = saveZoom;
	    camera.zoom = 1;
	    camera.lookAt (target);
	    computeViewMatrix (camera);
	} else {
	    var position = camera.position;
	    var savedZoom = camera.saveZoom;
	    camera = new THREE.OrthographicCamera (1000 *aspect / -2, 1000 *aspect/ 2,
						   1000 / 2, 1000/ -2,
						   -5000, 10000);
	    camera.position.copy (position);
	    camera.lookAt (target);
	    if (savedZoom)
		camera.zoom = savedZoom;
	    computeViewMatrix (camera);
	    camera.updateProjectionMatrix ();
	}
    });
    
}


function createOrientationRender () {
    orScene = new THREE.Scene ();
    orCamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    orCamera.position.z = 1500;
    orCamera.position.y = -500;
    orCamera.lookAt (new THREE.Vector3 (0, 0, 0));
    computeViewMatrix (orCamera);

    var haut = [new THREE.Vector2 (217 / 800, 209 / 600), new THREE.Vector2 (397 / 800, 209 / 600),
		new THREE.Vector2 (397 / 800, 391/600),  new THREE.Vector2 (217 / 800, 391 / 600)];
    
    var bas = [new THREE.Vector2 (758 / 800, 391/600), new THREE.Vector2 (579 / 800, 391 / 600),
	       new THREE.Vector2 (579 / 800, 209 / 600), new THREE.Vector2 (758 / 800, 209 / 600)];
    
    var est = [new THREE.Vector2 (397 / 800, 392 / 600), new THREE.Vector2 (397 / 800, 570/600),
	       new THREE.Vector2 (217 / 800, 570 / 600), new THREE.Vector2 (217 / 800, 391 / 600)];
    
    var ouest = [ new THREE.Vector2 (217 / 800, 209 / 600), new THREE.Vector2 (217 / 800, 27 / 600),
		 new THREE.Vector2 (397 / 800, 28 / 600), new THREE.Vector2 (397 / 800, 209 / 600)];
    
    var sud = [new THREE.Vector2 (397 / 800, 209 / 600), new THREE.Vector2 (579 / 800, 209 / 600),
	       new THREE.Vector2 (579 / 800, 391 / 600), new THREE.Vector2 (397 / 800, 391 / 600)];
    
    var nord = [new THREE.Vector2 (217 / 800, 391 / 600), new THREE.Vector2 (37 / 800, 391 / 600),
		new THREE.Vector2 (37 / 800, 209 / 600), new THREE.Vector2 (217 / 800, 209 / 600)];
    
    var geometry = new THREE.CubeGeometry (1000, 1000, 1000, 1, 1, 1);
    geometry.faceVertexUvs[0] = [];
    geometry.faceVertexUvs[0][0] = [ est[0], est[1], est[3] ];
    geometry.faceVertexUvs[0][1] = [ est[1], est[2], est[3] ];
    
    geometry.faceVertexUvs[0][2] = [ ouest[0], ouest[1], ouest[3] ];
    geometry.faceVertexUvs[0][3] = [ ouest [1], ouest[2], ouest[3] ];
    
    geometry.faceVertexUvs[0][4] = [ haut[0], haut[1], haut[3] ];
    geometry.faceVertexUvs[0][5] = [ haut[1], haut[2], haut[3] ];
    
    geometry.faceVertexUvs[0][6] = [ bas[0], bas[1], bas[3] ];
    geometry.faceVertexUvs[0][7] = [ bas[1], bas[2], bas[3] ];
    
    geometry.faceVertexUvs[0][8] = [ sud[0], sud[1], sud[3] ];
    geometry.faceVertexUvs[0][9] = [ sud[1], sud[2], sud[3] ];
    
    geometry.faceVertexUvs[0][10] = [ nord[0], nord[1], nord[3] ];
    geometry.faceVertexUvs[0][11] = [ nord[1], nord[2], nord[3] ];
    
    var loader = new THREE.TextureLoader ();
    loader.load ('texture/cube/orientation.jpg',
		 function (texture) {
		     var mat = new THREE.MeshBasicMaterial( { map: texture} );
		     orCube = new THREE.Mesh (geometry, mat);
		     orScene.add (orCube);    
		 });
        
    orScene.add( new THREE.AmbientLight( 0x101010 ) );
}

function createPickingDatas () {
    raycaster = new THREE.Raycaster ();
}


var highlits = [], cubeHighlits = [];

function addToolTip () {
    
}

function pickCube (event) {
    var x = (event.clientX / (window.innerWidth)) * 10 - 1;
    var y = - (event.clientY / (window.innerHeight)) * 10 + 1;
    var mouse = new THREE.Vector2 (x, y);
    raycaster.setFromCamera (mouse, orCamera);
    var intersects = raycaster.intersectObjects ([orCube]);
    if (intersects.length > 0) {
	if (cubeHighlits){
	    for (var i = 0; i < cubeHighlits.length; i++) {
		orScene.remove (cubeHighlits [i]);
	    }
	    cubeHighlits = [];
	}
	
	var plane = new THREE.PlaneGeometry (1100, 1100);
	var mat = new THREE.MeshBasicMaterial ({color : 0x00ff00, side : THREE.DoubleSide });
		
	var face = intersects [0].faceIndex;
	var position = new THREE.Vector3 (0,0,0);
	if (face == 0 || face == 1) {
	    plane.rotateY (- Math.PI / 2);
	    position.x = 498;
	} else if (face == 2 || face == 3) {
	    plane.rotateY (Math.PI / 2);//moveOuest ();
	    position.x = -498;
	} else if (face == 4 || face == 5) {
	    plane.rotateX (Math.PI / 2);// moveBas ();
	    position.y = 498;
	} else if (face == 6 || face == 7) {
 	    plane.rotateX (Math.PI / 2);// moveBas ();
	    plane.rotateZ (-Math.PI);// moveBas ();
	    position.y = -498;
	} else if (face == 8 || face == 9) {
 	    plane.rotateZ (-Math.PI / 2);
	    plane.rotateX (Math.PI);// moveSud ();
	    position.z = 498;
	} else if (face == 10 || face == 11) {
 	    plane.rotateZ (Math.PI / 2);// moveNord ();
	    position.z = -498;
	}
	var mesh = new THREE.Mesh (plane, mat);
	mesh.position.copy (position);
	orScene.add (mesh);
	cubeHighlits.push (mesh);
    } else {
	console.log (cubeHighlits);
	if (cubeHighlits){
	    for (var i = 0; i < cubeHighlits.length; i++) {
		orScene.remove (cubeHighlits [i]);
	    }
	    cubeHighlits = [];
	}
    }
}

function pickCubeClick (event) {
    var x = (event.clientX / (window.innerWidth)) * 10 - 1;
    var y = - (event.clientY / (window.innerHeight)) * 10 + 1;
    var mouse = new THREE.Vector2 (x, y);
    raycaster.setFromCamera (mouse, orCamera);
    var intersects = raycaster.intersectObjects ([orCube]);
    if (intersects.length > 0) {
	var face = intersects [0].faceIndex;
	if (face == 0 || face == 1) moveEst ();
	else if (face == 2 || face == 3) moveOuest ();
	else if (face == 4 || face == 5) moveHaut ();
	else if (face == 6 || face == 7) moveBas ();
	else if (face == 8 || face == 9) moveSud ();
	else if (face == 10 || face == 11) moveNord ();	
    }    
}

function moveEst () {
    phi = 90; teta = 90;
    computeViewMatrix (camera);
    computeViewMatrix (orCamera);
}

function moveOuest () {
    phi = -90; teta = 90;
    computeViewMatrix (camera);
    computeViewMatrix (orCamera);
}

function moveSud () {
    phi = 0; teta = 90;
    computeViewMatrix (camera);
    computeViewMatrix (orCamera);
}

function moveNord () {
    phi = 180; teta = 90;
    computeViewMatrix (camera);
    computeViewMatrix (orCamera);    
}

function moveHaut () {
    phi = 0; teta = 0;
    computeViewMatrix (camera);
    computeViewMatrix (orCamera);    
}

function moveBas () {
    phi = 0; teta = 180;
    computeViewMatrix (camera);
    computeViewMatrix (orCamera);    
}


function pick (event) {
    var x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    var y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    var mouse = new THREE.Vector2 (x, y);
    raycaster.setFromCamera (mouse, camera);
    if (meshPerYear && meshPerYear.length > currentYear) {
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
	    label2.position.y -= 55;
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

    renderer.clear ();
    
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setViewport (0, 0, w, h);   
    renderer.render( scene, camera );
    renderer.clearDepth ();
    
    renderer.setViewport (0, h - 10 - h / 5, w / 5, h / 5);   
    renderer.render (orScene, orCamera);

    
}
