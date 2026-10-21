<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClienteEmpresa extends Model
{
    use HasFactory;

    protected $table = 'cliente_empresa';

    protected $fillable = [
        'cliente_id',
        'cnpj',
        'razaoSocial',
        'nomeFantasia',
        'is_matriz',
        'status',
    ];

    protected $casts = [
        'is_matriz' => 'boolean',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}