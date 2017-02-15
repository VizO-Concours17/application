<?php

$configFile = fopen('config.json', 'r');

$content = (array) json_decode (fread ($configFile, filesize('config.json')));

$user = $content['user'];//"root";
$pass = $content['pass'];//"root";
$url = $content['url'];//"$pass = $content['pass'];//"root";";

fclose ($configFile);

$dbh = new PDO($url, $user, $pass);


// TODO pesticide totaux moy, et max
// Sur le label bot on met la valeur moyenne.


$x1 = $_GET["x1"];
$y1 = $_GET["y1"];
$x2 = $_GET["x2"];
$y2 = $_GET["y2"];
$pest = $_GET['pest'];

$center_x = ($x1 + $x2) / 2;
$center_y = ($y1 + $y2) / 2;

$dist_x = abs ($x1 - $x2);
$dist_y = abs($y1 - $y2);

if ($pest == -1 || $pest == -2) {
    getFromTotal ();
} else {
    getFromPest ();
}

function getFromTotal () {    
    global $x1, $x2, $y1, $y2, $pest, $dbh, $center_x, $center_y, $dist_x, $dist_y;
    
    $requete = "SELECT * from table_1_pt where X_FICT_W84 >= " . $x1 . " and X_FICT_W84 <= " . $x2 . " and Y_FICT_W84 >= " . $y1 . " and Y_FICT_W84 <= ". $y2;
    
    if (array_key_exists ('masse', $_GET)) {
        $requete .= ' and (';
        for ($i = 0; $i < count ($_GET['masse']); $i++) {
            $requete .= 'CdMasseDEa = ' . "'\"" . $_GET['masse'][$i] . "\"'";
            if ($i < count ($_GET['masse']) - 1) $requete .= ' or ';
        }
        $requete .= ')';
    }
    
    
    $rep = $dbh->query ($requete);
    
    $point = array ();
    $max_prof = 0;
    
    
    while ($donnee = $rep->fetch ()) {
        if (!array_key_exists ($donnee['ANNEE'], $point)) {
            $point[$donnee['ANNEE']] = array ();
        }
	
        $x = ($donnee['X_FICT_W84'] - $center_x) / $dist_x * 2000 - 1;
        $y = ($center_y - $donnee['Y_FICT_W84']) / $dist_y * 2000 - 1;


        // Taille sphere <- avec de classe de taille.
        
        $add = false;
        if (array_key_exists ($donnee['CD_STATION'], $point[$donnee['ANNEE']])) {
            if ($pest == -1) $add = $donnee['MAXPTOT'] > $point[$donnee['ANNEE']][$donnee['CD_STATION']]['MAXPTOT'];
            else $add = $donnee['MOYPTOT'] > $point[$donnee['ANNEE']][$donnee['CD_STATION']]['MOYPTOT'];
        } else $add = true;
        
        if ($add) {
            $point [ $donnee['ANNEE'] ] [$donnee ['CD_STATION']] = array ('x' => $x,
            'y' => $y,
            'z' => $donnee['ALTITUDE'],
            'depth' => $donnee['PROFONDEUR_MAXI_POINT'] + $donnee['ALTITUDE'],
            'labelTop' => $donnee['CD_STATION'] . '<br/>' . $donnee['CdMasseDEa'],
            'labelBot' =>  ($pest == -1  ? (number_format ($donnee['MAXPTOT'], 3)) : number_format($donnee['MOYPTOT'], 3)) . " &micro;g/L <br/> " . $donnee['MAQMOLQ'] . "/" . $donnee['MAXMOLRECH'] . " Q/R",
            'sphereRadius' => toClasseMaxMolRech ($donnee ['MAXMOLRECH']),
            'sphereColor' => ($pest == -1 ? toColorClasse ($donnee['MAXPTOT'], $donnee['MAQMOLQ']) : toColorClasse ($donnee['MOYPTOT'], $donnee['MAQMOLQ']) ),
            'lineWidth' => 3,
            'lineColor' => masseColor ($donnee['CdMasseDEa']),
            'idPuit' => $donnee['CD_STATION'],
            'MAXPTOT' => $donnee['MAXPTOT'],
            'MOYPTOT' => $donnee['MOYPTOT']);
        }
	
    }

    echo json_encode ($point);

}

