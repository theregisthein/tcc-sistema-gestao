<?php

namespace App\Http\Controllers;

use App\Models\PrioridadeConfig;
use Illuminate\Http\Request;

class PrioridadeConfigController extends Controller
{
    public function index()
    {
        return response()->json(PrioridadeConfig::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nome' => 'required|string|max:100',
            'prazo' => 'required|string|max:100',
        ]);

        $item = PrioridadeConfig::create($validated);
        return response()->json($item, 201);
    }

    public function show($id)
    {
        $item = PrioridadeConfig::findOrFail($id);
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        $item = PrioridadeConfig::findOrFail($id);
        $validated = $request->validate([
            'nome' => 'sometimes|string|max:100',
            'prazo' => 'sometimes|string|max:100',
        ]);

        $item->update($validated);
        return response()->json($item);
    }

    public function destroy($id)
    {
        $item = PrioridadeConfig::findOrFail($id);
        $item->delete();
        return response()->json(null, 204);
    }
}
