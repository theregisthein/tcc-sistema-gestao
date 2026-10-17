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
        Schema::create('ticket', function (Blueprint $table) {
            $table->id();

            // Chaves Estrangeiras
            $table->foreignId('cliente_id')->constrained('cliente')->cascadeOnDelete();
            $table->foreignId('status_id')->nullable()->constrained('status_config')->nullOnDelete();
            $table->foreignId('canal_id')->nullable()->constrained('canal_config')->nullOnDelete();
            $table->foreignId('categoria_id')->nullable()->constrained('categoria_config')->nullOnDelete();
            $table->foreignId('prioridade_id')->nullable()->constrained('prioridade_config')->nullOnDelete();
            
            // Datas e Prazos
            $table->dateTime('dataCriacao')->useCurrent();
            $table->dateTime('prazoPrimResp')->nullable();
            $table->dateTime('prazoResolucao')->nullable();
            $table->dateTime('dataFinalizado')->nullable();
            
            // Dados do Chamado
            $table->string('titulo', 500);
            $table->text('anotacao')->nullable(); // VARCHAR(10000) no DER -> text no MySQL
            $table->string('message_id_header', 255)->nullable(); // Header de email (se integrado)
            $table->time('tempo')->nullable(); // Tempo gasto/registrado
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket');
    }
};
