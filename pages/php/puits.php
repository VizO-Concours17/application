<?php


$user = "root";
$pass = "root";


$dbh = new PDO('mysql:host=localhost;dbname=vizo', $user, $pass);

$puit = $_GET['puit'];
$pest = $_GET['pest'];


if ($pest < 0) {
    $requete = 'SELECT * FROM table_1_pt where CD_STATION=\'' . $puit . "'";

    $rep = $dbh->query ($requete);
    $infos = array ();
    $infos['year'] = array ();
    while ($donnee = $rep->fetch ()) {

        if (!array_key_exists ('cd_station', $infos)) {
            $infos['cd_station'] = $donnee['CD_STATION'];
            $rep2 = $dbh->query ('SELECT NomMasseDE FROM liste_made WHERE CdMasseDEa=\'' . $donnee['CdMasseDEa'] . "'");
            $donnee2 = $rep2->fetch ();
            
            $infos['masse_eau']  = utf8_encode ($donnee2['NomMasseDE']);
            if ($pest == -1) $infos['criteresLabel'] = 'Concentration maximale';
            else $infos['criteresLabel'] = 'Concentration moyenne';            
        }

        $add = false;
        if (array_key_exists ($donnee['ANNEE'], $infos)) {
            if ($pest == -1) $add = $donnee['MAXPTOT'] > $infos[$donnee['ANNEE']]['value'];
            else $add = $donnee['MOYPTOT'] > $infos[$donnee['ANNEE']]['value'];
        } else $add = true;

        if ($add) {
            $infos['year'][$donnee['ANNEE']] = array('value' => ($pest == -1 ? $donnee['MAXPTOT'] : $donnee['MOYPTOT']), 'meta' => array ());
        }
    }
    
    echo json_encode ($infos);
} else {
    $requete = '';
    if ($puit[0] == '"')
	$requete = 'SELECT * FROM table_2_p INNER JOIN liste_param on table_2_p.CD_PARAMETRE=liste_param.CD_PARAMETRE where CD_STATION=\'' . $puit . "' and table_2_p.CD_PARAMETRE='\"" . $pest . "\"'";
    else
	$requete = 'SELECT * FROM table_2_p INNER JOIN liste_param on table_2_p.CD_PARAMETRE=liste_param.CD_PARAMETRE where CD_STATION=\'"' . $puit . "\"' and table_2_p.CD_PARAMETRE='\"" . $pest . "\"'";

    $rep = $dbh->query ($requete);
    $infos = array ();
    $infos['year'] = array ();
    while ($donnee = $rep->fetch ()) {
        if (!array_key_exists ('cd_station', $infos)) {
            $infos['cd_station'] = $donnee['CD_STATION'];
            $rep2 = $dbh->query ('SELECT NomMasseDE FROM liste_made WHERE CdMasseDEa=\'' . $donnee['CdMasseDEa'] . "'");
            $donnee2 = $rep2->fetch ();
            
            $infos['masse_eau']  = utf8_encode ($donnee2['NomMasseDE']);
            $infos['criteresLabel'] = 'Concentration ' . $donnee['LB_PARAMETRE']; 
        }
		
        $add = false;
        if (array_key_exists ($donnee['ANNEE'], $infos['year'])) {
            $add = $donnee['MA_MOY'] > $infos['year'][$donnee['ANNEE']]['value'];
        } else $add = true;

	
        if ($add) {
            $infos ['year'][$donnee['ANNEE']] = array ('value' => $donnee['MA_MOY'],
            'meta' => array ());            
        }        
    }

    if ($puit[0] == '"')
	$requete = 'SELECT * FROM table_2_p INNER JOIN liste_param on table_2_p.CD_PARAMETRE=liste_param.CD_PARAMETRE where CD_STATION=\'' . $puit . "' and liste_param.PARENT='\"" . $pest . "\"'";
    else
	$requete = 'SELECT * FROM table_2_p INNER JOIN liste_param on table_2_p.CD_PARAMETRE=liste_param.CD_PARAMETRE where CD_STATION=\'"' . $puit . "\"' and liste_param.PARENT='\"" . $pest . "\"'";

    $infos['meta'] = array ();
    $rep = $dbh->query ($requete);   
    while ($donnee = $rep->fetch ()) {
	if (!array_key_exists($donnee['ANNEE'], $infos['year'])) continue;
	if (!array_key_exists($donnee['CD_PARAMETRE'], $infos['meta'])) {
	    $infos['meta'][$donnee['CD_PARAMETRE']] = array ('criteresLabel' => 'Concentration ' . $donnee['LB_PARAMETRE']);
	}
	
	if (!array_key_exists($donnee['CD_PARAMETRE'], $infos['year'][$donnee['ANNEE']]['meta'])) {
	    $infos['year'][$donnee['ANNEE']]['meta'][$donnee['CD_PARAMETRE']] = $donnee['MA_MOY']; 
	}	
    }
    
    
    echo json_encode ($infos);
}


?>
