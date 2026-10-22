<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\ClienteEmpresa;
use App\Models\ContatoCliente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClienteController extends Controller
{
    /**
     * Listagem de clientes com suas empresas, plano, contatos, transportadoras e módulos.
     */
    public function index()
    {
        try {
            // Carrega com todas as relações ativas
            $clientes = Cliente::with(['empresas', 'plano', 'contatos', 'transportadoras', 'modulos'])
                ->orderBy('id', 'desc')
                ->get();
            return response()->json($clientes);
        } catch (\Throwable $e) {
            try {
                // Fallback 1: se transportadoras, contatos ou modulos falharem, carrega empresas e plano
                $clientes = Cliente::with(['empresas', 'plano'])
                    ->orderBy('id', 'desc')
                    ->get();
                return response()->json($clientes);
            } catch (\Throwable $e2) {
                // Fallback 2: carrega a tabela cliente pura sem quebrar a tela
                return response()->json(Cliente::orderBy('id', 'desc')->get());
            }
        }
    }

    /**
     * Cadastro do Cliente junto com a sua primeira empresa (Matriz).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nomeFantasia'        => 'required|string|max:100',
            'emailAdm'            => 'nullable|email|max:100',
            'dominio'             => 'nullable|string|max:100',
            'dataAssContrato'     => 'nullable|date',
            'dataFimContrato'     => 'nullable|date',
            'dataIniImpl'         => 'nullable|date',
            'dataFinImpl'         => 'nullable|date',
            'valorContaFrete'     => 'nullable|numeric',
            'status'              => 'nullable|string|max:1',
            'plano_id'            => 'nullable|integer',
            'integracao'          => 'nullable|string|max:500',

            // Validação dos dados da Empresa Matriz
            'matrizCnpj'          => 'required|string|max:20|unique:cliente_empresa,cnpj',
            'matrizRazao'         => 'required|string|max:250',
            
            // Relações opcionais no cadastro inicial
            'transportadora_ids'  => 'nullable|array',
            'modulo_ids'          => 'nullable|array',
            'contatos'            => 'nullable|array',
        ], [
            'nomeFantasia.required' => 'O Nome Fantasia é obrigatório.',
            'emailAdm.email'        => 'Informe um endereço de e-mail válido.',
            'matrizCnpj.required'   => 'O CNPJ da Matriz é obrigatório.',
            'matrizCnpj.unique'     => 'Já existe uma empresa cadastrada com este CNPJ.',
            'matrizRazao.required'  => 'A Razão Social da Matriz é obrigatória.',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                // 1. Cria o Cliente principal
                $cliente = Cliente::create([
                    'nomeFantasia'    => $validated['nomeFantasia'],
                    'emailAdm'        => $validated['emailAdm'] ?? null,
                    'dominio'         => $validated['dominio'] ?? null,
                    'dataAssContrato' => $validated['dataAssContrato'] ?? null,
                    'dataFimContrato' => $validated['dataFimContrato'] ?? null,
                    'dataIniImpl'     => $validated['dataIniImpl'] ?? null,
                    'dataFinImpl'     => $validated['dataFinImpl'] ?? null,
                    'valorContaFrete' => $validated['valorContaFrete'] ?? 0.00,
                    'status'          => $validated['status'] ?? 'A',
                    'plano_id'        => !empty($validated['plano_id']) ? $validated['plano_id'] : null,
                    'integracao'      => $validated['integracao'] ?? null,
                ]);

                // 2. Cria a Empresa Matriz associada a este cliente
                ClienteEmpresa::create([
                    'cliente_id'   => $cliente->id,
                    'cnpj'         => $validated['matrizCnpj'],
                    'razaoSocial'  => $validated['matrizRazao'],
                    'nomeFantasia' => $validated['nomeFantasia'],
                    'is_matriz'    => true,
                    'status'       => 'A',
                ]);

                // 3. Vincula Transportadoras se enviadas
                if (!empty($validated['transportadora_ids'])) {
                    $cliente->transportadoras()->sync($validated['transportadora_ids']);
                }

                // 4. Vincula Módulos contratados se enviados
                if (!empty($validated['modulo_ids'])) {
                    $cliente->modulos()->sync($validated['modulo_ids']);
                }

                // 5. Salva Contatos se enviados
                if (!empty($validated['contatos'])) {
                    foreach ($validated['contatos'] as $c) {
                        if (!empty($c['nome']) || !empty($c['email'])) {
                            ContatoCliente::create([
                                'cliente_id' => $cliente->id,
                                'nome'       => $c['nome'] ?? '',
                                'email'      => $c['email'] ?? '',
                            ]);
                        }
                    }
                }

                return response()->json($cliente->load(['empresas', 'plano', 'contatos', 'transportadoras', 'modulos']), 201);
            });
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erro ao persistir cliente e matriz.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exibe os detalhes de um cliente específico.
     */
    public function show(string $id)
    {
        $cliente = Cliente::with(['empresas', 'plano', 'contatos', 'transportadoras', 'modulos'])->findOrFail($id);
        return response()->json($cliente);
    }

    /**
     * Atualiza dados cadastrais, operacionais, contatos, transportadoras e módulos do cliente.
     */
    public function update(Request $request, string $id)
    {
        $cliente = Cliente::findOrFail($id);

        $validated = $request->validate([
            'nomeFantasia'        => 'sometimes|required|string|max:100',
            'emailAdm'            => 'nullable|email|max:100',
            'dominio'             => 'nullable|string|max:100',
            'dataAssContrato'     => 'nullable|date',
            'dataFimContrato'     => 'nullable|date',
            'dataIniImpl'         => 'nullable|date',
            'dataFinImpl'         => 'nullable|date',
            'valorContaFrete'     => 'nullable|numeric',
            'status'              => 'nullable|string|max:1',
            'plano_id'            => 'nullable|integer',
            'integracao'          => 'nullable|string|max:500',
            'transportadora_ids'  => 'nullable|array',
            'modulo_ids'          => 'nullable|array',
            'contatos'            => 'nullable|array',
        ]);

        if (array_key_exists('plano_id', $validated) && empty($validated['plano_id'])) {
            $validated['plano_id'] = null;
        }

        DB::transaction(function () use ($cliente, $validated) {
            $cliente->update($validated);

            // Sincroniza a tabela pivô cliente_transportadora
            if (isset($validated['transportadora_ids'])) {
                $cliente->transportadoras()->sync($validated['transportadora_ids']);
            }

            // Sincroniza a tabela pivô modulo_cliente
            if (isset($validated['modulo_ids'])) {
                $cliente->modulos()->sync($validated['modulo_ids']);
            }

            // Sincroniza a tabela contato_cliente (recria os contatos do cliente)
            if (isset($validated['contatos'])) {
                $cliente->contatos()->delete();
                foreach ($validated['contatos'] as $c) {
                    if (!empty($c['nome']) || !empty($c['email'])) {
                        ContatoCliente::create([
                            'cliente_id' => $cliente->id,
                            'nome'       => $c['nome'] ?? '',
                            'email'      => $c['email'] ?? '',
                        ]);
                    }
                }
            }
        });

        return response()->json($cliente->load(['empresas', 'plano', 'contatos', 'transportadoras', 'modulos']));
    }

    /**
     * Remove o cliente apenas se NÃO possuir nenhum vínculo ativo.
     */
    public function destroy(string $id)
    {
        $cliente = Cliente::withCount([
            'empresas',
            'contatos',
            'transportadoras',
            'modulos',
        ])->findOrFail($id);

        $impedimentos = [];

        if ($cliente->empresas_count > 0) {
            $impedimentos[] = "{$cliente->empresas_count} empresa(s)/filial(is)";
        }
        if ($cliente->contatos_count > 0) {
            $impedimentos[] = "{$cliente->contatos_count} contato(s)";
        }
        if ($cliente->transportadoras_count > 0) {
            $impedimentos[] = "{$cliente->transportadoras_count} transportadora(s) homologada(s)";
        }
        if ($cliente->modulos_count > 0) {
            $impedimentos[] = "{$cliente->modulos_count} módulo(s) vinculado(s)";
        }

        if (!empty($impedimentos)) {
            return response()->json([
                'message' => 'Não é permitido excluir este cliente pois existem vínculos ativos: ' . implode(', ', $impedimentos) . '. Remova ou desvincule esses dados antes de excluir.'
            ], 422);
        }

        $cliente->delete();

        return response()->json(['mensagem' => 'Cliente removido com sucesso.']);
    }
}