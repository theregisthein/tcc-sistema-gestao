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
        Schema::create('mensagem_anexo', function (Blueprint $table) {
            $table->id();
            // FK para mensagem_ticket
            $table->foreignId('mensagem_id')->constrained('mensagem_ticket')->cascadeOnDelete();
            
            $table->string('nomeOriginal', 500);
            $table->string('caminho', 500); // Path no storage local/S3
            $table->string('mimeType', 100)->nullable();
            $table->string('extensao', 10)->nullable();
            $table->unsignedBigInteger('tamanhoBytes')->nullable();
            $table->string('cid', 255)->nullable(); // Content-ID para imagens inline em emails HTML
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mensagem_anexo');
    }
};
