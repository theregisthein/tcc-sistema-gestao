<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory;

    protected $table = 'ticket';

    protected $fillable = [
        'cliente_id',
        'status_id',
        'canal_id',
        'categoria_id',
        'prioridade_id',
        'dataCriacao',
        'prazoPrimResp',
        'prazoResolucao',
        'dataFinalizado',
        'anotacao',
        'titulo',
        'message_id_header',
        'tempo',
    ];

    // Relacionamento com Cliente
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    // Configurações
    public function status()
    {
        return $this->belongsTo(StatusConfig::class, 'status_id');
    }

    public function canal()
    {
        return $this->belongsTo(CanalConfig::class, 'canal_id');
    }

    public function categoria()
    {
        return $this->belongsTo(CategoriaConfig::class, 'categoria_id');
    }

    public function prioridade()
    {
        return $this->belongsTo(PrioridadeConfig::class, 'prioridade_id');
    }

    // Relacionamento N:N com Usuários atribuídos (UsuarioTicket)
    public function usuarios()
    {
        return $this->belongsToMany(Usuario::class, 'UsuarioTicket', 'ticket_id', 'usuario_id');
    }

    // Mensagens do Ticket (que faremos a seguir)
    public function mensagens()
    {
        return $this->hasMany(MensagemTicket::class, 'ticket_id');
    }
}
