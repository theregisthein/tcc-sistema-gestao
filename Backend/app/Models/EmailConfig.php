<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailConfig extends Model
{
    use HasFactory;

    protected $table = 'email_config';

    protected $fillable = [
        'host',
        'port',
        'encryption',
        'usuario',
        'senha',
        'protocolo',
        'ativo',
    ];

    protected $casts = [
        'port'  => 'integer',
        'ativo' => 'boolean',
    ];
}