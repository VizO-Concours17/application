<?php

$configFile = fopen('config.json', 'r');

$content = (array) json_decode (fread ($configFile, filesize('config.json')));

$user = $content['user'];//"root";
$pass = $content['pass'];//"root";

fclose ($configFile);

$dbh = new PDO('mysql:host=localhost;dbname=vizo', $user, $pass);

$x1 = $_GET["x1"];
$y1 = $_GET["y1"];
$x2 = $_GET["x2"];
$y2 = $_GET["y2"];

$requete = "SELECT CdMasseDEa from table_1_pt where X_FICT_W84 >= " . $x1 . " and X_FICT_W84 <= " . $x2 . " and Y_FICT_W84 >= " . $y1 . " and Y_FICT_W84 <= ". $y2;

$rep = $dbh->query ($requete);

$infos = array ('masse' => [], 'pest' => []);


while ($donnee = $rep->fetch ()) {
    if (!in_array ($donnee['CdMasseDEa'], $infos['masse'])) {
	array_push ($infos['masse'], $donnee['CdMasseDEa']);
    }    
}

$inter = "SELECT DISTINCT CD_PARAMETRE CD from table_2_p where X_FICT_W84 >= " . $x1 . " and X_FICT_W84 <= " . $x2 . " and Y_FICT_W84 >= " . $y1 . " and Y_FICT_W84 <= ". $y2;

$requete = "SELECT liste_param.LB_PARAMETRE, CD from liste_param INNER JOIN (" . $inter . ") as V ON CD=liste_param.CD_PARAMETRE ORDER BY liste_param.LB_PARAMETRE";


$rep = $dbh->query ($requete);

$add = array ();

while ($donnee = $rep->fetch ()) {
    if (!in_array ($donnee ['CD'], $add)) {
	array_push ($infos['pest'], array ('cd' => $donnee['CD'],
					   'lb' => $donnee ['LB_PARAMETRE']));
	
	array_push ($add, $donnee['CD']);
    }
}




echo json_encode ($infos);



?>
