<?php

namespace App\Http\Controllers;

use App\Models\NovaImplantacao;
use App\Models\Checklist;
use App\Models\ChecklistItem;
use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NovaImplantacaoController extends Controller
{
    public function index()
    {
        $implantacoes = NovaImplantacao::with([
            'cliente.empresas',
            'cliente.plano',
            'usuarioResponsavel',
            'usuarios',
            'checklists.itens'
        ])
        ->withCount('checklists')
        ->orderBy('id', 'desc')
        ->get();

        return response()->json($implantacoes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id'      => 'required|integer|exists:cliente,id',
            'responsavel'     => 'nullable|integer|exists:usuario,id',
            'status'          => 'nullable|string|max:1',
            'tempo'           => 'nullable',
            'observacao'      => 'nullable|string|max:1000',
            'usuario_ids'     => 'required|array|min:1',
            'usuario_ids.*'   => 'integer|exists:usuario,id',
            'checklist'       => 'nullable|array',
            'dataAssContrato' => 'nullable|date',
            'dataIniImpl'     => 'nullable|date',
            'dataFinImpl'     => 'nullable|date',
        ]);

        return DB::transaction(function () use ($validated) {
            // Atualiza as datas no cliente caso tenham sido editadas no formulário
            $cliente = Cliente::findOrFail($validated['cliente_id']);
            $dadosDatas = array_filter([
                'dataAssContrato' => $validated['dataAssContrato'] ?? null,
                'dataIniImpl'     => $validated['dataIniImpl'] ?? null,
                'dataFinImpl'     => $validated['dataFinImpl'] ?? null,
            ]);
            if (!empty($dadosDatas)) {
                $cliente->update($dadosDatas);
            }

            $implantacao = NovaImplantacao::create([
                'cliente_id'  => $validated['cliente_id'],
                'responsavel' => $validated['responsavel'] ?? $validated['usuario_ids'][0],
                'status'      => $validated['status'] ?? 'A',
                'tempo'       => $validated['tempo'] ?? null,
                'observacao'  => $validated['observacao'] ?? null,
            ]);

            $implantacao->usuarios()->sync($validated['usuario_ids']);

            // Grava os checklists dinâmicos e seus itens
            if (!empty($validated['checklist'])) {
                foreach ($validated['checklist'] as $faseNome => $tarefas) {
                    $fase = Checklist::create([
                        'implantacao_id' => $implantacao->id,
                        'nome'           => $faseNome,
                    ]);

                    if (is_array($tarefas)) {
                        foreach ($tarefas as $index => $t) {
                            ChecklistItem::create([
                                'checklist_id' => $fase->id,
                                'descricao'    => $t['label'] ?? '',
                                'concluido'    => !empty($t['done']),
                                'ordem'        => $index + 1,
                            ]);
                        }
                    }
                }
            }

            return response()->json(
                $implantacao->load(['cliente.empresas', 'cliente.plano', 'usuarioResponsavel', 'usuarios', 'checklists.itens']),
                201
            );
        });
    }

    public function show(string $id)
    {
        $implantacao = NovaImplantacao::with([
            'cliente.empresas',
            'cliente.plano',
            'usuarioResponsavel',
            'usuarios',
            'checklists.itens'
        ])->findOrFail($id);

        return response()->json($implantacao);
    }

    public function update(Request $request, string $id)
    {
        $implantacao = NovaImplantacao::findOrFail($id);

        $validated = $request->validate([
            'cliente_id'      => 'sometimes|required|integer|exists:cliente,id',
            'responsavel'     => 'nullable|integer|exists:usuario,id',
            'status'          => 'nullable|string|max:1',
            'tempo'           => 'nullable',
            'observacao'      => 'nullable|string|max:1000',
            'usuario_ids'     => 'nullable|array',
            'usuario_ids.*'   => 'integer|exists:usuario,id',
            'phases'          => 'nullable|array',
            'dataAssContrato' => 'nullable|date',
            'dataIniImpl'     => 'nullable|date',
            'dataFinImpl'     => 'nullable|date',
        ]);

        DB::transaction(function () use ($implantacao, $validated) {
            $implantacao->update($validated);

            if (isset($validated['usuario_ids'])) {
                $implantacao->usuarios()->sync($validated['usuario_ids']);
            }

            // Atualiza as datas no registro do cliente
            if ($implantacao->cliente) {
                $datasUpdate = array_filter([
                    'dataAssContrato' => $validated['dataAssContrato'] ?? null,
                    'dataIniImpl'     => $validated['dataIniImpl'] ?? null,
                    'dataFinImpl'     => $validated['dataFinImpl'] ?? null,
                ]);
                if (!empty($datasUpdate)) {
                    $implantacao->cliente->update($datasUpdate);
                }
            }

            // Sincroniza todas as fases e itens dinamicamente
            if (isset($validated['phases'])) {
                // Remove fases antigas que não estejam mais na lista
                $faseIdsRecebidas = array_filter(array_column($validated['phases'], 'id'), 'is_numeric');
                $implantacao->checklists()->whereNotIn('id', $faseIdsRecebidas)->delete();

                foreach ($validated['phases'] as $pData) {
                    $fase = null;
                    if (!empty($pData['id']) && is_numeric($pData['id'])) {
                        $fase = Checklist::find($pData['id']);
                        if ($fase) {
                            $fase->update(['nome' => $pData['name']]);
                        }
                    }

                    if (!$fase) {
                        $fase = Checklist::create([
                            'implantacao_id' => $implantacao->id,
                            'nome'           => $pData['name'],
                        ]);
                    }

                    if (isset($pData['tasks']) && is_array($pData['tasks'])) {
                        $itemIdsRecebidos = array_filter(array_column($pData['tasks'], 'id'), 'is_numeric');
                        $fase->itens()->whereNotIn('id', $itemIdsRecebidos)->delete();

                        foreach ($pData['tasks'] as $idx => $tData) {
                            $item = null;
                            if (!empty($tData['id']) && is_numeric($tData['id'])) {
                                $item = ChecklistItem::find($tData['id']);
                                if ($item) {
                                    $item->update([
                                        'descricao' => $tData['label'],
                                        'concluido' => !empty($tData['done']),
                                        'ordem'     => $idx + 1,
                                    ]);
                                }
                            }

                            if (!$item) {
                                ChecklistItem::create([
                                    'checklist_id' => $fase->id,
                                    'descricao'    => $tData['label'],
                                    'concluido'    => !empty($tData['done']),
                                    'ordem'        => $idx + 1,
                                ]);
                            }
                        }
                    }
                }
            }
        });

        return response()->json(
            $implantacao->load(['cliente.empresas', 'cliente.plano', 'usuarioResponsavel', 'usuarios', 'checklists.itens'])
        );
    }

    public function destroy(string $id)
    {
        $implantacao = NovaImplantacao::findOrFail($id);
        $implantacao->usuarios()->detach();
        $implantacao->checklists()->delete();
        $implantacao->delete();

        return response()->json(['mensagem' => 'Implantação removida com sucesso.']);
    }
}