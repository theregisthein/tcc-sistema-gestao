<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ], [
            'email.required'    => 'Informe o e-mail corporativo.',
            'email.email'       => 'Informe um e-mail válido.',
            'password.required' => 'Informe a senha de acesso.',
        ]);

        $usuario = Usuario::where('email', $validated['email'])->first();

        if (!$usuario || !Hash::check($validated['password'], $usuario->senha)) {
            return response()->json([
                'message' => 'Credenciais inválidas. Verifique seu e-mail e senha.'
            ], 401);
        }

        if ($usuario->status !== 'A') {
            return response()->json([
                'message' => 'Usuário inativo. Entre em contato com o administrador do sistema.'
            ], 403);
        }

        $token = method_exists($usuario, 'createToken')
            ? $usuario->createToken('auth_token')->plainTextToken
            : null;

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'token'   => $token,
            'user'    => [
                'id'    => $usuario->id,
                'nome'  => $usuario->nome,
                'email' => $usuario->email,
                'setor' => $usuario->setor,
            ],
        ], 200);
    }

    /**
     * Gera token e prepara a recuperação de senha.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ], [
            'email.required' => 'Informe o seu e-mail corporativo.',
            'email.email'    => 'Informe um e-mail válido.',
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario) {
            return response()->json([
                'message' => 'Não encontramos nenhuma conta vinculada a este endereço de e-mail.'
            ], 404);
        }

        // Gera token aleatório de 64 caracteres
        $token = Str::random(64);

        // Limpa tokens antigos desse e-mail e insere o novo na tabela nativa password_reset_tokens
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();
        DB::table('password_reset_tokens')->insert([
            'email'      => $request->email,
            'token'      => Hash::make($token),
            'created_at' => Carbon::now(),
        ]);

        return response()->json([
            'message'    => 'Link de redefinição de senha gerado com sucesso.',
            'reset_token'=> $token, // Disponível para validação rápida em ambiente local
        ], 200);
    }

    /**
     * Aplica a nova senha utilizando o token gerado.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'token'    => 'required|string',
            'password' => 'required|string|min:6',
        ], [
            'password.min' => 'A nova senha deve ter no mínimo 6 caracteres.',
        ]);

        $registro = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$registro) {
            return response()->json(['message' => 'Solicitação de recuperação inválida ou inexistente.'], 400);
        }

        // Valida expiração de 30 minutos
        if (Carbon::parse($registro->created_at)->addMinutes(30)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['message' => 'O link de recuperação expirou. Solicite um novo.'], 400);
        }

        if (!Hash::check($request->token, $registro->token)) {
            return response()->json(['message' => 'Token de redefinição inválido.'], 400);
        }

        // Atualiza a nova senha na tabela usuario com hash Bcrypt
        Usuario::where('email', $request->email)->update([
            'senha' => Hash::make($request->password)
        ]);

        // Remove o token utilizado
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Senha redefinida com sucesso! Você já pode fazer login.']);
    }

    public function logout(Request $request)
    {
        return response()->json(['message' => 'Logout realizado com sucesso.'], 200);
    }
}