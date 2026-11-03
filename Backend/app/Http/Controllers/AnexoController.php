<?php

namespace App\Http\Controllers;

use App\Models\Anexo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class AnexoController extends Controller
{
    /**
     * Lista anexos com filtros opcionais por cliente ou implantação.
     */
    public function index(Request $request)
    {
        $query = Anexo::with(['cliente', 'implantacao'])->orderBy('id', 'desc');

        if ($request->filled('cliente_id')) {
            $query->where('cliente_id', $request->cliente_id);
        }

        if ($request->filled('implantacao_id')) {
            $query->where('implantacao_id', $request->implantacao_id);
        }

        return response()->json($query->get());
    }

    /**
     * Faz upload do arquivo físico e grava o registro no banco.
     * Regra: pelo menos um (cliente_id ou implantacao_id) deve estar preenchido.
     */
    public function store(Request $request)
    {
        $request->validate([
            'arquivo'        => 'required|file|max:20480',
            'cliente_id'     => 'nullable|required_without:implantacao_id|exists:cliente,id',
            'implantacao_id' => 'nullable|required_without:cliente_id|exists:nova_implantacao,id',
        ], [
            'arquivo.required'               => 'Selecione um arquivo para enviar.',
            'cliente_id.required_without'     => 'O anexo deve estar vinculado a pelo menos um Cliente ou uma Implantação.',
            'implantacao_id.required_without' => 'O anexo deve estar vinculado a pelo menos um Cliente ou uma Implantação.',
            'cliente_id.exists'              => 'O cliente selecionado não existe.',
            'implantacao_id.exists'          => 'A implantação selecionada não existe.',
        ]);

        $file = $request->file('arquivo');
        $nomeOriginal = $file->getClientOriginalName();
        $tamanhoBytes = $file->getSize();
        $tipoMime = $file->getClientMimeType() ?: $file->getClientOriginalExtension();

        // Salva na pasta storage/app/public/anexos
        $caminho = $file->store('anexos', 'public');

        $anexo = Anexo::create([
            'nome'           => $nomeOriginal,
            'caminho'        => $caminho,
            'tipo'           => $tipoMime,
            'tamanho'        => $tamanhoBytes,
            'dataUpload'     => Carbon::now(),
            'cliente_id'     => $request->filled('cliente_id') ? $request->cliente_id : null,
            'implantacao_id' => $request->filled('implantacao_id') ? $request->implantacao_id : null,
        ]);

        return response()->json([
            'message' => 'Arquivo anexado com sucesso.',
            'anexo'   => $anexo->load(['cliente', 'implantacao']),
        ], 201);
    }

    /**
     * Download do arquivo físico.
     */
    public function download($id)
    {
        $anexo = Anexo::findOrFail($id);

        if (!Storage::disk('public')->exists($anexo->caminho)) {
            return response()->json(['message' => 'Arquivo físico não encontrado no servidor.'], 404);
        }

        return Storage::disk('public')->download($anexo->caminho, $anexo->nome);
    }

    /**
     * Remove o registro e apaga o arquivo físico correspondente.
     */
    public function destroy($id)
    {
        $anexo = Anexo::findOrFail($id);

        if (Storage::disk('public')->exists($anexo->caminho)) {
            Storage::disk('public')->delete($anexo->caminho);
        }

        $anexo->delete();

        return response()->json(['message' => 'Anexo excluído com sucesso.']);
    }
}