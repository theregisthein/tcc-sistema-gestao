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
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\ModuloController;
use App\Http\Controllers\NovaImplantacaoController;
use App\Http\Controllers\ChecklistController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AnexoController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RelatorioController;
use App\Http\Controllers\EmailConfigController;

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

Route::apiResource('usuarios', UsuarioController::class);

Route::apiResource('modulos', ModuloController::class);

Route::apiResource('novas-implantacoes', NovaImplantacaoController::class);

Route::patch('checklist-itens/{id}/toggle', [ChecklistController::class, 'toggleItem']);
Route::post('checklists/{checklistId}/itens', [ChecklistController::class, 'addItem']);
Route::delete('checklist-itens/{id}', [ChecklistController::class, 'destroyItem']);

//Login e Logout
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);

//Esqueceu a senha
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Rotas de Anexos (Arquivos em cliente e implantação)
Route::get('/anexos', [AnexoController::class, 'index']);
Route::post('/anexos', [AnexoController::class, 'store']);
Route::get('/anexos/{id}/download', [AnexoController::class, 'download']);
Route::delete('/anexos/{id}', [AnexoController::class, 'destroy']);

//Tickets
Route::get('/tickets/auxiliares', [TicketController::class, 'auxiliares']);
Route::post('/tickets/{id}/responder', [TicketController::class, 'responder']);
Route::apiResource('tickets', TicketController::class);

//Dashboard
Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

//Relatorio
Route::get('/relatorios/auxiliares', [RelatorioController::class, 'auxiliares']);
Route::get('/relatorios/vinculos', [RelatorioController::class, 'vinculos']);

//E-mail
Route::get('/configuracoes/email', [EmailConfigController::class, 'show']);
Route::put('/configuracoes/email', [EmailConfigController::class, 'update']);
//Ativar servico via botao nas configuracoes
Route::post('/configuracoes/email/toggle', [EmailConfigController::class, 'toggle']);