function getFromPest () {
    global $x1, $x2, $y1, $y2, $pest, $dbh, $center_x, $center_y, $dist_x, $dist_y;
    $requete = "SELECT * from table_2_p AS A  where  A.X_FICT_W84 >= " . $x1 . " and A.X_FICT_W84 <= " . $x2 . " and A.Y_FICT_W84 >= " . $y1 . " and A.Y_FICT_W84 <= ". $y2;
    
    if (array_key_exists ('masse', $_GET)) {
        $requete .= ' and (';
        for ($i = 0; $i < count ($_GET['masse']); $i++) {
            $requete .= 'CdMasseDEa = ' . "'\"" . $_GET['masse'][$i] . "\"'";
            if ($i < count ($_GET['masse']) - 1) $requete .= ' or ';
        }
        $requete .= ')';
    }
    
    $requete .= " and CD_PARAMETRE='\"" . $pest . "\"'"; 
    $rep = $dbh->query ($requete);
    $point = array ();
    $max_prof = 0;
    
    while ($donnee = $rep->fetch ()) {
        if (!array_key_exists ($donnee['ANNEE'], $point)) {
            $point[$donnee['ANNEE']] = array ();
        }
	
        $x = ($donnee['X_FICT_W84'] - $center_x) / $dist_x * 2000 - 1;
        $y = ($center_y - $donnee['Y_FICT_W84']) / $dist_y * 2000 - 1;

        $add = false;
        if (array_key_exists ($donnee['CD_STATION'], $point[$donnee['ANNEE']])) {
            $add = $donnee['MA_MOY'] > $point[$donnee['ANNEE']][$donnee['CD_STATION']]['MA_MOY'];
        } else $add = true;
        
        if ($add) {
            $point [ $donnee['ANNEE'] ] [$donnee ['CD_STATION']] = array ('x' => $x,
            'y' => $y,
            'z' => $donnee['ALTITUDE'],
            'depth' => $donnee['PROFONDEUR_MAXI_POINT'] + $donnee['ALTITUDE'],
            'labelTop' => $donnee['CD_STATION'] . '<br/>' . $donnee['CdMasseDEa'],
            'labelBot' =>  (number_format ($donnee['MA_MOY'], 3) . " &micro;g/L <br/> " . $donnee['NBQUANTIF'] . "/" . $donnee['NBANASPERTS1']) . " Q/R" ,
            'sphereRadius' => toClasseMolRech ($donnee ['NBANASPERTS1']),
            'sphereColor' => (toColorClasse ($donnee['MA_MOY'], $donnee['NBQUANTIF'])),
            'lineWidth' => 3,
            'lineColor' => masseColor ($donnee['CdMasseDEa']),
            'idPuit' => $donnee['CD_STATION'],
            'MA_MOY' => $donnee['MA_MOY']);
        }
    }

    echo json_encode($point);
}


function toColorPrel ($prel) {
    return (rand () * 0xAAAAAA) << 0;
}

function toColorClasse ($cl, $qu) {
    if ($qu == 0) return 0xFFFFFF << 0 ;
    if ($cl < 0.1) return 0xe1eF75 << 0;
    if ($cl < 0.5) return 0xF9a702 << 0;
    if ($cl < 5) return 0xF31919 << 0;
    return 0x590009;        
}


function toClasseMaxMolRech ($cl) {
    if ($cl < 20) return 6;
    else if ($cl < 100) return 12;
    else if ($cl < 200) return 15;
    else if ($cl < 300) return 18;
    else return 24;
}


function toClasseMolRech ($cl) {
    if ($cl < 1) return 6;
    else if ($cl < 2) return 12;
    else if ($cl < 3) return 15;
    else if ($cl < 4) return 18;
    else return 24;
}

$colors = array ();

function masseColor ($name) {
    global $colors;
    if ($colors && array_key_exists ($name, $colors)) {
        return $colors [$name];
    } else {
        $r = rand (0x000000, 0xFFFFFF);
        $colors [$name] = $r;
        return $r;
    }    
}

function newColor () {
    return rand (0x000000, 0xFFFFFF);
}



// classe taille boule pour le total.
// < 20 , < 100, < 200, < 300, 300 +


// Recherche par moyenne sur totaux.

// Min quantifie / min recherche -> 
// Max qu / max rech ->
// faire la moyenne

// Recherche par max sur totaux.

// On met juste les maxs.


// Recherche par pesticide.
// 1 - 2 - 3 - 4 - 4+
// taille boule -> NbRecherche de la molecule
// label bot -> concentration de la molecule, prct quantif

// Dans le graphe sur le cote.

// Pas de point si pas de puits.
// Point à zero si pas de quantif


?>
