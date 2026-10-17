<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrioridadeConfig extends Model
{
    protected $table = 'prioridade_config';
    
    protected $fillable = [
        'nome',
        'prazo',
    ];
}