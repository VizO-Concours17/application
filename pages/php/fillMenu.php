<?php

$user = "root";
$pass = "root";
$dbh = new PDO('mysql:host=localhost;dbname=vizo', $user, $pass);

$x1 = $_GET["x1"];
$y1 = $_GET["y1"];
$x2 = $_GET["x2"];
$y2 = $_GET["y2"];

$requete = "SELECT * from CONC_PT2 where X_FICT_W84 >= " . $x1 . " and X_FICT_W84 <= " . $x2 . " and Y_FICT_W84 >= " . $y1 . " and Y_FICT_W84 <= ". $y2;

$rep = $dbh->query ($requete);

$infos = array ('masse' => [], 'pest' => []);


while ($donnee = $rep->fetch ()) {
    if (!in_array ($donnee['CdMasseDEa'], $infos['masse'])) {
	array_push ($infos['masse'], $donnee['CdMasseDEa']);
    }    
}

echo json_encode ($infos);


?>
