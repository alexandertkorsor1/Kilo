<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Inquiry extends Model
{
    use HasUuids;

    protected $table = 'inquiries';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'email',
        'subject',
        'message',
        'is_read',
        'status',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'updated_at' => 'datetime',
        ];
    }
}
