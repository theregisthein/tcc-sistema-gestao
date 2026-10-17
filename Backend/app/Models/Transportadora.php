<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transportadora extends Model
{
    use HasFactory;

    protected $table = 'transportadora';

    protected $fillable = [
        'nome',
        'cnpj',
        'email',
        'status',
    ];

    public function clientes()
    {
        return $this->belongsToMany(Cliente::class, 'cliente_transportadora', 'transp_id', 'cliente_id');
    }
}
