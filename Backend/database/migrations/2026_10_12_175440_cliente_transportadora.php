<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cliente_transportadora', function (Blueprint $table) {
            $table->foreignId('cliente_id')->constrained('cliente')->cascadeOnDelete();
            // transp_id apontando para a tabela transportadora
            $table->foreignId('transp_id')->constrained('transportadora')->cascadeOnDelete();
            
            // Chave primária composta para impedir duplicações
            $table->primary(['cliente_id', 'transp_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cliente_transportadora');
    }
};
