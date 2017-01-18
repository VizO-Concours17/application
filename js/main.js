
var scene, camera, renderer;
var ancx = -1, ancy = -1, start;
var phi = 0, teta = 60, target;
var precise = .3;


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
    computeViewMatrix ();
    var datas = fillPoints ();           
    createDatas (datas);


    for (var i = 0; i < meshPerYear [0].length; i++) {
	scene.add (meshPerYear [0][i]);
    }
    currentYear = 0;

   
    var range = window.parent.document.getElementById ('range');
    range.max = meshPerYear.length - 1;
    range.value = 0;
    range.onchange = rangeChanged;
}


function rangeChanged () {
    var range = window.parent.document.getElementById ('range');
    var y1 = currentYear;
    currentYear = range.value;
    changeYear (y1, currentYear);
}


/**
   Fonction qui va appeler les informations de la base pour connaître les différents points.
 */
function fillPoints () {
    var points = [];
    for (var i = 0; i < 50; i++) {
	points.push ([])
	for (var year = 0; year  < 4; year++) {	    
	    points [i].push ({x : (Math.random () * 1000) - 500,
			      y : Math.random () * 1000 - 500,
			      z : (Math.random () * 100 + 200),
			      lineColor : (Math.random()*0xFFFFFF<<0),
			      lineWidth : (Math.random () * 10) + 5,
			      sphereColor : (Math.random()*0xFFFFFF<<0),
			      sphereRadius : (Math.random () * 10) + 15});
	    
	}
    }
    return points;
}

function createDatas (datas) {
    meshPerYear = [];
    if (datas.length > 0) {
	for (var year = 0; year < datas [0].length; year++) {
	    var total = [];
	    for (var i = 0; i < datas.length; i++) {
		var ret = createBoxe (datas [i][year], year);
		for (var m = 0; m < ret.length; m++)
		    total.push (ret [m]);
	    }
	    console.log (total);
	    meshPerYear.push (total);
	}
    }
}

function changeYear (y1, y2) {
    for (var i = 0; i < meshPerYear [y1].length; i++)
	scene.remove (meshPerYear [y1][i]);
    for (var i = 0; i < meshPerYear [y2].length; i++)
	scene.add (meshPerYear [y2][i]);
}

function createBoxe (data, year) {
    var box = new THREE.BoxGeometry (data['lineWidth'] * 4, 5, data['lineWidth'] * 4);
    var cyl = new THREE.CylinderGeometry (data['lineWidth'], data['lineWidth'], data['z'], 10, 10, false, 0, 6.3);
    var sphere = new THREE.SphereGeometry (data['sphereRadius'], 10, 10);
    var cyl_mat = new THREE.MeshLambertMaterial ({color : data['lineColor']});    
    var sph_mat = new THREE.MeshLambertMaterial ({color : data['sphereColor']});
    var cyl_mesh = new THREE.Mesh (cyl, cyl_mat);
    cyl_mesh.position.x = data ['x'];
    cyl_mesh.position.y = -data ['z'] / 2 + 500;
    cyl_mesh.position.z = data ['y'];
    cyl_mesh.castShadow = true;
    
    var box_mesh = new THREE.Mesh (box, cyl_mat);
    box_mesh.position.x = data['x'];
    box_mesh.position.z = data['y'];
    box_mesh.position.y = 500;
    box_mesh.castShadow = true;
    
    var sph_mesh = new THREE.Mesh (sphere, sph_mat);
    sph_mesh.position.x = data['x'];
    sph_mesh.position.y = -data['z'] + 500;
    sph_mesh.position.z = data['y'];
    sph_mesh.castShadow = true;
    
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
}

function createBasicRender () {
    scene = new THREE.Scene();    
    
    scene.add( new THREE.AmbientLight( 0x101010 ) );
    
    var light = new THREE.SpotLight( 0xffffff, 1.5 );
    light.position.set( 0, 1500, 200 );
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
    plane.position.y = 100;
    plane.receiveShadow = true;
    scene.add( plane );

    var img = window.parent.document.getElementById ('img');
    var texture1 = new THREE.Texture (img);
    texture1.needsUpdate = true;    
    
    var mapMaterial = new THREE.MeshBasicMaterial ({ map: texture1,  blending: THREE.NormalBlending });
    mapMaterial.transparent = true;
    mapMaterial.opacity = 0.9;

    
    map = new THREE.Mesh( planeGeometry, mapMaterial );
    map.position.y = 500;
    scene.add (map);
    
    var helper = new THREE.GridHelper( 1000, 100 );
    helper.position.y = 100;
    helper.material.opacity = 0.6;
    helper.material.transparent = true;
    scene.add( helper );
    
    renderer = new THREE.WebGLRenderer({antialias : true });    
    renderer.setClearColor( 0xf0f0f0 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    renderer.domElement.onmousemove = cameraUpdate;
    renderer.domElement.onclick = createRay;

    
    document.body.appendChild( renderer.domElement );
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


function createRay (event) {
    var x = event.clientX, y = event.clientY;
    x = (2.0 * x) / window.innerWidth - 1.0;
    y = 1.0 - (2.0 * y) / window.innerHeight;
    var z = 1.0;

    // normalized device coordinates
    var ray_nds = new THREE.Vector3 (x, y, z);

    // homogenous clip coordinates
    var ray_clip = new THREE.Vector4 (ray_nds.x, ray_nds.y, -1., 1.);
    
    //4D eye coordinates
    var m = new THREE.Matrix4 ();
    var ray_eye = ray_clip.applyMatrix4 (m.getInverse (camera.projectionMatrix));

    // World transformation
    var aux = ray_eye.applyMatrix4(camera.matrixWorldInverse);
    var ray_wor = new THREE.Vector3(aux.x, aux.y, aux.z);
    ray_wor = ray_wor.normalize (ray_wor);

}

function intersect (cube, ray) {
}



/**
   Rendu de la scene
 */
function animate() {

    requestAnimationFrame( animate );
    
    //mesh[1].position.x = 250;
    
    renderer.render( scene, camera );    
    stats.update();    
}


