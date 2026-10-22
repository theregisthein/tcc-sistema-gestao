<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NovaImplantacao extends Model
{
    use HasFactory;

    protected $table = 'nova_implantacao';

    protected $fillable = [
        'cliente_id',
        'status',
        'tempo',
        'observacao',
        'responsavel',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function usuarioResponsavel()
    {
        return $this->belongsTo(Usuario::class, 'responsavel');
    }

    public function checklists()
    {
        return $this->hasMany(Checklist::class, 'implantacao_id');
    }

    public function usuarios()
    {
        return $this->belongsToMany(
            Usuario::class,
            'usuario_implantacao',
            'implantacao_id',
            'usuario_id'
        );
    }
}