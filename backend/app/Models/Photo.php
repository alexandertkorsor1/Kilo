<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Photo extends Model
{
    use HasUuids;

    protected $fillable = [
        'title',
        'alt',
        'category',
        'orientation',
        'image_path',
        'external_url',
        'is_temporary',
        'is_published',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_temporary' => 'boolean',
            'is_published' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
