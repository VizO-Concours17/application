<?php

$user = "root";
$pass = "root";

$dbh = new PDO('mysql:host=localhost;dbname=vizo', $user, $pass);


$x1 = $_GET["x1"];
$y1 = $_GET["y1"];
$x2 = $_GET["x2"];
$y2 = $_GET["y2"];



$center_x = ($x1 + $x2) / 2;
$center_y = ($y1 + $y2) / 2;

$dist_x = abs ($x1 - $x2);
$dist_y = abs($y1 - $y2);

$requete = "SELECT * from CONC_PT2 where X_FICT_W84 >= " . $x1 . " and X_FICT_W84 <= " . $x2 . " and Y_FICT_W84 >= " . $y1 . " and Y_FICT_W84 <= ". $y2;

if (array_key_exists ('masse', $_GET)) {
    $requete .= ' and (';
    for ($i = 0; $i < count ($_GET['masse']); $i++) {
	$requete .= 'CdMasseDEa = ' . "'" . $_GET['masse'][$i] . "'";
	if ($i < count ($_GET['masse']) - 1) $requete .= ' or ';
    }
    $requete .= ')';
}



$rep = $dbh->query ($requete);

$point = array ();

while ($donnee = $rep->fetch ()) {
    if (!array_key_exists ($donnee['ANNEE'], $point)) {
        $point[$donnee['ANNEE']] = array ();
    }

    $x = ($donnee['X_FICT_W84'] - $center_x) / $dist_x * 2000 - 1;
    $y = ($center_y - $donnee['Y_FICT_W84']) / $dist_y * 2000 - 1;

    
    if (!array_key_exists ($donnee['CD_STATION'], $point[$donnee['ANNEE']])) {
	$point [ $donnee['ANNEE'] ] [$donnee ['CD_STATION']] = array ('x' => $x,
								      'y' => $y,
								      'z' => rand (0, 100),
								      'depth' => rand (200, 300),
								      'labelTop' => $donnee['CD_STATION'],
								      'labelBot' => $donnee['LibelleLimite'] . " " . $donnee['MOYPTOT'],
								      'sphereRadius' => ($donnee['MINMOLRECH'] + $donnee['MAXMOLRECH']) / 30,
								      'sphereColor' => toColorClasse ($donnee['LibelleLimite'], $donnee['MAQMOLQ']),
								      'lineWidth' => 6,
								      'lineColor' => toColorClasse ($donnee['LibelleLimite'], $donnee['MAQMOLQ']));
    }
    
}

echo json_encode ($point);

function toColorPrel ($prel) {
    return (rand () * 0xAAAAAA) << 0;
}

function toColorClasse ($cl, $qu) {
    if ($qu == 0) return 0xFFFFFF << 0 ;
    if ($cl == 'Classe 0') return 0xe1eF75 << 0;
    if ($cl == 'Classe 1') return 0xF9a702 << 0;
    if ($cl == 'Classe 2') return 0xF9a702 << 0;
    return 0x5e0000;        
}


?>
