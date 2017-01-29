<?php

$user = "root";
$pass = "root";
$dbh = new PDO('mysql:host=localhost;dbname=vizo', $user, $pass);

$x1 = $_GET["x1"];
$y1 = $_GET["y1"];
$x2 = $_GET["x2"];
$y2 = $_GET["y2"];

$requete = "SELECT * from table_1_pt where X_FICT_W84 >= " . $x1 . " and X_FICT_W84 <= " . $x2 . " and Y_FICT_W84 >= " . $y1 . " and Y_FICT_W84 <= ". $y2;

$rep = $dbh->query ($requete);

$infos = array ('masse' => [], 'pest' => []);


while ($donnee = $rep->fetch ()) {
    if (!in_array ($donnee['CdMasseDEa'], $infos['masse'])) {
	array_push ($infos['masse'], $donnee['CdMasseDEa']);
    }    
}

$requete = "SELECT * from table_2_p INNER JOIN liste_param on table_2_p.CD_PARAMETRE=liste_param.CD_PARAMETRE where  X_FICT_W84 >= " . $x1 . " and X_FICT_W84 <= " . $x2 . " and Y_FICT_W84 >= " . $y1 . " and Y_FICT_W84 <= ". $y2 . " LIMIT 50";
$rep = $dbh->query ($requete);

$add = array ();

while ($donnee = $rep->fetch ()) {
    if (!in_array ($donnee ['CD_PARAMETRE'], $add)) {
	array_push ($infos['pest'], array ('cd' => $donnee['CD_PARAMETRE'],
					   'lb' => $donnee ['LB_PARAMETRE']));
	
	array_push ($add, $donnee['CD_PARAMETRE']);
    }
}




echo json_encode ($infos);


?>
