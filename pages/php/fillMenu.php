<?php

$user = "root";
$pass = "root";
$dbh = new PDO('mysql:host=localhost;dbname=vizo', $user, $pass);


$x1 = $_GET["x1"];
$y1 = $_GET["y1"];
$x2 = $_GET["x2"];
$y2 = $_GET["y2"];

$data = array ('masseeau' => ['A', 'B', 'C']);

$json_string = json_encode ($data);
echo $json_string;

$dbh = null;

?>
