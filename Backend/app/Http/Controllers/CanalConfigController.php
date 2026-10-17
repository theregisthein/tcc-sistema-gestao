<?php

namespace App\Http\Controllers;

use App\Models\CanalConfig;
use Illuminate\Http\Request;

class CanalConfigController extends Controller
{
    public function index()
    {
        return response()->json(CanalConfig::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nome' => 'required|string|max:100',
        ]);

        $item = CanalConfig::create($validated);
        return response()->json($item, 201);
    }

    public function show($id)
    {
        $item = CanalConfig::findOrFail($id);
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        $item = CanalConfig::findOrFail($id);
        $validated = $request->validate([
            'nome' => 'required|string|max:100',
        ]);

        $item->update($validated);
        return response()->json($item);
    }

    public function destroy($id)
    {
        $item = CanalConfig::findOrFail($id);
        $item->delete();
        return response()->json(null, 204);
    }
}