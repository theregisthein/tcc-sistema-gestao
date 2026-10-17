<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoriaConfig extends Model
{
    protected $table = 'categoria_config';
    protected $fillable = [
        'nome',
    ];
}