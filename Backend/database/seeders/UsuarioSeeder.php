<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsuarioSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('usuario')->insert([
            'nome'       => 'Régis Thein Rinaldi',
            'email'      => 'rinaldiregisthein@gmail.com',
            'password'   => Hash::make('12345678'), // ou 'senha' dependendo da sua coluna
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}