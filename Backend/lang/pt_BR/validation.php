<?php

return [
    'accepted'             => 'O campo :attribute deve ser aceite.',
    'active_url'           => 'O campo :attribute não é um URL válido.',
    'after'                => 'O campo :attribute deve ser uma data posterior a :date.',
    'alpha'                => 'O campo :attribute só pode conter letras.',
    'alpha_dash'           => 'O campo :attribute só pode conter letras, números e traços.',
    'alpha_num'            => 'O campo :attribute só pode conter letras e números.',
    'array'                => 'O campo :attribute deve ser uma lista/array.',
    'between'              => [
        'numeric' => 'O campo :attribute deve estar entre :min e :max.',
        'file'    => 'O ficheiro :attribute deve ter entre :min e :max kilobytes.',
        'string'  => 'O campo :attribute deve ter entre :min e :max carateres.',
        'array'   => 'O campo :attribute deve ter entre :min e :max itens.',
    ],
    'boolean'              => 'O campo :attribute deve ser verdadeiro ou falso.',
    'confirmed'            => 'A confirmação do campo :attribute não coincide.',
    'date'                 => 'O campo :attribute não é uma data válida.',
    'email'                => 'O campo :attribute deve ser um endereço de e-mail válido.',
    'exists'               => 'O campo :attribute selecionado é inválido.',
    'integer'              => 'O campo :attribute deve ser um número inteiro.',
    'max'                  => [
        'numeric' => 'O campo :attribute não pode ser superior a :max.',
        'file'    => 'O ficheiro :attribute não pode ter mais de :max kilobytes.',
        'string'  => 'O campo :attribute não pode ter mais de :max carateres.',
        'array'   => 'O campo :attribute não pode ter mais de :max itens.',
    ],
    'min'                  => [
        'numeric' => 'O campo :attribute deve ser pelo menos :min.',
        'file'    => 'O ficheiro :attribute deve ter pelo menos :min kilobytes.',
        'string'  => 'O campo :attribute deve ter pelo menos :min carateres.',
        'array'   => 'O campo :attribute deve ter pelo menos :min itens.',
    ],
    'numeric'              => 'O campo :attribute deve ser um número.',
    'required'             => 'O campo :attribute é obrigatório.',
    'string'               => 'O campo :attribute deve ser um texto.',
    'unique'               => 'O valor informado para o campo :attribute já está em uso.',

    /*
    |--------------------------------------------------------------------------
    | Atributos Personalizados
    |--------------------------------------------------------------------------
    | Substitui os nomes dos campos técnicos pelos nomes legíveis para o utilizador
    */
    'attributes' => [
        'nome'        => 'Nome / Razão Social',
        'cnpj'        => 'CNPJ',
        'email'       => 'E-mail',
        'status'      => 'Status',
        'senha'       => 'Senha',
        'telefone'    => 'Telefone',
        'descricao'   => 'Descrição',
        'plano_id'    => 'Plano',
        'cliente_id'  => 'Cliente',
        'responsavel' => 'Responsável',
    ],
];