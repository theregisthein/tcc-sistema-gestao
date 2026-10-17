<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuario_ticket', function (Blueprint $table) {
            $table->foreignId('usuario_id')->constrained('usuario')->cascadeOnDelete();
            $table->foreignId('ticket_id')->constrained('ticket')->cascadeOnDelete();
            
            $table->primary(['usuario_id', 'ticket_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuario_ticket');
    }
};