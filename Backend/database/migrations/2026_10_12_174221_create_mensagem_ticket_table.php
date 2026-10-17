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
        Schema::create('mensagem_ticket', function (Blueprint $table) {
            $table->id();
            // FK para ticket
            $table->foreignId('ticket_id')->constrained('ticket')->cascadeOnDelete();
            
            // FK para usuario (pode ser nulo caso a mensagem venha direto de e-mail externo do cliente)
            $table->foreignId('usuario_id')->nullable()->constrained('usuario')->nullOnDelete();
            
            $table->string('assunto', 255)->nullable();
            $table->longText('corpo_html')->nullable();
            $table->longText('corpo_texto')->nullable();
            $table->string('message_id', 255)->nullable(); // ID do cabeçalho de e-mail (Message-ID RFC)
            $table->dateTime('data_envio')->useCurrent();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mensagem_ticket');
    }
};
