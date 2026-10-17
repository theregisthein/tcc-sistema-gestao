<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transportadora;

class TransportadoraController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $transportadoras = Transportadora::orderBy('id', 'desc')->get();
        return response()->json($transportadoras);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nome'   => 'required|string|max:100',
            'cnpj'   => 'required|string|max:20|unique:transportadora,cnpj',
            'email'  => 'nullable|email|max:100',
            'status' => 'nullable|string|max:1',
        ]);

        $transportadora = Transportadora::create($validated);

        return response()->json($transportadora, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $transportadora = Transportadora::findOrFail($id);
        return response()->json($transportadora);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $transportadora = Transportadora::findOrFail($id);

        $validated = $request->validate([
            'nome'   => 'sometimes|required|string|max:100',
            'cnpj'   => 'sometimes|required|string|max:20|unique:transportadora,cnpj,' . $id,
            'email'  => 'nullable|email|max:100',
            'status' => 'nullable|string|max:1',
        ]);

        $transportadora->update($validated);

        return response()->json($transportadora);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $transportadora = Transportadora::findOrFail($id);
        $transportadora->delete();

        return response()->json(['mensagem' => 'Transportadora removida com sucesso.']);
    }
}
