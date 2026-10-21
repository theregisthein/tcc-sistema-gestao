<?php

use Illuminate\Http\Request;


use App\Http\Controllers\TransportadoraController;
use App\Http\Controllers\StatusConfigController;
use App\Http\Controllers\CanalConfigController;
use App\Http\Controllers\CategoriaConfigController;
use App\Http\Controllers\PrioridadeConfigController;
use App\Http\Controllers\PlanoController;
use App\Http\Controllers\ClienteEmpresaController;
use App\Http\Controllers\ClienteController;

use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('transportadoras', TransportadoraController::class);

Route::apiResource('status-config', StatusConfigController::class);

Route::apiResource('canais-config', CanalConfigController::class);

Route::apiResource('categorias-config', CategoriaConfigController::class);

Route::apiResource('prioridades-config', PrioridadeConfigController::class);

Route::apiResource('planos', PlanoController::class);

Route::apiResource('cliente-empresas', ClienteEmpresaController::class);

Route::apiResource('clientes', ClienteController::class);
