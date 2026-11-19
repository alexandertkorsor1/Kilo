<?php

require __DIR__ . '/vendor/autoload.php';

use App\Services\ImageProcessor;
use Illuminate\Http\UploadedFile;

$processor = new ImageProcessor();

foreach (['jpg', 'png', 'webp'] as $format) {
    $source = imagecreatetruecolor(100, 100);

    if ($format === 'png' || $format === 'webp') {
        imagealphablending($source, false);
        imagesavealpha($source, true);
        $transparent = imagecolorallocatealpha($source, 255, 0, 0, 64);
        imagefill($source, 0, 0, $transparent);
    }

    $input = tempnam(sys_get_temp_dir(), 'kilo_test_') . '.' . $format;

    match ($format) {
        'jpg' => imagejpeg($source, $input, 90),
        'png' => imagepng($source, $input),
        'webp' => imagewebp($source, $input, 90),
    };


    $uploaded = new UploadedFile($input, 'test.' . $format, null, null, true);
    $output = $processor->process($uploaded);

    $info = getimagesize($output);

    echo strtoupper($format) . ': '
        . ($info ? 'PASS' : 'FAIL')
        . ' | Dimensions: ' . ($info[0] ?? '?') . 'x' . ($info[1] ?? '?')
        . ' | Output: ' . basename($output)
        . PHP_EOL;

    unlink($input);
    unlink($output);
}
