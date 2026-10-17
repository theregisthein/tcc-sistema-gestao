<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContatoCliente extends Model
{
    use HasFactory;

    protected $table = 'contato_cliente';

    protected $fillable = [
        'nome',
        'email',
        'cliente_id',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
