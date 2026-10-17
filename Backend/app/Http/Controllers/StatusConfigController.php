<?php

namespace App\Http\Controllers;

use App\Models\StatusConfig;
use Illuminate\Http\Request;

class StatusConfigController extends Controller
{
    public function index()
    {
        return response()->json(StatusConfig::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nome' => 'required|string|max:100',
        ]);

        $item = StatusConfig::create($validated);
        return response()->json($item, 201);
    }

    public function show($id)
    {
        $item = StatusConfig::findOrFail($id);
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        $item = StatusConfig::findOrFail($id);
        $validated = $request->validate([
            'nome' => 'required|string|max:100',
        ]);

        $item->update($validated);
        return response()->json($item);
    }

    public function destroy($id)
    {
        $item = StatusConfig::findOrFail($id);
        $item->delete();
        return response()->json(null, 204);
    }
}
