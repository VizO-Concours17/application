    <?php

$configFile = fopen('config.json', 'r');

$content = (array) json_decode (fread ($configFile, filesize('config.json')));

$user = $content['user'];//"root";
$pass = $content['pass'];//"root";

fclose ($configFile);

$dbh =	 new PDO('mysql:host=localhost;dbname=vizo', $user, $pass);


// TODO pesticide totaux moy, et max
// Sur le label bot on met la valeur moyenne.


$x1 = $_GET["x1"];
$y1 = $_GET["y1"];
$x2 = $_GET["x2"];
$y2 = $_GET["y2"];

$inter = "SELECT CD_PARAMETRE, SUM(NBQUANTIF) Somme from table_2_p where X_FICT_W84 >= " . $x1 . " and X_FICT_W84 <= " . $x2 . " and Y_FICT_W84 >= " . $y1 . " and Y_FICT_W84 <= ". $y2; 

if (array_key_exists ('masse', $_GET)) {
    $inter .= ' and (';
    for ($i = 0; $i < count ($_GET['masse']); $i++) {
        $inter .= 'CdMasseDEa = ' . "'\"" . $_GET['masse'][$i] . "\"'";
        if ($i < count ($_GET['masse']) - 1) $inter .= ' or ';
    }
    $inter .= ')';
}

$requete = "SELECT * FROM (" . $inter . ' GROUP BY CD_PARAMETRE) as V ORDER BY V.Somme DESC LIMIT 5';

$rep = $dbh->query ($requete);


$point['more'] = array ();
while ($donnee = $rep->fetch ()) {

    $rep2 = $dbh->query ("SELECT LB_PARAMETRE from liste_param where CD_PARAMETRE='" . $donnee['CD_PARAMETRE'] . "' or CD_PARAMETRE='\"" . $donnee['CD_PARAMETRE'] . "\"'");
    $quant = $donnee['Somme'];
    if ($rep2) {
	while ($donnee2 = $rep2->fetch ()) {
	    $name = $donnee2['LB_PARAMETRE'];
	    array_push ($point['more'], array ('lb' => $name, 'quantif' => $quant));		
	}
    }
}

echo json_encode ($point);

?>
