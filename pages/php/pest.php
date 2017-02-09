<?php


$user =	"root";
$pass = "root";	

$dbh =	 new PDO('mysql:host=localhost;dbname=vizo', $user, $pass);

$pest = $_GET['pest'];


function toNom ($name) {
    if ($name == 'A' || $name == '"A"') return	'Acaricide';
    if ($name == 'B' || $name == '"B"') return	'Biocide';
    if ($name == 'BF' || $name == '"BF"') return	'Biocide, Fongicide';
    if ($name == 'F' || $name == '"F"') return 	'Fongicide';
    if ($name == 'FA' || $name == '"FA"') return 	'Fongicide, Acaricide';
    if ($name == 'FHM' || $name == '"FHM"') return	'Fongicide, Herbicide, Mollusticide';
    if ($name == 'FN' || $name == '"FN"') return	'Fongicide, Nématicide';
    if ($name == 'H' || $name == '"H"') return 	'Herbicide';
    if ($name == 'I' || $name == '"I"') return	'Insecticide';
    if ($name == 'IA' || $name == '"IA"') return	'Insecticide, Acaricide';
    if ($name == 'IAFH' || $name == '"IAFH"') return  'Insecticide, Acaricide, Fongicide, Herbicide';
    if ($name == 'IAM' || $name == '"IAM"') return	'Insecticide, Acaricide, Mollusticide';
    if ($name == 'IAN' || $name == '"IAN"') return	'Insecticide, Acaricide, Nématicide';
    if($name == 'IM' || $name == '"IM"') return 	'Insecticide, Mollusticide';
    if ($name == 'IN' || $name == '"IN"') return 	'Insecticide, Nématicide';
    if ($name == 'Ireg' || $name == '"Ireg"') return 	'Insecticide, Régulateur de croissance';
    if ($name == 'N' || $name == '"N"') return 	'Nématicide';
    if ($name == 'R' || $name == '"R"') return 	'Rodenticide';
    if ($name == 'Reg' || $name == '"Reg"') return 	'Régulateur de croissance';
    if ($name == 'RepO' || $name == '"RepO"') return	'Répulsif';
    if ($name == 'Ro' || $name == '"Ro"') return 	'Rodenticide';
    if ($name == 'HFNI' || $name == '"HFNI"') return	'Herbicide, Fongicide, Nématicide, Insecticide';
    if ($name == 'HG' || $name == '"HG"') return 	'Herbicide, Graminicide';
    return '';
}

$requete = "SELECT * FROM liste_param where CD_PARAMETRE=" . $pest . " or CD_PARAMETRE='\"" . $pest . "\"'";
$rep = $dbh->query ($requete);

$result = array ();

while ($donnee = $rep->fetch ()) {

    $result = array ('nom' => $donnee['LB_PARAMETRE'],
		     'famille' => $donnee['CODE_FAMILLE'],
		     'fonction' => utf8_encode (toNom ($donnee['CODE_FONCTION'])),
		     'statut' => ($donnee['STATUT'] == 'PNA' ? true : false),
		     'date' => $donnee['DATE_NA_USAGE'],
		     'meta' => $donnee['METABOLITE'],
		     'normeDce' => $donnee['NORME_DCE']);

    if ($donnee['METABOLITE'] == 'oui' || $donnee['METABOLITE'] == '"oui"') {
	$rep2 = $dbh->query ('select * from liste_param where CD_PARAMETRE=' . $donnee['PARENT']);
	$result['parent'] = $donnee['PARENT'];
	$donnee2 = $rep2->fetch ();
	$result['parent_nom'] = $donnee2['LB_PARAMETRE'];
    } 

}

echo json_encode ($result);

?>
