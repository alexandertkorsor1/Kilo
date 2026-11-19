<?php

$directory = __DIR__ . '/tests/fixtures/image-processor/processed';

for ($orientation = 1; $orientation <= 8; $orientation++) {
    $path = "{$directory}/orientation-{$orientation}.jpg";
    $image = imagecreatefromjpeg($path);

    $width = imagesx($image);
    $height = imagesy($image);

    $positions = [
        'TL' => [10, 10],
        'TR' => [$width - 11, 10],
        'BL' => [10, $height - 11],
        'BR' => [$width - 11, $height - 11],
    ];

    echo "Orientation {$orientation}: ";

    foreach ($positions as $label => [$x, $y]) {
        $color = imagecolorat($image, $x, $y);

        $r = ($color >> 16) & 255;
        $g = ($color >> 8) & 255;
        $b = $color & 255;

        echo "{$label}=({$r},{$g},{$b}) ";
    }

    echo PHP_EOL;
}
