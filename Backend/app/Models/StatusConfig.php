<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StatusConfig extends Model
{
    protected $table = 'status_config';
    
    protected $fillable = [
        'nome',
    ];
}
