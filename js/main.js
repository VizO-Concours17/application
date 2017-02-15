
// Objet de Three.js permettant l'affichage
var scene, camera, renderer, labelRenderer;

// Donnees pour gerer le mouvement de la camera
var ancx = -1, ancy = -1, start;
var phi = 0, teta = 60, target;
var precise = .3;

// element permettant le picking.
var raycaster, labels; // le tableau qui contient les objets de type label que l'on affiche par dessus la vue 3D.


// Tableau contenant les objets geometriques.
var meshPerYear, currentYear; // index courant dans le tableau des objets.

var years; // les annees dont on affiche les donnees.
var aspect; // l'aspect de l'ecran (3/4, 16/9, ...)

var orScene, orCube, orCamera;

/*var points;
var donnee;*/

init ();
animate ();


/**
   Fonction qui initialise le contexte
*/
function init() {

    // Creation du contexte Three.js, (camera, scene, ...)
    createBasicRender ();

    // Creation du raycaster qui va permettre le picking
    createPickingDatas ();

    // Creation du context Three.js qui va gerer le cube d'orientation
    createOrientationRender ();
    
    // Calcule des matrices de la camera
    computeViewMatrix ();

    // Fonction callback appele apres chaque changement des donnees dans la zone 3D.
    function arrangeDatas (datas) {
	createDatas (datas);	
	currentYear = years[years.length - 1];
	
	for (var i = 0; i < meshPerYear [currentYear].length; i++) {
	    scene.add (meshPerYear [currentYear][i]);
	}

	var rangeDiv = window.parent.document.getElementById ('rangeDiv');	
	if (rangeDiv != null) {
	    while (rangeDiv.children.length > 0)
		rangeDiv.removeChild (rangeDiv.children [0]);
	    var tabs = [];
	    for (var i in years) tabs.push (i);
	    
	    // creation du slider des annees
	    var range = window.parent.document.createElement ('input');
	    range.className = 'slider';
	    range.setAttribute ('data-slider-orientation', 'horizontal');
	    range.setAttribute ('data-slider-ticks', '[' + tabs.toString () + ']'); // valeur de chaque label
	    range.setAttribute ('data-slider-ticks-labels', '[' + years.toString () + ']'); // label en dessous du slider
	    range.setAttribute ('data-slider-tooltip', 'hide');
	    range.setAttribute ('type', 'text');
	    range.setAttribute ('data-slider-selection', 'none');
	    range.setAttribute ('id', 'range');
	    range.setAttribute ('data-slider-value', years.length - 1); //valeur par defaut
	    var label = window.parent.document.createElement ('label');
	    label.id = 'rangeText';
	    
	    rangeDiv.appendChild (label);
	    rangeDiv.appendChild (range);
	    
	    range.onchange = rangeChanged;
	}

	// Affichage de la legende du block 3D.
	var legende = window.parent.document.getElementById ('legende');
	console.log (legende);
	legende.style.display = 'block';
	window.parent.reloadStyle ();	
	$('#rangeText', window.parent.document).text ("Ann\351e des donn\351es");
	
    };
    
    // Appel à la requete ajax qui va remplir les tableaux de données.
    fillPoints (arrangeDatas); // arrangeDatas est le callBack
    
    var buttonValide = window.parent.document.getElementById ('form-ok');
    if (buttonValide != null) {
	buttonValide.addEventListener ('click', function () {
	    // quand on clique sur le bouton de validation de formulaire, on relance l'appel au donnees.
	    formOk (arrangeDatas);
	});
    }
}


/**
   On a changer l'année en cours, on modifie les mesh a afficher
*/
function rangeChanged () {
    var range = window.parent.document.getElementById ('range');
    var y1 = currentYear;
    currentYear = years[range.value]; // nouvelle annee
    changeYear (y1, currentYear);
}


/**
   Fonction appele lors d'un clique sur le bouton de validation de selection de parametre.
 */
