<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\MensagemTicket;
use App\Models\MensagemDestinatario;
use App\Models\MensagemAnexo;
use App\Models\StatusConfig;
use App\Models\PrioridadeConfig;
use App\Models\CategoriaConfig;
use App\Models\CanalConfig;
use App\Models\Cliente;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class TicketController extends Controller
{
    /**
     * Listagem de tickets com paginação e relacionamentos essenciais.
     */
    public function index(Request $request)
    {
        $query = Ticket::with(['cliente', 'status', 'prioridade', 'categoria', 'canal', 'usuarios']);

        if ($request->filled('status_id')) {
            $query->where('status_id', $request->status_id);
        }

        if ($request->filled('cliente_id')) {
            $query->where('cliente_id', $request->cliente_id);
        }

        if ($request->filled('prioridade_id')) {
            $query->where('prioridade_id', $request->prioridade_id);
        }

        if ($request->filled('termo')) {
            $termo = $request->termo;
            $query->where(function ($q) use ($termo) {
                $q->where('titulo', 'like', "%{$termo}%")
                  ->orWhere('id', 'like', "%{$termo}%");
            });
        }

        $tickets = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($tickets);
    }

    /**
     * Retorna listas auxiliares para preenchimento de filtros e selects no React.
     */
    public function auxiliares()
    {
        return response()->json([
            'clientes'     => Cliente::select('id', 'nomeFantasia')->get(),
            'status'       => StatusConfig::select('id', 'nome')->get(),
            'prioridades'  => PrioridadeConfig::select('id', 'nome', 'prazo')->get(),
            'categorias'   => CategoriaConfig::select('id', 'nome')->get(),
            'canais'       => CanalConfig::select('id', 'nome')->get(),
            'usuarios'     => Usuario::select('id', 'nome', 'setor')->get(),
        ]);
    }

    /**
     * Detalhes de um chamado com toda a linha do tempo de mensagens e anexos.
     */
    public function show($id)
    {
        $ticket = Ticket::with([
            'cliente.plano',
            'status',
            'prioridade',
            'categoria',
            'canal',
            'usuarios',
            'mensagens.usuario',
            'mensagens.destinatarios',
            'mensagens.anexos',
        ])->findOrFail($id);

        return response()->json($ticket);
    }

    /**
     * Abertura manual de um ticket pelo sistema.
     */
    public function store(Request $request)
    {
        $request->validate([
            'cliente_id'    => 'nullable|exists:cliente,id',
            'titulo'        => 'required|string|max:500',
            'mensagem'      => 'required|string',
            'status_id'     => 'nullable|exists:status_config,id',
            'prioridade_id' => 'nullable|exists:prioridade_config,id',
            'categoria_id'  => 'nullable|exists:categoria_config,id',
            'canal_id'      => 'nullable|exists:canal_config,id',
            'usuarios'      => 'nullable|array',
            'anexos.*'      => 'nullable|file|max:15360',
        ]);

        return DB::transaction(function () use ($request) {
            $ticket = Ticket::create([
                'cliente_id'    => $request->cliente_id,
                'status_id'     => $request->status_id ?? StatusConfig::where('nome', 'like', '%aberto%')->value('id') ?? 4,
                'prioridade_id' => $request->prioridade_id,
                'categoria_id'  => $request->categoria_id,
                'canal_id'      => $request->canal_id ?? CanalConfig::where('nome', 'like', '%sistema%')->value('id'),
                'titulo'        => $request->titulo,
                'dataCriacao'   => Carbon::now(),
                'anotacao'      => $request->anotacao,
            ]);

            if ($request->has('usuarios')) {
                $ticket->usuarios()->sync($request->usuarios);
            }

            $usuarioId = auth()->id() ?? $request->usuario_id ?? 1;

            $mensagem = MensagemTicket::create([
                'ticket_id'   => $ticket->id,
                'usuario_id'  => $usuarioId,
                'assunto'     => '[TICKET #' . $ticket->id . '] ' . $request->titulo,
                'corpo_html'  => nl2br(e($request->mensagem)),
                'corpo_texto' => $request->mensagem,
                'eh_interna'  => false,
                'data_envio'  => Carbon::now(),
            ]);

            $anexosParaEmail = [];
            if ($request->hasFile('anexos')) {
                foreach ($request->file('anexos') as $file) {
                    $caminho = $file->store('anexos_tickets', 'public');

                    MensagemAnexo::create([
                        'mensagem_id'  => $mensagem->id,
                        'nomeOriginal' => $file->getClientOriginalName(),
                        'caminho'      => $caminho,
                        'mimeType'     => $file->getClientMimeType(),
                        'extensao'     => $file->getClientOriginalExtension(),
                        'tamanhoBytes' => $file->getSize(),
                    ]);

                    $anexosParaEmail[] = storage_path('app/public/' . $caminho);
                }
            }

            // Descobre o destinatário do cliente cadastrado
            $destinatarioEmail = null;
            if ($ticket->cliente_id) {
                $cliente = Cliente::with('contatos')->find($ticket->cliente_id);
                if ($cliente) {
                    $destinatarioEmail = $cliente->emailAdm ?? $cliente->contatos->first()?->email;
                }
            }

            // Dispara e-mail de abertura para o cliente
            if ($destinatarioEmail && filter_var($destinatarioEmail, FILTER_VALIDATE_EMAIL)) {
                try {
                    $assuntoEmail = '[TICKET #' . $ticket->id . '] ' . $ticket->titulo;
                    $corpoTexto   = $request->mensagem;

                    Mail::raw($corpoTexto, function ($mail) use ($destinatarioEmail, $assuntoEmail, $anexosParaEmail) {
                        $mail->to($destinatarioEmail)
                             ->subject($assuntoEmail);

                        foreach ($anexosParaEmail as $pathArquivo) {
                            if (file_exists($pathArquivo)) {
                                $mail->attach($pathArquivo);
                            }
                        }
                    });

                    Log::info("E-mail de abertura do Ticket #{$ticket->id} enviado com sucesso para: {$destinatarioEmail}");
                } catch (\Exception $e) {
                    Log::error('Erro no envio SMTP ao criar Ticket #' . $ticket->id . ': ' . $e->getMessage());
                }
            }

            return response()->json($ticket->load(['cliente.plano', 'status', 'mensagens.anexos']), 201);
        });
    }

    /**
     * Atualização de status, prioridade, cliente ou analistas do ticket.
     */
    public function update(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);

        $request->validate([
            'cliente_id'     => 'nullable',
            'status_id'      => 'nullable|exists:status_config,id',
            'prioridade_id'  => 'nullable|exists:prioridade_config,id',
            'categoria_id'   => 'nullable|exists:categoria_config,id',
            'canal_id'       => 'nullable|exists:canal_config,id',
            'anotacao'       => 'nullable|string',
            'dataFinalizado' => 'nullable|date',
            'usuarios'       => 'nullable|array',
        ]);

        $dados = $request->only([
            'cliente_id',
            'status_id',
            'prioridade_id',
            'categoria_id',
            'canal_id',
            'anotacao',
            'dataFinalizado'
        ]);

        if (array_key_exists('cliente_id', $dados)) {
            $dados['cliente_id'] = (!empty($dados['cliente_id']) && $dados['cliente_id'] > 0)
                ? (int) $dados['cliente_id']
                : null;
        }

        $ticket->update($dados);

        if ($request->has('usuarios')) {
            $ticket->usuarios()->sync($request->usuarios);
        }

        return response()->json($ticket->load(['cliente.plano', 'status', 'prioridade', 'categoria', 'canal', 'usuarios']));
    }

    /**
     * Resposta de um analista/atendente dentro do ticket ou inclusão de nota interna.
     */
    public function responder(Request $request, $id)
    {
        $ticket = Ticket::with(['cliente.contatos', 'mensagens.destinatarios'])->findOrFail($id);

        $request->validate([
            'mensagem'   => 'required|string',
            'eh_interna' => 'nullable|boolean',
            'anexos.*'   => 'nullable|file|max:15360',
        ]);

        return DB::transaction(function () use ($request, $ticket) {
            $usuarioId = auth()->id() ?? $request->usuario_id ?? 1;
            $ehInterna = filter_var($request->input('eh_interna', false), FILTER_VALIDATE_BOOLEAN);

            $assuntoLimpo = preg_replace('/^(Re:\s*|\[TICKET\s*#\d+\]\s*|\[NOTA INTERNA\]\s*)*/i', '', $ticket->titulo);
            $prefixoAssunto = $ehInterna ? '[NOTA INTERNA] ' : 'Re: [TICKET #' . $ticket->id . '] ';

            // 1. Grava a mensagem na tabela mensagem_ticket
            $mensagem = MensagemTicket::create([
                'ticket_id'   => $ticket->id,
                'usuario_id'  => $usuarioId,
                'assunto'     => $prefixoAssunto . $assuntoLimpo,
                'corpo_html'  => nl2br(e($request->mensagem)),
                'corpo_texto' => $request->mensagem,
                'eh_interna'  => $ehInterna, // <-- Persiste 1 ou 0 explicitamente - ALTERADO PARA SALVAR A INFORMACAO NO BANCO E NAO APENAS NOCONTROLLER/FRONT
                'data_envio'  => Carbon::now(),
            ]);

            // 2. Salva anexos físicos enviados pelo atendente
            $anexosParaEmail = [];
            if ($request->hasFile('anexos')) {
                foreach ($request->file('anexos') as $file) {
                    $caminho = $file->store('anexos_tickets', 'public');

                    MensagemAnexo::create([
                        'mensagem_id'  => $mensagem->id,
                        'nomeOriginal' => $file->getClientOriginalName(),
                        'caminho'      => $caminho,
                        'mimeType'     => $file->getClientMimeType(),
                        'extensao'     => $file->getClientOriginalExtension(),
                        'tamanhoBytes' => $file->getSize(),
                    ]);

                    $anexosParaEmail[] = storage_path('app/public/' . $caminho);
                }
            }

            // 3. Se for NOTA INTERNA, encerra o fluxo sem disparar e-mail SMTP
            if ($ehInterna) {
                Log::info("Nota interna registrada no Ticket #{$ticket->id} pelo usuário #{$usuarioId}. Nenhum e-mail disparado.");
                return response()->json($mensagem->load(['usuario', 'anexos', 'destinatarios']), 201);
            }

            // 4. Descobre o e-mail de destino para envio externo
            $destinatarioEmail = null;
            $copiasEmails = [];

            $primeiraMsg = $ticket->mensagens()->whereNull('usuario_id')->oldest()->first();
            if ($primeiraMsg) {
                $fromDest = $primeiraMsg->destinatarios()->where('tipo', 'from')->first();
                if ($fromDest && filter_var($fromDest->email, FILTER_VALIDATE_EMAIL)) {
                    $destinatarioEmail = $fromDest->email;
                }

                foreach ($primeiraMsg->destinatarios()->where('tipo', 'cc')->get() as $cc) {
                    if (filter_var($cc->email, FILTER_VALIDATE_EMAIL) && !str_contains(strtolower($cc->email), 'tcc2026testetcc')) {
                        $copiasEmails[] = $cc->email;
                    }
                }
            }

            if (!$destinatarioEmail && $ticket->cliente) {
                $destinatarioEmail = $ticket->cliente->emailAdm 
                    ?? $ticket->cliente->contatos()->first()?->email;
            }

            if (!$destinatarioEmail) {
                $destinatarioEmail = 'rinaldiregisthein@gmail.com';
            }

            // 5. Dispara envio de e-mail via SMTP
            if ($destinatarioEmail) {
                try {
                    $assuntoEmail = 'Re: [TICKET #' . $ticket->id . '] ' . $assuntoLimpo;
                    $corpoTexto = $request->mensagem;
                    $messageIdHeader = $ticket->message_id_header;

                    Mail::raw($corpoTexto, function ($mail) use ($destinatarioEmail, $copiasEmails, $assuntoEmail, $anexosParaEmail, $messageIdHeader) {
                        $mail->to($destinatarioEmail)
                             ->subject($assuntoEmail);

                        if (!empty($copiasEmails)) {
                            $mail->cc($copiasEmails);
                        }

                        if ($messageIdHeader) {
                            $mail->getHeaders()->addTextHeader('In-Reply-To', $messageIdHeader);
                            $mail->getHeaders()->addTextHeader('References', $messageIdHeader);
                        }

                        foreach ($anexosParaEmail as $pathArquivo) {
                            if (file_exists($pathArquivo)) {
                                $mail->attach($pathArquivo);
                            }
                        }
                    });

                    Log::info("E-mail de resposta do Ticket #{$ticket->id} enviado com sucesso para: {$destinatarioEmail}");
                } catch (\Exception $e) {
                    Log::error('Erro no envio SMTP de resposta do Ticket #' . $ticket->id . ': ' . $e->getMessage());
                }
            }

            return response()->json($mensagem->load(['usuario', 'anexos', 'destinatarios']), 201);
        });
    }
}