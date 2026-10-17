<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuario';

    protected $fillable = [
        'nome',
        'cpf',
        'setor',
        'email',
        'senha',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'senha',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'senha' => 'hashed', // Faz o Laravel hashear a senha automaticamente ao salvar
        ];
    }

    public function getAuthPassword()
    {
        return $this->senha;
    }

    // Tickets atribuídos a este utilizador
    public function tickets()
    {
        return $this->belongsToMany(
            Ticket::class,
            'usuario_ticket',
            'usuario_id',
            'ticket_id'
        );
    }

    // Implantações em que o utilizador está envolvido (tabela pivô usuario_implantacao)
    public function implantacoes()
    {
        return $this->belongsToMany(
            NovaImplantacao::class,
            'usuario_implantacao',
            'usuario_id',
            'implantacao_id'
        );
    }
    
    // Implantações onde este utilizador é o responsável principal (chave direta em novaimplantacao)
    public function implantacoesComoResponsavel()
    {
        return $this->hasMany(
            NovaImplantacao::class,
            'responsavel'
        );
    }
}