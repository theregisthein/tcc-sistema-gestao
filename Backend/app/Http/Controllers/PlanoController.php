<?php

namespace App\Http\Controllers;

use App\Models\Plano;
use Illuminate\Http\Request;

class PlanoController extends Controller
{
    public function index()
    {
        return response()->json(Plano::orderBy('id', 'asc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nome'  => 'required|string|max:100',
            'valor' => 'required|numeric|min:0',
        ]);

        $plano = Plano::create($validated);
        return response()->json($plano, 201);
    }

    public function show($id)
    {
        $plano = Plano::findOrFail($id);
        return response()->json($plano);
    }

    public function update(Request $request, $id)
    {
        $plano = Plano::findOrFail($id);

        $validated = $request->validate([
            'nome'  => 'sometimes|required|string|max:100',
            'valor' => 'sometimes|required|numeric|min:0',
        ]);

        $plano->update($validated);
        return response()->json($plano);
    }

    public function destroy($id)
    {
        $plano = Plano::findOrFail($id);
        $plano->delete();
        return response()->json(null, 204);
    }
}