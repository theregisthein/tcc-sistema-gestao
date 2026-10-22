<?php

namespace App\Http\Controllers;

use App\Models\Checklist;
use App\Models\ChecklistItem;
use Illuminate\Http\Request;

class ChecklistController extends Controller
{
    /**
     * Alterna o status de concluído de um item
     */
    public function toggleItem(string $id)
    {
        $item = ChecklistItem::findOrFail($id);
        $item->concluido = !$item->concluido;
        $item->save();

        return response()->json($item);
    }

    /**
     * Adiciona um novo item a uma fase existente
     */
    public function addItem(Request $request, string $checklistId)
    {
        $validated = $request->validate([
            'descricao' => 'required|string|max:500',
        ]);

        $checklist = Checklist::findOrFail($checklistId);
        $proximaOrdem = $checklist->itens()->count() + 1;

        $item = ChecklistItem::create([
            'checklist_id' => $checklist->id,
            'descricao'    => $validated['descricao'],
            'concluido'    => false,
            'ordem'        => $proximaOrdem,
        ]);

        return response()->json($item, 201);
    }

    /**
     * Remove um item do checklist
     */
    public function destroyItem(string $id)
    {
        $item = ChecklistItem::findOrFail($id);
        $item->delete();

        return response()->json(['mensagem' => 'Item removido com sucesso.']);
    }
}