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
        Schema::create('cliente_empresa', function (Blueprint $table) {
            $table->id();
            // Chave estrangeira para Cliente
            $table->foreignId('cliente_id')->constrained('cliente')->cascadeOnDelete();
            
            $table->string('cnpj', 20)->unique();
            $table->string('razaoSocial', 250);
            $table->string('nomeFantasia', 250)->nullable();
            $table->boolean('is_matriz')->default(false);
            $table->char('status', 1)->default('A');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cliente_empresa');
    }
};
