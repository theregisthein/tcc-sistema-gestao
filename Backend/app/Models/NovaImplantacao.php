<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NovaImplantacao extends Model
{
    use HasFactory;

    protected $table = 'novaimplantacao';

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

    // Relacionamento com o usuário responsável
    public function usuarioResponsavel()
    {
        return $this->belongsTo(Usuario::class, 'responsavel');
    }

    public function checklists()
    {
        return $this->hasMany(Checklist::class, 'implantacao_id');
    }

    // Relacionamento N:N com outros Usuários envolvidos na implantação
    public function usuarios()
    {
        return $this->belongsToMany(Usuario::class, 'UsuarioImplantacao', 'implantacao_id', 'usuario_id');
    }
}
