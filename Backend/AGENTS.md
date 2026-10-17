# Diretrizes de Desenvolvimento do Projeto (Backend & Frontend)

## Autonomia e Tomada de Decisão
- **Modo Proativo**: Você tem total autonomia para criar migrations, models, controllers, requests, seeders e rotas sem pedir confirmação a cada arquivo ou alteração.
- **Não pergunte detalhes triviais**: Decida convenções comuns de mercado (ex: nomenclatura de colunas em snake_case como `client_id`, `data_inicio`, `status`). Pergunte apenas se houver conflito crítico de regra de negócio.
- **Execução Completa**: Ao implementar uma funcionalidade/entidade, entregue o fluxo de ponta a ponta (Migration -> Model Eloquent com $fillable e relationships -> FormRequest de validação -> Controller API -> Rota em routes/api.php).

## Stack e Arquitetura do Backend
- **Framework**: PHP com Laravel (versão atual).
- **Banco de Dados**: Relacional (MySQL / MariaDB).
- **Padrão de Resposta**: API RESTful retornando exclusivamente JSON (`response()->json(...)`).
- **ORM**: Utilize estritamente o Eloquent ORM. Não utilize queries SQL brutas nem PDO nativo manual.
- **Autenticação**: Laravel Sanctum para APIs/SPA.

## Mapeamento de Entidades (baseado nas telas do Frontend)
Consulte os arquivos em `../Frontend/src/screens/` para extrair os campos necessários dos formulários e tabelas:
1. `users`: Autenticação e perfil de acesso.
2. `clients`: Clientes (CNPJ, razão social, contato, etc.).
3. `carriers`: Transportadoras vinculadas às operações.
4. `onboardings`: Implantações (relacionadas a clients e users).
5. `tickets` e `ticket_messages`: Chamados de suporte/atendimento vinculados a clientes.

## Limites e O que NÃO fazer
- NÃO altere a estrutura visual ou lógica dos componentes React em `Frontend/` sem que seja explicitamente solicitado (o foco atual é fornecer a API que eles consomem).
- NÃO crie métodos CRUD manuais com concatenação SQL (sempre usar Eloquent: `create()`, `update()`, `find()`, `paginate()`).
- Mantenha o código limpo, em inglês para termos técnicos de banco/código (ou termos consistentes em português se alinhados às telas), com tratamento básico de validação em `FormRequest`.