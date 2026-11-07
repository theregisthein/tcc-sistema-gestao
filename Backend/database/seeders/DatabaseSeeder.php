<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        DB::table('usuario')->insert([
            'nome'       => 'Régis Thein Rinaldi',
            'email'      => 'rinaldiregisthein@gmail.com',
            'senha'      => Hash::make('12345678'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->call([
        EmailConfigSeeder::class,
        ]);

    }
}