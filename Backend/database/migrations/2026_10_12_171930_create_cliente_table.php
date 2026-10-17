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
        Schema::create('cliente', function (Blueprint $table) {
            $table->id();
            $table->string('nomeFantasia', 100);
            $table->string('emailAdm', 100)->nullable();
            $table->string('dominio', 100)->nullable();
            $table->date('dataAssContrato')->nullable();
            $table->date('dataFimContrato')->nullable();
            $table->date('dataIniImpl')->nullable();
            $table->date('dataFinImpl')->nullable();
            $table->decimal('valorContaFrete', 12, 2)->default(0.00);
            $table->char('status', 1)->default('A');
            
            // Chave estrangeira para Plano
            $table->foreignId('plano_id')->nullable()->constrained('plano')->nullOnDelete();
            
            $table->string('integracao', 500)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cliente');
    }
};
