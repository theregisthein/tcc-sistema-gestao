<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    /**
     * Listagem de usuários
     */
    public function index()
    {
        $usuarios = Usuario::orderBy('id', 'desc')->get();
        return response()->json($usuarios);
    }

    /**
     * Cadastro de novo usuário
     */
    public function store(Request $request)
    {
        // Higieniza o CPF para gravar apenas números
        $cpfLimpo = preg_replace('/\D/', '', (string) $request->input('cpf'));
        $request->merge(['cpf' => $cpfLimpo]);

        $validated = $request->validate([
            'nome'   => 'required|string|max:100',
            'cpf'    => 'required|string|size:11|unique:usuario,cpf',
            'setor'  => 'required|string|max:100',
            'email'  => 'required|email|max:100|unique:usuario,email',
            'senha'  => 'required|string|min:6|max:100',
            'status' => 'nullable|string|size:1',
        ], [
            'nome.required'  => 'O Nome é obrigatório.',
            'cpf.required'   => 'O CPF é obrigatório.',
            'cpf.size'       => 'O CPF deve ter exatamente 11 dígitos numéricos.',
            'cpf.unique'     => 'Já existe um usuário cadastrado com este CPF.',
            'setor.required' => 'O Setor é obrigatório.',
            'email.required' => 'O E-mail é obrigatório.',
            'email.email'    => 'Informe um endereço de e-mail válido.',
            'email.unique'   => 'Já existe um usuário cadastrado com este e-mail.',
            'senha.required' => 'A senha é obrigatória.',
            'senha.min'      => 'A senha deve conter no mínimo 6 caracteres.',
        ]);

        $usuario = Usuario::create([
            'nome'   => $validated['nome'],
            'cpf'    => $validated['cpf'],
            'setor'  => $validated['setor'],
            'email'  => $validated['email'],
            'senha'  => $validated['senha'], // O cast 'hashed' do Model faz o hash automaticamente
            'status' => $validated['status'] ?? 'A',
        ]);

        return response()->json($usuario, 201);
    }

    /**
     * Visualização de um usuário
     */
    public function show(string $id)
    {
        $usuario = Usuario::findOrFail($id);
        return response()->json($usuario);
    }

    /**
     * Atualização de usuário
     */
    public function update(Request $request, string $id)
    {
        $usuario = Usuario::findOrFail($id);

        if ($request->has('cpf')) {
            $request->merge(['cpf' => preg_replace('/\D/', '', (string) $request->input('cpf'))]);
        }

        $validated = $request->validate([
            'nome'   => 'sometimes|required|string|max:100',
            'cpf'    => 'sometimes|required|string|size:11|unique:usuario,cpf,' . $id,
            'setor'  => 'sometimes|required|string|max:100',
            'email'  => 'sometimes|required|email|max:100|unique:usuario,email,' . $id,
            'senha'  => 'nullable|string|min:6|max:100',
            'status' => 'nullable|string|size:1',
        ], [
            'cpf.size'     => 'O CPF deve ter exatamente 11 dígitos numéricos.',
            'cpf.unique'   => 'Já existe um usuário cadastrado com este CPF.',
            'email.unique' => 'Já existe um usuário cadastrado com este e-mail.',
            'senha.min'    => 'A senha deve conter no mínimo 6 caracteres.',
        ]);

        // Se a senha não foi informada na atualização, mantém a atual
        if (empty($validated['senha'])) {
            unset($validated['senha']);
        }

        $usuario->update($validated);

        return response()->json($usuario);
    }

    /**
     * Exclusão com bloqueio caso haja histórico/vínculos
     */
    public function destroy(string $id)
    {
        $usuario = Usuario::findOrFail($id);

        $bloqueios = [];

        if (method_exists($usuario, 'tickets') && $usuario->tickets()->exists()) {
            $bloqueios[] = 'tickets associados';
        }

        if (method_exists($usuario, 'implantacoes') && $usuario->implantacoes()->exists()) {
            $bloqueios[] = 'implantações como participante';
        }

        if (method_exists($usuario, 'implantacoesComoResponsavel') && $usuario->implantacoesComoResponsavel()->exists()) {
            $bloqueios[] = 'implantações sob sua responsabilidade';
        }

        if (!empty($bloqueios)) {
            return response()->json([
                'message' => 'Não é permitido excluir o usuário pois existem ' . implode(', ', $bloqueios) . '. Em vez de excluir, altere o status para Inativo.'
            ], 422);
        }

        $usuario->delete();

        return response()->json(['mensagem' => 'Usuário removido com sucesso.']);
    }
}