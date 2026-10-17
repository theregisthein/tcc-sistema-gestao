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
        Schema::create('checklist_item', function (Blueprint $table) {
            $table->id();
            // FK para checklist
            $table->foreignId('checklist_id')->constrained('checklist')->cascadeOnDelete();
            
            $table->string('descricao', 500);
            $table->boolean('concluido')->default(false);
            $table->integer('ordem')->default(0);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('checklist_item');
    }
};
