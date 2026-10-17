<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Transportadora;
use Illuminate\Database\Seeder;

class TransportadoraSeeder extends Seeder
{
    public function run(): void
    {
        Transportadora::create([
            'nome' => 'Jadlog Logística',
            'cnpj' => '12345678000199',
            'email' => 'contato@jadlog.com.br',
            'status' => 'A',
        ]);

        Transportadora::create([
            'nome' => 'Braspress Transportes',
            'cnpj' => '98765432000111',
            'email' => 'operacional@braspress.com.br',
            'status' => 'A',
        ]);
    }
}
