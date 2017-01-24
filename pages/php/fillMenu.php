<?php

$location_x = $_GET["x"];
$location_y = $_GET["y"];
$location_width = $_GET["width"];
$location_height = $_GET["height"];

$data = array ('masseeau' => ['A', 'B', 'C']);

$json_string = json_encode ($data);
echo $json_string;

?>
