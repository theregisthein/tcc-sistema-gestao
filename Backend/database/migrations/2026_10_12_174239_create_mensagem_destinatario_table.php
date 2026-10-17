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
        Schema::create('mensagem_destinatario', function (Blueprint $table) {
            $table->id();
            // FK para mensagem_ticket (no DER está 'mensagemTickt_id')
            $table->foreignId('mensagem_ticket_id')->constrained('mensagem_ticket')->cascadeOnDelete();
            
            // tipo: define se é 'para', 'cc', ou 'cco'
            $table->enum('tipo', ['to', 'cc', 'bcc'])->default('to');
            
            $table->string('nome', 150)->nullable();
            $table->string('email', 150);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mensagem_destinatario');
    }
};
