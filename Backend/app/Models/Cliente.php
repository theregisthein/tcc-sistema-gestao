<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    use HasFactory;

    protected $table = 'cliente';

    protected $fillable = [
        'nomeFantasia',
        'emailAdm',
        'dominio',
        'dataAssContrato',
        'dataFimContrato',
        'dataIniImpl',
        'dataFinImpl',
        'valorContaFrete',
        'status',
        'plano_id',
        'integracao',
    ];

    // Relacionamento com Plano
    public function plano()
    {
        return $this->belongsTo(Plano::class, 'plano_id', 'id');
    }

    // Um cliente pode ter vários contatos
    public function contatos()
    {
        return $this->hasMany(ContatoCliente::class, 'cliente_id');
    }

    // Um cliente pode ter várias empresas/filiais (Multi-CNPJ)
    public function empresas()
    {
        return $this->hasMany(ClienteEmpresa::class, 'cliente_id', 'id');
    }

    // Transportadoras homologadas vinculadas
    public function transportadoras()
    {
        return $this->belongsToMany(Transportadora::class, 'cliente_transportadora', 'cliente_id', 'transp_id');
    }

    // Módulos contratados vinculados
    public function modulos()
    {
        return $this->belongsToMany(Modulo::class, 'modulo_cliente', 'cliente_id', 'modulo_id');
    }
}