<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cliente;
use App\Models\Transportadora;
use Illuminate\Support\Facades\DB;

class RelatorioController extends Controller
{
    /**
     * Retorna a lista de clientes e transportadoras para os seletores (autocomplete).
     */
    public function auxiliares()
    {
        $clientes = Cliente::select('id', 'nomeFantasia', 'emailAdm', 'status', 'plano_id', 'valorContaFrete')
            ->with(['plano:id,nome'])
            ->withCount('transportadoras')
            ->orderBy('nomeFantasia')
            ->get()
            ->map(function ($c) {
                return [
                    'id'           => $c->id,
                    'nomeFantasia' => $c->nomeFantasia,
                    'razaoSocial'  => $c->nomeFantasia,
                    'cnpj'         => $c->cnpj ?? 'Não informado',
                    'status'       => $c->status === 'A' ? 'Ativo' : 'Inativo',
                    'plano'        => $c->plano?->nome ?? 'Starter',
                    'contaFrete'   => 'R$ ' . number_format($c->valorContaFrete ?? 0, 2, ',', '.'),
                    'totalTransp'  => $c->transportadoras_count,
                ];
            });

        $transportadoras = Transportadora::select('id', 'nome', 'cnpj', 'email', 'status')
            ->withCount('clientes')
            ->orderBy('nome')
            ->get()
            ->map(function ($t) {
                return [
                    'id'           => $t->id,
                    'nome'         => $t->nome,
                    'cnpj'         => $t->cnpj,
                    'email'        => $t->email,
                    'ativo'        => $t->status === 'A',
                    'modalidade'   => 'Rodoviário Padrão',
                    'totalClientes'=> $t->clientes_count,
                ];
            });

        return response()->json([
            'clientes'        => $clientes,
            'transportadoras' => $transportadoras,
        ]);
    }

    /**
     * Consulta os vínculos reais:
     * - mode=carrier & id=X: retorna os clientes da transportadora X
     * - mode=client  & id=X: retorna as transportadoras do cliente X
     */
    public function vinculos(Request $request)
    {
        $request->validate([
            'mode' => 'required|in:carrier,client',
            'id'   => 'required|integer',
        ]);

        $mode = $request->query('mode');
        $id = $request->query('id');

        if ($mode === 'carrier') {
            $transportadora = Transportadora::findOrFail($id);

            // Se você tiver a relação many-to-many configurada no Model:
            // return $this->belongsToMany(Cliente::class, 'cliente_transportadora');
            $clientes = $transportadora->clientes()
                ->with(['plano:id,nome', 'contatos'])
                ->get()
                ->map(function ($c) {
                    $contato = $c->contatos->first();
                    return [
                        'id'           => $c->id,
                        'nomeFantasia' => $c->nomeFantasia,
                        'razaoSocial'  => $c->nomeFantasia,
                        'cnpj'         => $c->cnpj ?? '—',
                        'cidade'       => $c->cidade ?? 'Flores da Cunha',
                        'uf'           => $c->uf ?? 'RS',
                        'status'       => $c->status === 'A' ? 'Ativo' : 'Inativo',
                        'plano'        => $c->plano?->nome ?? 'Starter',
                        'contaFrete'   => 'R$ ' . number_format($c->valorContaFrete ?? 0, 2, ',', '.'),
                        'dominio'      => $c->dominio,
                        'contatos'     => [
                            [
                                'nome'  => $contato?->nome ?? 'Responsável Logística',
                                'email' => $contato?->email ?? $c->emailAdm ?? 'contato@empresa.com.br',
                            ]
                        ],
                    ];
                });

            return response()->json([
                'target'  => [
                    'id'         => $transportadora->id,
                    'nome'       => $transportadora->nome,
                    'cnpj'       => $transportadora->cnpj,
                    'ativo'      => $transportadora->status === 'A',
                    'modalidade' => 'Rodoviário Padrão',
                    'contato'    => $transportadora->email,
                ],
                'results' => $clientes,
            ]);
        }

        // Modo 'client': busca transportadoras do cliente
        $cliente = Cliente::with('plano:id,nome')->findOrFail($id);

        $transportadoras = $cliente->transportadoras()
            ->get()
            ->map(function ($t) {
                return [
                    'id'         => $t->id,
                    'nome'       => $t->nome,
                    'cnpj'       => $t->cnpj,
                    'ativo'      => $t->status === 'A',
                    'modalidade' => 'Rodoviário Padrão',
                    'contato'    => $t->email,
                    'telefone'   => '—',
                ];
            });

        return response()->json([
            'target'  => [
                'id'           => $cliente->id,
                'nomeFantasia' => $cliente->nomeFantasia,
                'razaoSocial'  => $cliente->nomeFantasia,
                'cnpj'         => $cliente->cnpj ?? '—',
                'status'       => $cliente->status === 'A' ? 'Ativo' : 'Inativo',
                'plano'        => $cliente->plano?->nome ?? 'Starter',
                'cidade'       => $cliente->cidade ?? 'Flores da Cunha',
                'uf'           => $cliente->uf ?? 'RS',
                'contaFrete'   => 'R$ ' . number_format($cliente->valorContaFrete ?? 0, 2, ',', '.'),
            ],
            'results' => $transportadoras,
        ]);
    }
}