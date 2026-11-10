<?php

namespace App\Http\Controllers;

use App\Models\EmailConfig;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class EmailConfigController extends Controller
{
    /**
     * Retorna a configuração atual para preencher o formulário.
     */
    public function show()
    {
        $config = EmailConfig::first();

        if (!$config) {
            return response()->json([
                'usuario' => '',
                'ativo'   => false,
            ]);
        }

        return response()->json([
            'id'      => $config->id,
            'usuario' => $config->usuario,
            'ativo'   => (bool) $config->ativo,
            'host'    => $config->host,
            'port'    => $config->port,
        ]);
    }

    /**
     * Alterna o status da sincronização e roda o sync imediatamente se for ativado.
     */
    public function toggle(Request $request)
    {
        $config = EmailConfig::first();

        if (!$config) {
            return response()->json(['message' => 'Configuração de e-mail não encontrada.'], 404);
        }

        $novoStatus =$request->has('ativo') ? $request->boolean('ativo') : !$config->ativo;
        $config->ativo =$novoStatus;
        $config->save();

        $executou = false;
        if ($novoStatus) {
            try {
                Artisan::call('tickets:sync-email');
                $executou = true;
            } catch (\Throwable $e) {
                Log::error('Erro ao rodar sync-email no toggle: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message'  => $novoStatus ? 'Sincronização ativada e executada!' : 'Sincronização pausada.',
            'ativo'    => (bool) $config->ativo,
            'executou' => $executou,
        ]);
    }

    /**
     * Atualiza os dados de ingestão de e-mails.
     * Exige a senha de acesso do usuário atual para confirmar a troca.
     */
    public function update(Request $request)
    {
        $validated =$request->validate([
            'usuario'       => 'required|email',
            'ativo'         => 'required|boolean',
            'senha_admin'   => 'required|string',
            'senha_app'     => 'nullable|string',
            'user_id'       => 'required|integer',
        ], [
            'usuario.required'     => 'O e-mail monitorado é obrigatório.',
            'usuario.email'        => 'Informe um e-mail válido.',
            'senha_admin.required' => 'Informe sua senha de usuário para autorizar a alteração.',
        ]);

        $admin = Usuario::findOrFail($validated['user_id']);

        if (!Hash::check($validated['senha_admin'],$admin->senha)) {
            return response()->json([
                'message' => 'Senha de confirmação incorreta. A alteração não foi salva.'
            ], 422);
        }

        $config = EmailConfig::firstOrNew([]);

        $config->usuario =$validated['usuario'];
        $config->ativo   =$validated['ativo'];

        if (!empty($validated['senha_app'])) {
            $config->senha = str_replace(' ', '',$validated['senha_app']);
        }

        if (!$config->exists) {
            $config->host       = 'imap.gmail.com';$config->port       = 993;
            $config->encryption = 'ssl';$config->protocolo  = 'imap';
        }

        $config->save();

        return response()->json([
            'message' => 'Configuração de e-mail atualizada com sucesso!',
            'usuario' => $config->usuario,
            'ativo'   => (bool) $config->ativo,
        ]);
    }
}