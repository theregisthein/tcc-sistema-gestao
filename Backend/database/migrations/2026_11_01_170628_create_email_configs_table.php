<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('email_config', function (Blueprint $table) {
            $table->id();
            $table->string('host', 150);                    // Ex: imap.gmail.com ou imap.fretegestao.com.br
            $table->integer('port')->default(993);          // Porta padrão IMAP SSL
            $table->string('encryption', 20)->default('ssl'); // ssl, tls ou null
            $table->string('usuario', 150);                 // E-mail da caixa de suporte
            $table->string('senha', 255);                   // Senha ou App Password
            $table->string('protocolo', 20)->default('imap'); // imap ou pop3
            $table->boolean('ativo')->default(true);        // Permite ligar/desligar a monitorização
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_config');
    }
};