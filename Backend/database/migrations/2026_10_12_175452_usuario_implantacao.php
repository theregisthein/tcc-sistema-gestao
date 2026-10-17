<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuario_implantacao', function (Blueprint $table) {
            $table->foreignId('usuario_id')->constrained('usuario')->cascadeOnDelete();
            $table->foreignId('implantacao_id')->constrained('nova_implantacao')->cascadeOnDelete();
            
            $table->primary(['usuario_id', 'implantacao_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuario_implantacao');
    }
};