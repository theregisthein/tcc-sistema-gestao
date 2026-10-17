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
        Schema::create('anexo', function (Blueprint $table) {
            $table->id();
            $table->string('nome', 255);
            $table->string('caminho', 500); // Path no storage
            $table->string('tipo', 100)->nullable(); // MIME type ou extensão
            $table->unsignedBigInteger('tamanho')->nullable(); // Tamanho em bytes/KB
            $table->dateTime('dataUpload')->useCurrent();
            
            // FK para cliente (obrigatória)
            $table->foreignId('cliente_id')->constrained('cliente')->cascadeOnDelete();
            
            // FK para novaimplantacao (opcional/anulável)
            $table->foreignId('implantacao_id')->nullable()->constrained('nova_implantacao')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('anexo');
    }
};
