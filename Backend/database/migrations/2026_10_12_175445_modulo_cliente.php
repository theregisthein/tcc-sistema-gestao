<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modulo_cliente', function (Blueprint $table) {
            $table->foreignId('cliente_id')->constrained('cliente')->cascadeOnDelete();
            $table->foreignId('modulo_id')->constrained('modulo')->cascadeOnDelete();
            
            $table->primary(['cliente_id', 'modulo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modulo_cliente');
    }
};