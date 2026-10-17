<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CanalConfig extends Model
{
    protected $table = 'canal_config';
    protected $fillable = [
        'nome',
    ];
}
