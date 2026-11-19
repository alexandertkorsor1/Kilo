<?php

namespace App\Console\Commands;

use App\Models\Photo;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:import-temporary-photos')]
#[Description('Import the existing temporary Pexels portfolio photos')]
class ImportTemporaryPhotos extends Command
{
    public function handle(): int
    {
        $photos = [
            [
                'external_url' => 'https://images.pexels.com/photos/1296198/pexels-photo-1296198.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
                'alt' => 'Striking portrait of a woman against a textured wall with dramatic lighting',
                'title' => 'Against the Wall',
                'category' => 'Portrait',
                'orientation' => 'portrait',
            ],
            [
                'external_url' => 'https://images.pexels.com/photos/10442714/pexels-photo-10442714.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
                'alt' => 'Altai mountains at sunset with golden hour light over serene valleys',
                'title' => 'Altai Gold',
                'category' => 'Landscape',
                'orientation' => 'landscape',
            ],
            [
                'external_url' => 'https://images.pexels.com/photos/3890028/pexels-photo-3890028.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
                'alt' => 'Night view of city architecture reflected in a puddle',
                'title' => 'After the Rain',
                'category' => 'Street',
                'orientation' => 'landscape',
            ],
            [
                'external_url' => 'https://images.pexels.com/photos/18077025/pexels-photo-18077025.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
                'alt' => 'Black and white wedding moment between a couple surrounded by nature',
                'title' => 'Quiet Vows',
                'category' => 'Wedding',
                'orientation' => 'landscape',
            ],
            [
                'external_url' => 'https://images.pexels.com/photos/32078064/pexels-photo-32078064.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
                'alt' => 'High contrast black and white portrait in profile with glasses',
                'title' => 'Profile in Light',
                'category' => 'Portrait',
                'orientation' => 'portrait',
            ],
            [
                'external_url' => 'https://images.pexels.com/photos/11834006/pexels-photo-11834006.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
                'alt' => 'Tranquil sunrise casting warm hues over a misty mountain landscape',
                'title' => 'Misty Sunrise',
                'category' => 'Landscape',
                'orientation' => 'landscape',
            ],
            [
                'external_url' => 'https://images.pexels.com/photos/18617747/pexels-photo-18617747.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
                'alt' => 'Moody urban nighttime underpass illuminated by green light',
                'title' => 'Green Underpass',
                'category' => 'Street',
                'orientation' => 'landscape',
            ],
            [
                'external_url' => 'https://images.pexels.com/photos/32325937/pexels-photo-32325937.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
                'alt' => 'Joyful candid moment of a bride during a traditional ceremony',
                'title' => 'The Laugh',
                'category' => 'Wedding',
                'orientation' => 'landscape',
            ],
            [
                'external_url' => 'https://images.pexels.com/photos/38969192/pexels-photo-38969192.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
                'alt' => 'Confident woman posing under dramatic moody studio lighting',
                'title' => 'Studio Mood',
                'category' => 'Portrait',
                'orientation' => 'portrait',
            ],
            [
                'external_url' => 'https://images.pexels.com/photos/18803585/pexels-photo-18803585.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
                'alt' => 'Mountains and hills at sunset in tranquil natural scenery',
                'title' => 'Last Light',
                'category' => 'Landscape',
                'orientation' => 'landscape',
            ],
            [
                'external_url' => 'https://images.pexels.com/photos/26970215/pexels-photo-26970215.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
                'alt' => 'Red taxi waiting at a traffic light on city streets at night',
                'title' => 'Red Light',
                'category' => 'Street',
                'orientation' => 'landscape',
            ],
            [
                'external_url' => 'https://images.pexels.com/photos/33372525/pexels-photo-33372525.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
                'alt' => 'Elegantly dressed couple sharing a romantic moment by a pool at night',
                'title' => 'By the Pool',
                'category' => 'Wedding',
                'orientation' => 'landscape',
            ],
        ];

        $imported = 0;
        $skipped = 0;

        foreach ($photos as $index => $photo) {
            $record = Photo::firstOrCreate(
                ['external_url' => $photo['external_url']],
                [
                    'title' => $photo['title'],
                    'alt' => $photo['alt'],
                    'category' => $photo['category'],
                    'orientation' => $photo['orientation'],
                    'image_path' => null,
                    'is_temporary' => true,
                    'is_published' => true,
                    'sort_order' => $index + 1,
                ]
            );

            if ($record->wasRecentlyCreated) {
                $imported++;
            } else {
                $skipped++;
            }
        }

        $this->info("Imported: {$imported}");
        $this->info("Already present: {$skipped}");
        $this->info('Temporary photo import completed.');

        return self::SUCCESS;
    }
}
