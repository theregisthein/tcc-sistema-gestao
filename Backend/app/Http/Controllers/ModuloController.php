<?php

namespace App\Http\Controllers;

use App\Models\Modulo;
use Illuminate\Http\Request;

class ModuloController extends Controller
{
    /**
     * Listagem de módulos cadastrados
     */
    public function index()
    {
        $modulos = Modulo::withCount('clientes')->orderBy('id', 'asc')->get();
        return response()->json($modulos);
    }

    /**
     * Cadastro de novo módulo
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nome'  => 'required|string|max:100|unique:modulo,nome',
            'valor' => 'required|numeric|min:0',
        ], [
            'nome.required'  => 'O nome do módulo é obrigatório.',
            'nome.unique'    => 'Já existe um módulo cadastrado com este nome.',
            'valor.required' => 'O valor do módulo é obrigatório.',
            'valor.numeric'  => 'O valor deve ser numérico.',
        ]);

        $modulo = Modulo::create($validated);

        return response()->json($modulo, 201);
    }

    /**
     * Exibição dos dados de um módulo específico
     */
    public function show(string $id)
    {
        $modulo = Modulo::with('clientes')->findOrFail($id);
        return response()->json($modulo);
    }

    /**
     * Atualização do módulo
     */
    public function update(Request $request, string $id)
    {
        $modulo = Modulo::findOrFail($id);

        $validated = $request->validate([
            'nome'  => 'sometimes|required|string|max:100|unique:modulo,nome,' . $id,
            'valor' => 'sometimes|required|numeric|min:0',
        ], [
            'nome.unique'   => 'Já existe um módulo cadastrado com este nome.',
            'valor.numeric' => 'O valor deve ser numérico.',
        ]);

        $modulo->update($validated);

        return response()->json($modulo);
    }

    /**
     * Remoção com bloqueio restritivo se houver clientes vinculados
     */
    public function destroy(string $id)
    {
        $modulo = Modulo::withCount('clientes')->findOrFail($id);

        if ($modulo->clientes_count > 0) {
            return response()->json([
                'message' => "Não é permitido excluir o módulo '{$modulo->nome}' pois ele está contratado por {$modulo->clientes_count} cliente(s)."
            ], 422);
        }

        $modulo->delete();

        return response()->json(['mensagem' => 'Módulo removido com sucesso.']);
    }
}