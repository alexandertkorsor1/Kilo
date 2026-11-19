<?php

require __DIR__ . '/vendor/autoload.php';

use App\Services\ImageProcessor;
use Illuminate\Http\UploadedFile;

$processor = new ImageProcessor();

for ($orientation = 1; $orientation <= 8; $orientation++) {
    $input = __DIR__ . "/tests/fixtures/image-processor/orientation-{$orientation}.jpg";

    $uploaded = new UploadedFile(
        $input,
        "orientation-{$orientation}.jpg",
        'image/jpeg',
        null,
        true
    );

    $output = $processor->process($uploaded);

    $destination = __DIR__ . "/tests/fixtures/image-processor/processed/orientation-{$orientation}.jpg";

    if (!copy($output, $destination)) {
        throw new RuntimeException("Could not save orientation {$orientation}.");
    }

    unlink($output);

    $info = getimagesize($destination);

    echo "Orientation {$orientation}: "
        . ($info ? "{$info[0]}x{$info[1]}" : 'FAILED')
        . " | Saved: " . basename($destination)
        . PHP_EOL;
}
