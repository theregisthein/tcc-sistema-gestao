<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MensagemDestinatario extends Model
{
    use HasFactory;

    protected $table = 'mensagem_destinatario';

    protected $fillable = [
        'mensagem_ticket_id',
        'tipo',
        'nome',
        'email',
    ];

    public function mensagem()
    {
        return $this->belongsTo(MensagemTicket::class, 'mensagem_ticket_id');
    }
}