function formOk (callback) {
    // On supprime les donnees de la scene
    for (var i = 0; i < meshPerYear [currentYear].length; i++)
	scene.remove (meshPerYear [currentYear][i]);
	
    meshPerYear = [];    
    
    // emplacement du serveur qui heberge la page
    var location = window.location.href;
    location = location.substr (0, location.lastIndexOf ('/'));

    // recuperation des coordonnees de l'emprise
    var coords = window.parent.document.getElementById ('3d-coords').innerHTML.replace (/&amp;/g, '&');
    var masse = "";

    // remplissage des parametres de masse d'eau
    var list = window.parent.document.getElementById ('masseList');
    for (var ch = 0 ; ch <  list.children.length; ch++) {
	var div = list.children [ch].children [0].children [0];
	if (div && (div.getAttribute ('aria-checked') == 'true' || div.className.indexOf ('checked') != -1)) {
	    masse += "&masse[]=" + list.children [ch].children [0].getAttribute ('name');	    
	}
    }

    // Remplissage du parametre de selection de pesticide.
    var plist = window.parent.document.getElementById ('pestList');
    
    // Appel ajax au serveur php.
    $.ajax ({
	url: location + "/php/criteres.php?" + coords + masse + "&pest=" + parseInt (plist.value)
    }).done (function (data) {
	data = $.parseJSON (data);
	callback (data); // on appele le callback (arrangeData).
    });    

    //Affichage des labels de chargement des graphiques.
    var info = window.parent.document.getElementById ('info_molecule');
    info.innerHTML = 'Cliquez sur un puits pour afficher ses informations';
    var puit = window.parent.document.getElementById ('infoPuitList');
    while (puit.children.length > 0) puit.removeChild (puit.children [0]);	
    $('#info_molecule', window.parent.document).css('display', 'block');
    $('#chart_molecule', window.parent.document).css('display', 'none');
    
    // Si on a selectionner max, ou moy on charge les informations de maximum quantifie dans la zone
    if (plist.value == -1 || plist.value == -2) {
	$("#info_pestMore", window.parent.document).css ('display', 'block');
	var info = window.parent.document.getElementById ('info_pestMore');
	info.innerHTML = "Chargement des informations des mol\351cules les plus quantifi\351es";
	
	$.ajax ({
	    url: location + "/php/mores.php?" + coords + masse
	}).done (function (data) {
	    data = $.parseJSON (data);
	    $("#info_pestMore", window.parent.document).css ('display', 'none');
	    generateGraph (data['more']); // generation du graph de maximum quantifie
	});
    } else {
	// sinon on recherche les informations de la molecule.
	$("#info_pestMore", window.parent.document).css ('display', 'block');
	var info = window.parent.document.getElementById ('info_pestMore');
	info.innerHTML = "Chargement des informations de la mol\351cule";
	$.ajax ({
	    url: location + "/php/pest.php?pest=" + plist.value
	}).done (function (data) {
	    console.log (location + "/php/pest.php?pest=" + plist.value);
	    console.log (data);
	    data = $.parseJSON (data);
	    $("#info_pestMore", window.parent.document).css ('display', 'none');
	    generatePest (data);
	});
    }
    
}

