<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MensagemAnexo extends Model
{
    use HasFactory;

    protected $table = 'mensagem_anexo';

    protected $fillable = [
        'mensagem_id',
        'nomeOriginal',
        'caminho',
        'mimeType',
        'extensao',
        'tamanhoBytes',
        'cid',
    ];

    public function mensagem()
    {
        return $this->belongsTo(MensagemTicket::class, 'mensagem_id');
    }
}
