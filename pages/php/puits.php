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

    $requete = 'SELECT * FROM table_2_p where CD_STATION=\'"' . $puit . "\"' and CD_PARAMETRE='\"" . $pest . "\"'";

    $rep = $dbh->query ($requete);

    while ($donnee = $rep->fetch ()) {
        if (!array_key_exists ('cd_station', $infos)) {
            $infos['cd_station'] = $donnee['CD_STATION'];
            $rep2 = $dbh->query ('SELECT NomMasseDE FROM liste_made WHERE CdMasseDEa=\'' . $donnee['CdMasseDEa'] . "'");
            $donnee2 = $rep2->fetch ();
            
            $infos['masse_eau']  = utf8_encode ($donnee2['NomMasseDE']);
            $infos['criteresLabel'] = 'Concentration'; 
        }
        $add = false;
        if (array_key_exists ($donnee['ANNEE'], $infos)) {
            $add = $donnee['MA_MOY'] > $infos[$donnee['ANNEE']]['value'];
        } else $add = true;
        
        if ($add) {
            $infos ['year'][$donnee['ANNEE']] = array ('value' => $donnee['MA_MOY'],
            'meta' => array ());            
        }        
    }

    echo json_encode ($infos);
}


?>