/**
   Fonction d'appel au serveur pour connaitre les differents puits present dans la zone.
*/
function fillPoints (callback) {
    var location = window.location.href;
    location = location.substr (0, location.lastIndexOf ('/'));

    // recuperation des coordonnees de la zone d'emprise.
    var coords = window.parent.document.getElementById ('3d-coords').innerHTML.replace (/&amp;/g, '&');
    
    // Affichage des label de chargements des encarts.
    var info = window.parent.document.getElementById ('info_molecule');
    info.innerHTML = 'Cliquez sur un puits pour afficher ses informations';
    var puit = window.parent.document.getElementById ('infoPuitList');
    while (puit.children.length > 0) puit.removeChild (puit.children [0]);	
    $('#info_molecule', window.parent.document).css('display', 'block');
    $('#chart_molecule', window.parent.document).css('display', 'none');

    // Appel ajax pour recuperer les differents puits.
    $.ajax ({
	url: location + "/php/criteres.php?" + coords + "&pest=-2"
    }).done (function (data) {
	data = $.parseJSON (data);
	callback (data); 
    });


    // Par defaut, on affiche la concentration moyenne du coup, on recupere les max quantifie
    $("#info_pestMore", window.parent.document).css ('display', 'block');
    var info = window.parent.document.getElementById ('info_pestMore');
    info.innerHTML = "Chargement des informations des mol\351cules les plus quantifi\351es";

    $.ajax ({
	url: location + "/php/mores.php?" + coords
    }).done (function (data) {
	data = $.parseJSON (data);
	$("#info_pestMore", window.parent.document).css ('display', 'none');
	generateGraph (data['more']);
    });
    
}

