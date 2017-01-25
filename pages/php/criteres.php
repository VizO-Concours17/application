<?php

$user = "root";
$pass = "root";
$dbh = new PDO('mysql:host=localhost;dbname=vizo', $user, $pass);

$x1 = $_GET["x1"];
$y1 = $_GET["y1"];
$x2 = $_GET["x2"];
$y2 = $_GET["y2"];

$rep = $dbh->query ("SELECT * from CONC_PT where X_FICT_W84 >= " . $x1 . " and X_FICT_W84 <= " . $x2 . " and Y_FICT_W84 >= " . $y1 . " and Y_FICT_W84 <= ". $y2);

$point = array ();

while ($donnee = $rep->fetch ()) {
    if (!array_key_exists ($donnee['ANNEE'], $point)) {
        $point[$donnee['ANNEE']] = array ();
    }

    
    array_push ($point [ $donnee['ANNEE'] ], array ('x' => $donnee ['X_FICT_W84'],
    'y' => $donnee ['Y_FICT_W84'],
    'z' => rand (0, 100),
    'depth' => rand (200, 300),
    'labelTop' => $donnee['CD_STATION'],
    'sphereRadius' => ($donnee['MINMOLRECH'] + $donnee['MAXMOLRECH']) / 20,
    'sphereColor' => toColorClasse ($donnee['LibelleLimit'], $donnee['MAXMOLQ']),
    'lineWidth' => 6,
    'lineColor' => toColorPrel ($donnee['NBPREL'])));
    
}

echo json_encode ($point);

function toColorPrel ($prel) {
    return ($prel * 0xFFFFFF) << 0;
}

function toColorClasse ($cl, $qu) {
    if ($qu == 0) return 0x111111 << 0 ;
    if ($cl == 'Classe 0') return 0xe1eF75 << 0;
    if ($cl == 'Classe 1') return 0xF9a702 << 0;
    if ($cl == 'Classe 2') return 0xF90202 << 0;
    return 0x5e0000;        
}


?>
