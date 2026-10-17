<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MensagemTicket extends Model
{
    use HasFactory;

    protected $table = 'mensagem_ticket';

    protected $fillable = [
        'ticket_id',
        'usuario_id',
        'assunto',
        'corpo_html',
        'corpo_texto',
        'message_id',
        'data_envio',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function destinatarios()
    {
        return $this->hasMany(MensagemDestinatario::class, 'mensagem_ticket_id');
    }

    public function anexos()
    {
        return $this->hasMany(MensagemAnexo::class, 'mensagem_id');
    }
}
