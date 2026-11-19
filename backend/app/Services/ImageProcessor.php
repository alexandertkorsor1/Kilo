<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use RuntimeException;

class ImageProcessor
{
    public function process(UploadedFile $file): string
    {
        $imageInfo = getimagesize($file->getRealPath());

        if ($imageInfo === false) {
            throw new RuntimeException('Invalid image file.');
        }

        [$width, $height, $type] = $imageInfo;

        if (!in_array($type, [
            IMAGETYPE_JPEG,
            IMAGETYPE_PNG,
            IMAGETYPE_WEBP,
        ], true)) {
            throw new RuntimeException('Unsupported image format.');
        }

        if ($width > 4000 || $height > 4000) {
            throw new RuntimeException('Image dimensions exceed the allowed limit.');
        }

        $pixels = $width * $height;
        $estimatedMemory = $pixels * 12;

        $memoryLimit = ini_get('memory_limit');

        if ($memoryLimit === '-1') {
            $availableMemory = PHP_INT_MAX;
        } else {
            $unit = strtolower(substr($memoryLimit, -1));
            $value = (int) $memoryLimit;

            $limitBytes = match ($unit) {
                'g' => $value * 1024 * 1024 * 1024,
                'm' => $value * 1024 * 1024,
                'k' => $value * 1024,
                default => $value,
            };

            $availableMemory = $limitBytes - memory_get_usage(true);
        }

        if ($estimatedMemory > $availableMemory * 0.60) {
            throw new RuntimeException('Image requires too much processing memory.');
        }

        $bytes = file_get_contents($file->getRealPath());

        if ($bytes === false) {
            throw new RuntimeException('Unable to read uploaded image.');
        }

        $image = imagecreatefromstring($bytes);

        if ($image === false) {
            throw new RuntimeException('Unable to decode uploaded image.');
        }

        $outputPath = null;
        $keepOutput = false;

        try {
            if ($type === IMAGETYPE_JPEG) {
                $image = $this->correctOrientation($image, $file->getRealPath());
            }

            if ($type === IMAGETYPE_PNG || $type === IMAGETYPE_WEBP) {
                imagealphablending($image, false);
                imagesavealpha($image, true);
            }

            $extension = match ($type) {
                IMAGETYPE_JPEG => 'jpg',
                IMAGETYPE_PNG => 'png',
                IMAGETYPE_WEBP => 'webp',
                default => throw new RuntimeException('Unsupported image format.'),
            };

            $temporaryBase = tempnam(sys_get_temp_dir(), 'kilo_');

            if ($temporaryBase === false) {
                throw new RuntimeException('Unable to create temporary image.');
            }

            $outputPath = $temporaryBase . '.' . $extension;
            unlink($temporaryBase);

            $saved = match ($type) {
                IMAGETYPE_JPEG => imagejpeg($image, $outputPath, 88),
                IMAGETYPE_PNG => imagepng($image, $outputPath, 6),
                IMAGETYPE_WEBP => imagewebp($image, $outputPath, 88),
                default => false,
            };

            if (!$saved || !is_file($outputPath) || filesize($outputPath) === 0) {
                @unlink($outputPath);
                throw new RuntimeException('Unable to process uploaded image.');
            }

            $keepOutput = true;

            return $outputPath;
        } finally {
            if (!$keepOutput && $outputPath !== null && is_file($outputPath)) {
                @unlink($outputPath);
            }
        }
    }

    private function correctOrientation($image, string $path)
    {
        if (!function_exists('exif_read_data')) {
            return $image;
        }

        $exif = @exif_read_data($path);

        $orientation = (int) ($exif['Orientation'] ?? 1);

        if ($orientation >= 2 && $orientation <= 4) {
            imageflip(
                $image,
                $orientation === 2
                    ? IMG_FLIP_HORIZONTAL
                    : ($orientation === 3 ? IMG_FLIP_BOTH : IMG_FLIP_VERTICAL)
            );

            return $image;
        }

        $angle = match ($orientation) {
            6, 7 => -90,
            5, 8 => 90,
            default => 0,
        };

        if ($orientation === 5 || $orientation === 7) {
            imageflip($image, IMG_FLIP_HORIZONTAL);
        }

        if ($angle === 0) {
            return $image;
        }

        $rotated = imagerotate($image, $angle, 0);

        if ($rotated === false) {
            throw new RuntimeException('Unable to correct image orientation.');
        }


        return $rotated;
    }
}
