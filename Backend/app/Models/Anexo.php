<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Anexo extends Model
{
    use HasFactory;

    protected $table = 'anexo';

    protected $fillable = [
        'nome',
        'caminho',
        'tipo',
        'tamanho',
        'dataUpload',
        'cliente_id',
        'implantacao_id',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function implantacao()
    {
        return $this->belongsTo(NovaImplantacao::class, 'implantacao_id');
    }
}
