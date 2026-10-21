<?php

namespace App\Http\Controllers;

use App\Models\ClienteEmpresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClienteEmpresaController extends Controller
{
    /**
     * Lista as empresas/filiais. Permite filtrar por ?cliente_id=X
     */
    public function index(Request $request)
    {
        $query = ClienteEmpresa::query();

        if ($request->has('cliente_id')) {
            $query->where('cliente_id', $request->query('cliente_id'));
        }

        return response()->json($query->orderBy('is_matriz', 'desc')->get());
    }

    /**
     * Cadastra uma filial vinculada a um cliente existente.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id'   => 'required|exists:cliente,id',
            'cnpj'         => 'required|string|max:20|unique:cliente_empresa,cnpj',
            'razaoSocial'  => 'required|string|max:250',
            'nomeFantasia' => 'nullable|string|max:250',
            'is_matriz'    => 'nullable|boolean',
            'status'       => 'nullable|string|max:1',
        ], [
            'cliente_id.required' => 'O identificador do cliente é obrigatório.',
            'cliente_id.exists'   => 'Cliente associado não encontrado.',
            'cnpj.required'       => 'O CNPJ da empresa é obrigatório.',
            'cnpj.unique'         => 'Já existe uma filial cadastrada com este CNPJ.',
            'razaoSocial.required'=> 'A Razão Social é obrigatória.',
        ]);

        return DB::transaction(function () use ($validated) {
            $isMatriz = !empty($validated['is_matriz']) && $validated['is_matriz'];

            // Se for marcada como matriz, remove o status de matriz das outras empresas do mesmo cliente
            if ($isMatriz) {
                ClienteEmpresa::where('cliente_id', $validated['cliente_id'])
                    ->update(['is_matriz' => false]);
            }

            $empresa = ClienteEmpresa::create([
                'cliente_id'   => $validated['cliente_id'],
                'cnpj'         => $validated['cnpj'],
                'razaoSocial'  => $validated['razaoSocial'],
                'nomeFantasia' => $validated['nomeFantasia'] ?? $validated['razaoSocial'],
                'is_matriz'    => $isMatriz,
                'status'       => $validated['status'] ?? 'A',
            ]);

            return response()->json($empresa, 201);
        });
    }

    /**
     * Exibe os detalhes de uma empresa/filial.
     */
    public function show(string $id)
    {
        $empresa = ClienteEmpresa::findOrFail($id);
        return response()->json($empresa);
    }

    /**
     * Atualiza dados da empresa ou define/desfaz status de matriz.
     */
    public function update(Request $request, string $id)
    {
        $empresa = ClienteEmpresa::findOrFail($id);

        $validated = $request->validate([
            'cnpj'         => 'sometimes|required|string|max:20|unique:cliente_empresa,cnpj,' . $id,
            'razaoSocial'  => 'sometimes|required|string|max:250',
            'nomeFantasia' => 'nullable|string|max:250',
            'is_matriz'    => 'nullable|boolean',
            'status'       => 'nullable|string|max:1',
        ]);

        return DB::transaction(function () use ($empresa, $validated) {
            // Se for promovida a matriz, remove a condição de matriz de todas as outras filiais do cliente
            if (!empty($validated['is_matriz']) && $validated['is_matriz']) {
                ClienteEmpresa::where('cliente_id', $empresa->cliente_id)
                    ->where('id', '!=', $empresa->id)
                    ->update(['is_matriz' => false]);
            }

            $empresa->update($validated);

            return response()->json($empresa);
        });
    }

    /**
     * Remove uma empresa/filial com validação restritiva de integridade.
     */
    public function destroy(string $id)
    {
        $empresa = ClienteEmpresa::findOrFail($id);

        // Bloqueio 1: Não permite apagar a Matriz se ainda existirem filiais atreladas ao cliente
        if ($empresa->is_matriz) {
            $totalEmpresas = ClienteEmpresa::where('cliente_id', $empresa->cliente_id)->count();
            if ($totalEmpresas > 1) {
                return response()->json([
                    'message' => 'Não é permitido excluir a empresa Matriz enquanto houver filiais. Defina outra filial como Matriz antes de prosseguir.'
                ], 422);
            }
        }

        $empresa->delete();

        return response()->json(['mensagem' => 'Empresa removida com sucesso.']);
    }
}