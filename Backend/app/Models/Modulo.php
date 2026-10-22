<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Modulo extends Model
{
    use HasFactory;

    protected $table = 'modulo';

    protected $fillable = [
        'nome',
        'valor',
    ];

    protected $casts = [
        'valor' => 'float',
    ];

    public function clientes()
    {
        return $this->belongsToMany(Cliente::class, 'modulo_cliente', 'modulo_id', 'cliente_id');
    }
}
