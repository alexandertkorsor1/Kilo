<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

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
    ];
}
