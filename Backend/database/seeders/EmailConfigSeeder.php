<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmailConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('email_config')->insert([
            'host'       => 'imap.gmail.com',
            'port'       => 993,
            'encryption' => 'ssl',
            'usuario'    => 'tcc2026testetcc@gmail.com', // E-mail central
            'senha'      => 'hamiyqtprtnrvcnn',          // Senha de app 16 dígitos
            'protocolo'  => 'imap',
            'ativo'      => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}