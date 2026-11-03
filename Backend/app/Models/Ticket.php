<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
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

    protected $casts = [
        'dataCriacao'    => 'datetime',
        'prazoPrimResp'  => 'datetime',
        'prazoResolucao' => 'datetime',
        'dataFinalizado' => 'datetime',
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

    // Relacionamento N:N com Usuários atribuídos (tabela real: usuario_ticket)
    public function usuarios()
    {
        return $this->belongsToMany(Usuario::class, 'usuario_ticket', 'ticket_id', 'usuario_id');
    }

    // Mensagens / Linha do tempo do Ticket
    public function mensagens()
    {
        return $this->hasMany(MensagemTicket::class, 'ticket_id');
    }
}