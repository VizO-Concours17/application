<?php

$location_x = $_GET["x"];
$location_y = $_GET["y"];
$location_width = $_GET["width"];
$location_height = $_GET["height"];

$point = array ();
for ($i = 0; $i < 50; $i++) {
    array_push ($point, array ());
    $x = rand (-950, 950); $y = rand (-950, 950); $z = rand (0, 100);
    for ($year = 0; $year  < 4; $year++) {	    
	array_push ($point [$i], array ('x' => $x,
					'y' => $y,
					'z' => $z,
					'labelBot' => 'Bottom',
					'labelTop' => 'Top',
					'depth' => rand (200, 300),
					'lineColor' => (rand () * 0xFF0000 + 0x110000) << 0,
					'lineWidth' => 6,
					'sphereColor' => (rand () * 0xFF0000 + 0x110000) << 0,
					'sphereRadius' => rand (10, 30)));
	
    }
}

echo json_encode ($point);


?>
