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
        Schema::create('nova_implantacao', function (Blueprint $table) {
            $table->id();
            // FK para cliente
            $table->foreignId('cliente_id')->constrained('cliente')->cascadeOnDelete();

            // FK para usuario (responsável)
            $table->foreignId('responsavel')->nullable()->constrained('usuario', 'id')->nullOnDelete();

            $table->char('status', 1)->default('A');
            $table->time('tempo')->nullable();
            $table->string('observacao', 1000)->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nova_implantacao');
    }
};
