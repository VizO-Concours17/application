<?php


$user =	"root";
$pass = "root";	

$dbh =	 new PDO('mysql:host=localhost;dbname=vizo', $user, $pass);

$pest = $_GET['pest'];


function toNom ($name) {
    if ('A') return	'Acaricide';
    if ('B') return	'Biocide';
    if ('BF') return	'Biocide, Fongicide';
    if ('F') return 	'Fongicide';
    if ('FA') return 	'Fongicide, Acaricide';
    if ('FHM') return	'Fongicide, Herbicide, Mollusticide';
    if ('FN') return	'Fongicide, Nématicide';
    if ('H') return 	'Herbicide';
    if ('I') return	'Insecticide';
    if ('IA') return	'Insecticide, Acaricide';
    if ('IAFH') return  'Insecticide, Acaricide, Fongicide, Herbicide';
    if ('IAM') return	'Insecticide, Acaricide, Mollusticide';
    if ('IAN') return	'Insecticide, Acaricide, Nématicide';
    if('IM') return 	'Insecticide, Mollusticide';
    if ('IN') return 	'Insecticide, Nématicide';
    if ('Ireg') return 	'Insecticide, Régulateur de croissance';
    if ('N') return 	'Nématicide';
    if ('R') return 	'Rodenticide';
    if ('Reg') return 	'Régulateur de croissance';
    if ('RepO') return	'Répulsif';
    if ('Ro') return 	'Rodenticide';
    if ('HFNI') return	'Herbicide, Fongicide, Nématicide, Insecticide';
    if ('HG') return 	'Herbicide, Graminicide';
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