/**
   On cree les meshs associes aux points.
*/
function createDatas (datas) {
    meshPerYear = [];
    years = [];
    for (var key in datas) {
	if (key == "more" || key == "pestInfo") continue;
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
	
	meshPerYear['"' + key + '"'] = total;
    }    

    years.sort ();
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
   On cree les mesh associe a un point, box, cylindre, sphere.
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
    cyl_mesh.idPuit = data['idPuit'];
    
    var box_mesh = new THREE.Mesh (box, cyl_mat);
    box_mesh.position.x = data['x'];
    box_mesh.position.z = data['y'];
    box_mesh.position.y = data ['z'];
    box_mesh.castShadow = true;
    box_mesh.name = data['labelTop'];
    box_mesh.idPuit = data['idPuit'];
        
    var sph_mesh = new THREE.Mesh (sphere, sph_mat);
    sph_mesh.position.x = data['x'];
    sph_mesh.position.y = data['z'] - data['depth'];
    sph_mesh.position.z = data['y'];
    sph_mesh.castShadow = true;
    sph_mesh.name = data['labelBot'];
    sph_mesh.idPuit = data['idPuit'];
    
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
	    phi = (phi + Math.ceil (precise * posx)) % 360;
	    teta = (teta - Math.ceil (precise * posy)) % 360;
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
   Calcule de la matrice de vue de la camera (coordonnÃ©es)
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
   Changement de la taille des elements de Three.js, lorsque l'utilisateur retaille sa fenetre.
 */
function updateRendererSizes () {
    renderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
    aspect = window.innerWidth / window.innerHeight;
    orCamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    orCamera.position.z = 1500;
    orCamera.position.y = -500;
    orCamera.lookAt (new THREE.Vector3 (0, 0, 0));
    computeViewMatrix (orCamera);
    
    if (!camera.isOrthographicCamera) {
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
}


/**
   Initialise le contexte, affiche la carte, la grille et genere la scene.
*/
function createBasicRender () {
    scene = new THREE.Scene();  // scene d'affichage des elements 3D.

    labels = new THREE.Scene (); // Scene d'affichage des labels.
    
    scene.add( new THREE.AmbientLight( 0xA0A0A0 ) ); // ajout d'un eclairage ambiant pour qu'on y voit quelque chose.
    
    target = new THREE.Vector3 (0, 0, 0);

    // par defaut la camera est en espace projectif.
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    aspect = window.innerWidth / window.innerHeight;
    // camera = new THREE.OrthographicCamera (1000 *aspect / -2, 1000 *aspect/ 2,
    // 					   1000 * aspect/ 2, 1000 *aspect/ -2,
    // 					   -5000, 10000);

    // Le monde fait une taille de 1000 * 1000.
    camera.position.z = 1500;
    camera.position.y = -500;
    camera.lookAt (target);

    var light1 = new THREE.PointLight( 0xffffff, 1.5 ); 
    light1.position.set( 0, 1000, 0 );

    scene.add (light1); // Ajout d'un point lumineux pour qu'on voit mieux l'aspect 3D
    
    
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
    scene.add (map); // Ajout du plan qui affiche la carte.
    
    var helper = new THREE.GridHelper( 1000, 100 );
    helper.position.y = -500;
    helper.material.opacity = 0.6;
    helper.material.transparent = true;
    scene.add( helper ); // ajout de la grille en bas de la scene.

    
    renderer = new THREE.WebGLRenderer({antialias : true });    // Creation d'un rendeur, qui va afficher la scene.
    renderer.setClearColor( 0xf0f0f0 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.domElement.onmousemove = cameraUpdate;
    renderer.domElement.addEventListener ("mousemove", pick, false);
    renderer.domElement.addEventListener ("mousemove", pickCube, false);
    renderer.domElement.addEventListener ("click", pickCubeClick, false);
    renderer.domElement.addEventListener ("click", onPick, false);    
    window.addEventListener( 'resize', updateRendererSizes, false );
    
    renderer.autoClear = false; 
    
    labelRenderer = new THREE.CSS2DRenderer (); // creation d'un renderer qui va afficher les labels.
    labelRenderer.setSize (window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';    
    labelRenderer.autoClear = false;

    // on ajoute les renderers a la page.
    document.body.appendChild( renderer.domElement ); 
    document.body.appendChild (labelRenderer.domElement);
    stats = new Stats();

    
    var pos = camera.position;
    var radius = Math.abs (pos.distanceTo(target));    
    
    // Ajout de l'interface permettant la modification des parametres
    var gui = new dat.GUI (); 

    var radiusController = {
	Distance: Math.ceil (radius),
	Transparence: 0.9
    };

    // Quand on change la distance de la camera, on recalcule ses matrices
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

    // Quand on change la transparence.
    var transparence = (function () {
	mapMaterial.opacity = radiusController.Transparence;
	helper.material.opacity = radiusController.Transparence;
    });

    gui.add (radiusController, "Distance", Math.ceil (10), Math.ceil (2.0 * radius), Math.ceil (radius / 100.0)).onChange (distChange);
    gui.add (radiusController, "Transparence", 0.0, 1.0, 0.01).onChange (transparence);

    // Quand on change le mode de rendu (perspective, plat), on recree une nouvelle camera.
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

/**
   Creation du cube d'orientation du monde.
 */
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
    
    // Texturing du cube.
    var loader = new THREE.TextureLoader ();
    loader.load ('texture/cube/orientation.jpg',
		 function (texture) {
		     var mat = new THREE.MeshBasicMaterial( { map: texture} );
		     orCube = new THREE.Mesh (geometry, mat);
		     orScene.add (orCube);    
		 });

    // Ajout d'une lumiere ambiante pour voir le cube.
    orScene.add( new THREE.AmbientLight( 0x101010 ) );
}

/**
   Creation du raycaster qui permet le picking.
 */
function createPickingDatas () {
    raycaster = new THREE.Raycaster ();
}

// Les elements en surbrillance.
var highlits = [], cubeHighlits = [];

function addToolTip () {}

/**
   lorsqu'on passe au dessus du cube, un plan s'affiche sur l'element survole.
 */
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
		
	// Rotation du plan en fonction du cote survole.
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
	cubeHighlits.push (mesh); // Ajout des elements en surbrillance a la scene.
    } else {
	// rien de selectionne, on enleve les elements en surbrillance.
	if (cubeHighlits){
	    for (var i = 0; i < cubeHighlits.length; i++) {
		orScene.remove (cubeHighlits [i]);
	    }
	    cubeHighlits = [];
	}
    }
}

/**
   Lorsqu'on clique sur une des faces du cube, on bouge la camera.
 */
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

/**
   Mouvement de la camera.
*/
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


/**
   lorsqu'on survolle un puits, on affiche les informations.
 */
function pick (event) {
    var x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    var y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    var mouse = new THREE.Vector2 (x, y);
    raycaster.setFromCamera (mouse, camera);

    var intersects = raycaster.intersectObjects (meshPerYear [currentYear]);
    if (intersects.length > 0) {
	
	// On enleve les ancien elements en surbrillance.
        if ( highlits ) {
	    for (var i = 0; i < highlits.length; i++) {
		scene.remove (highlits [i]);
	    }
	    highlits = [];
	}            

	var sphere = meshPerYear [currentYear] [3 * intersects[0].object.idObj];
	var box = meshPerYear [currentYear] [3 * intersects[0].object.idObj + 2];
	
	// Chaque puits possede 3 mesh [box, cyl, sph].
	for (var i = 0; i < 3; i++) {
	    var obj = meshPerYear [currentYear] [3 * intersects[0].object.idObj + i];
	    var mat2 = new THREE.MeshBasicMaterial ({color : 0x00ff00, side : THREE.BackSide });
	    var clone = new THREE.Mesh (obj.geometry, mat2);
	    clone.position.set (obj.position.x, obj.position.y, obj.position.z);
	    if (i == 0 || i == 2)
		clone.scale.set (1.5, 1.5, 1.5);		
	    else
		clone.scale.set (1.5, 1., 1.5);
	    highlits.push (clone);
	    scene.add (clone);
	}
	
	var text = document.createElement ('div');
	text.className = 'label';
	text.style.color = 'rgb(10,10,0)';
	text.style.backgroundColor = '#ffffff';
	text.style.border = '2px solid black';
	text.style.textAlign = "center";
	text.innerHTML = box.name.replace (/"/gi, '');
	
	var label = new THREE.CSS2DObject (text);
	label.position.copy (box.position);
	highlits.push (label);
	scene.add (label);

	var text2 = document.createElement ('div');
	text2.className = 'label';
	text2.style.color = 'rgb(10,10,0)';
	text2.style.backgroundColor = '#ffffff';
	text2.style.border = '2px solid black';
	text2.innerHTML = sphere.name;
	text2.style.textAlign = "center";
	
	var label2 = new THREE.CSS2DObject (text2);
	label2.position.copy (sphere.position);
	label2.position.y -= 60;
	highlits.push (label2);
	scene.add (label2);
	
	addToolTip (intersects [0].object.idObj);        
    } 
    else {
	// rien de selectionne, on enleve les elements en surbrillance.
	if (highlits) {
	    for (var i = 0; i < highlits.length; i++) {
		scene.remove (highlits [i]);
	    }
        }

        highlits = [];
    }
    
}

/**
   On clique sur un puits, on va chercher les donnees dans le serveur php.
*/
function onPick (event) {
    var x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    var y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    var mouse = new THREE.Vector2 (x, y);
    raycaster.setFromCamera (mouse, camera);
    
    var intersects = raycaster.intersectObjects (meshPerYear [currentYear]);
    if (intersects.length > 0) {
	var i = intersects[0].object.idPuit;
	var location = window.location.href;
	location = location.substr (0, location.lastIndexOf ('/'));
	var plist = window.parent.document.getElementById ('pestList');
	console.log (location + "/php/puits.php?puit=" + i + "&pest=" + plist.value.replace (/"/gi, ''));
	location = location + "/php/puits.php?puit=" + i + "&pest=" + plist.value.replace (/"/gi, '');

	// Affichage du label de chargement.
	var info = window.parent.document.getElementById ('info_molecule');
	info.innerHTML = 'Chargement des informations du puits ' + i;
	var puit = window.parent.document.getElementById ('infoPuitList');
	while (puit.children.length > 0) puit.removeChild (puit.children [0]);	
	$('#info_molecule', window.parent.document).css('display', 'block');
	
	$.ajax ({
	    url : location + "/php/puits.php?puit=" + i + "&pest=" + plist.value 
	}).done (function (datas) {
	    datas = $.parseJSON (datas);
	    generateGraphPuit (datas); // on cree le graphe.
	});		
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

/**
   generation du graphe d'informations d'un puits.
 */
function generateGraphPuit (datas) {
    var puit = window.parent.document.getElementById ('infoPuitList');
    while (puit.children.length > 0) puit.removeChild (puit.children [0]);	

    var li2 = document.createElement('li');
    var span2 = document.createElement ('span');
    span2.className = "pull-right badge bg-blue";
    li2.innerHTML = 'Nom';
    if (datas['cd_station'][0] == '"')
	span2.innerHTML = datas['cd_station'].substr (1, datas['cd_station'].length - 2);
    else
	span2.innerHTML = datas['cd_station'];
    li2.appendChild (span2);
    puit.appendChild (li2);
    
    var li3 = document.createElement('li');
    var span3 = document.createElement ('span');
    span3.className = "pull-right badge bg-blue";
    li3.innerHTML = 'Masse d\'eau';
    span3.innerHTML = datas['masse_eau'].replace (/"/gi, '').replace ("é", "\351");	
    li3.appendChild (span3);
    puit.appendChild (li3);

    
    $('#chart_molecule', window.parent.document).css('display', 'block');
    $('#info_molecule', window.parent.document).css('display', 'none');
    google.charts.load ('current', {packages :  ['corechart', 'line', 'bar'] });
    google.charts.setOnLoadCallback(function () {
	var data = new google.visualization.DataTable ();
	data.addColumn ('string', 'X');
	if (datas['criteresLabel'][0] == '"') 
	    data.addColumn ('number', datas['criteresLabel'].substr (1, datas['criteresLabel'].length - 2));
	else data.addColumn ('number', datas['criteresLabel']);
	var nots = [];

	for (var i in datas['meta']) {
	    if (datas['meta'][i]['nb'] == datas['nb_year']) { // on ajoute les metabolites, qui ont ete recherche par le meme puits en colonne.
		if (datas['meta'][i]['criteresLabel'][0] == '"')
		    data.addColumn ('number', datas['meta'][i]['criteresLabel'].substr (1, datas['meta'][i]['criteresLabel'].length - 2));
		else
		    data.addColumn ('number', datas['meta'][i]['criteresLabel']);
	    }
	    else nots[i] = true;
	}
	
	for (var i in datas['year']) { // On ajoute les lignes des metabolites.
	    var row = [i];
	    row.push (parseFloat (datas['year'][i]['value']));
	    for (var m in datas['year'][i]['meta']) {
		if (!(m in nots))
		    row.push (parseFloat (datas['year'][i]['meta'][m]));
	    }
	    data.addRows ([row]);
	}

	var options = {
            chartArea: { width: '50%' },
            hAxis: {
                title: 'Ann\351es'
	    },
            vAxis: {
		title: $('<div>Concentration &micro;g/L</div>').html ()
	    },
            series: {
		1: { curveType: 'function' }
            }
        };
	
	var chart = new google.visualization.LineChart (window.parent.document.getElementById ('chart_molecule'));
	chart.draw (data, options);

    });
        
    
}

/**
   Generation de l'encart contenant les informations d'un pesticide.
*/
function generatePest (datas) {
    $('#boxMol', window.parent.document).css('display', 'block');
    $('#chart_detection', window.parent.document).css('display', 'none');
    var mol = window.parent.document.getElementById ('infoMolList');
    while (mol.children.length > 0)
	mol.removeChild (mol.children [0]);
    
    var li = document.createElement ('li');
    var span = document.createElement ('span');
    span.className = "pull-right badge bg-blue";
    li.innerHTML = 'Nom';
    if (datas['nom'][0] == '"')
	span.innerHTML = datas['nom'].substr (1, datas['nom'].length - 2);
    else span.innerHTML = datas['nom'];
    
    li.appendChild (span);
    mol.appendChild (li);

    var li2 = document.createElement ('li');
    var span2 = document.createElement ('span');
    span2.className = "pull-right badge bg-blue";
    li2.innerHTML = 'Famille';
    if (datas['famille'][0] == '"')
	span2.innerHTML = datas['famille'].substr (1, datas['famille'].length - 2).replace ('é', '\351');
    else span2.innerHTML = datas['famille'].replace ('é', '\351');
    li2.appendChild (span2);
    mol.appendChild (li2);
    
    var li3 = document.createElement ('li');
    var span3 = document.createElement ('span');
    span3.className = "pull-right badge bg-blue";
    li3.innerHTML = 'Usage';
    span3.innerHTML = datas['fonction'];
    li3.appendChild (span3);
    mol.appendChild (li3);

    var li4 = document.createElement ('li');
    var span4 = document.createElement ('span');
    if (datas['statut']) {
	span4.className = "pull-right badge bg-green";
	span4.innerHTML = "oui";
    } else {
	span4.className = "pull-right badge bg-red";
	span4.innerHTML = "non";
    }
    
    li4.innerHTML = 'Autoris\351';
    li4.appendChild (span4);
    mol.appendChild (li4);

    if (!datas['statut'] && datas['date'] != "") {
	var li5 = document.createElement ('li');
	var span5 = document.createElement ('span');
	span5.className = "pull-right badge bg-blue";
	li5.innerHTML = "Date d'interdiction";
	var i = datas['date'].indexOf (' 00');
	if (i == -1) 
	    span5.innerHTML = datas['date'];
	else span5.innerHTML = datas['date'].substr (0, i);
	li5.appendChild (span5);
	mol.appendChild (li5);	
    }

    var li6 = document.createElement ('li');
    var span6 = document.createElement ('span');
    span6.className = "pull-right badge bg-blue";
    li6.innerHTML = 'Norme DCE';
    span6.innerHTML = datas['normeDce'];
    li6.appendChild (span6);
    mol.appendChild (li6);        

    if (datas['meta']) {	
	var li7 = document.createElement ('li');
	var span7 = document.createElement ('span');
	span7.className = "pull-right badge bg-blue";
	li7.innerHTML = 'Mol\351cule parent';
	span7.innerHTML = datas['parent_nom'].replace (/"/gi, '');
	li7.appendChild (span7);
	mol.appendChild (li7);
    }
    
    var titre = window.parent.document.getElementById ('titreMol');
    titre.innerHTML = "Information sur la mol\351cule recherch\351";
   
}

/**
   Generation du graphe des molecules les plus recherche.  
 */
function generateGraph (datas) {
    if (datas.length != 0) {
		
	google.charts.load('current', { packages: ['corechart', 'line', 'bar'] });
	google.charts.setOnLoadCallback(function () {	
	    quantif = [['Mol\351cule', '']];
	    for (var i in datas) {
		quantif.push([datas[i]['lb'].replace(/"/gi, ''), parseInt (datas[i]['quantif'])] );
	    }
	    
	    var options = {
		title: 'Mol\351cules les plus souvent quantifi\351es',
		chartArea: { width: '50%' },
		legend : 'none',
		hAxis: {
		    title: 'Nombre de quantifications',
		    minValue: 0
		},
		vAxis: {
		    title: 'Mol\351cules'
		}
	    };
	    var mol = window.parent.document.getElementById ('infoMolList');
	    while (mol.children.length > 0)
		mol.removeChild (mol.children [0]);
	    
	    var data = new google.visualization.arrayToDataTable (quantif);
	    $('#chart_detection', window.parent.document).css('display', 'block');
	    $('#boxMol', window.parent.document).css('display', 'block');
	    var chart = new google.visualization.BarChart (window.parent.document.getElementById ('chart_detection'));
	    chart.draw (data, options);
	    var titre = window.parent.document.getElementById ('titreMol');
	    titre.innerHTML = "Nombre de quantifications de la zone d'\351tude";
	});
    }
          
}

