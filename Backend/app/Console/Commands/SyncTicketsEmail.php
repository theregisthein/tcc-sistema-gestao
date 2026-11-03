<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\EmailConfig;
use App\Models\Ticket;
use App\Models\MensagemTicket;
use App\Models\MensagemDestinatario;
use App\Models\MensagemAnexo;
use App\Models\Cliente;
use App\Models\ContatoCliente;
use App\Models\CanalConfig;
use App\Models\StatusConfig;
use Webklex\PHPIMAP\ClientManager;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Illuminate\Support\Str;

class SyncTicketsEmail extends Command
{
    /**
     * O nome e assinatura do comando de consola.
     *
     * @var string
     */
    protected $signature = 'tickets:sync-email';

    /**
     * A descrição do comando.
     *
     * @var string
     */
    protected $description = 'Sincroniza os e-mails da caixa de suporte e converte-os em tickets';

    public function handle()
    {
        $this->info('A verificar credenciais de e-mail ativas...');

        // 1. Procura configuração ativa na tabela email_config
        $config = EmailConfig::where('ativo', true)->first();

        if (!$config) {
            $this->warn('Nenhuma configuração de e-mail ativa encontrada na tabela email_config.');
            return 0;
        }

        try {
            // 2. Constrói o cliente IMAP dinamicamente com as credenciais do banco
            $cm = new ClientManager();
            $client = $cm->make([
                'host'          => $config->host,
                'port'          => $config->port,
                'encryption'    => $config->encryption,
                'validate_cert' => false,
                'username'      => $config->usuario,
                'password'      => $config->senha,
                'protocol'      => $config->protocolo ?? 'imap'
            ]);

            $client->connect();
            $this->info("Ligação estabelecida com sucesso à caixa: {$config->usuario}");

            $folder = $client->getFolder('INBOX');
            
            // Procura apenas mensagens não lidas
            $messages = $folder->query()->unseen()->get();
            $this->info("Mensagens não lidas encontradas: " . count($messages));

            // Procura canal 'E-mail' e status 'Aberto' padrão
            $canalEmailId = CanalConfig::where('nome', 'like', '%e-mail%')
                ->orWhere('nome', 'like', '%email%')
                ->value('id') ?? 4;

            $statusAbertoId = StatusConfig::where('nome', 'like', '%aberto%')->value('id') ?? 4;

            foreach ($messages as $message) {
                $remetenteEmail = $message->getFrom()[0]->mail ?? null;
                $remetenteNome  = $message->getFrom()[0]->personal ?? $remetenteEmail;

                // Captura do assunto com fallback
                $assuntoRaw = $message->getSubject() ? (string) $message->getSubject() : '(Sem Assunto)';
                
                // Decodifica cabeçalhos MIME (ex: UTF-8, caracteres acentuados)
                $assuntoDecodificado = @iconv_mime_decode($assuntoRaw, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8');
                $assunto = $assuntoDecodificado ?: $assuntoRaw;

                $corpoHtml  = $message->hasHTMLBody() ? $message->getHTMLBody() : null;
                $corpoTexto = $message->hasTextBody() ? $message->getTextBody() : strip_tags($corpoHtml ?? '');
                $messageId  = $message->getMessageId();
                $dataEnvio  = $message->getDate() ? Carbon::parse($message->getDate()->first()) : Carbon::now();

                $this->line("A processar e-mail de: {$remetenteEmail} | Assunto: {$assunto}");

                // 3. Procura o Cliente pelo e-mail do remetente
                $clienteId = null;

                $contato = ContatoCliente::where('email', $remetenteEmail)->first();
                if ($contato) {
                    $clienteId = $contato->cliente_id;
                } else {
                    $cliente = Cliente::where('emailAdm', $remetenteEmail)->first();
                    if ($cliente) {
                        $clienteId = $cliente->id;
                    }
                }

                // Se não encontrar, DEVE FICAR NULL (sem cliente)
                if (!$clienteId) {
                    $this->warn("Remetente {$remetenteEmail} não associado a nenhum cliente cadastrado. Criando sem cliente vinculado.");
                }

                // 4. Verifica se é resposta a um ticket existente via assunto [TICKET #123]
                $ticketExistenteId = null;
                if (preg_match('/\[TICKET\s*#(\d+)\]/i', $assunto, $matches)) {
                    $ticketExistenteId = $matches[1];
                }

                $ticket = null;
                if ($ticketExistenteId) {
                    $ticket = Ticket::find($ticketExistenteId);
                }

                // 5. Se não existir, abre um NOVO Ticket
                if (!$ticket) {
                    $ticket = Ticket::create([
                        'cliente_id'        => $clienteId,
                        'status_id'         => $statusAbertoId,
                        'canal_id'          => $canalEmailId,
                        'categoria_id'      => null,
                        'prioridade_id'     => null,
                        'dataCriacao'       => Carbon::now(),
                        'titulo'            => $assunto,
                        'message_id_header' => $messageId,
                    ]);

                    $this->info("-> Novo Ticket criado com ID #{$ticket->id}");
                } else {
                    $this->info("-> Nova réplica adicionada ao Ticket existente #{$ticket->id}");
                }

                // 6. Grava a Mensagem na tabela mensagem_ticket
                $mensagemTicket = MensagemTicket::create([
                    'ticket_id'   => $ticket->id,
                    'usuario_id'  => null,
                    'assunto'     => $assunto,
                    'corpo_html'  => $corpoHtml,
                    'corpo_texto' => $corpoTexto,
                    'message_id'  => $messageId,
                    'data_envio'  => $dataEnvio,
                ]);

                // 7. Grava Destinatários principais (TO)
                if ($message->getTo()) {
                    foreach ($message->getTo() as $to) {
                        MensagemDestinatario::create([
                            'mensagem_ticket_id' => $mensagemTicket->id,
                            'tipo'               => 'to',
                            'nome'               => $to->personal ?? null,
                            'email'              => $to->mail ?? '',
                        ]);
                    }
                }

                // Grava Destinatários em Cópia (CC)
                if ($message->getCc()) {
                    foreach ($message->getCc() as $cc) {
                        MensagemDestinatario::create([
                            'mensagem_ticket_id' => $mensagemTicket->id,
                            'tipo'               => 'cc',
                            'nome'               => $cc->personal ?? null,
                            'email'              => $cc->mail ?? '',
                        ]);
                    }
                }

                // 8. Descarrega e guarda os Anexos físicos (se houver)
                if ($message->hasAttachments()) {
                    foreach ($message->getAttachments() as $attachment) {
                        $nomeOriginal = $attachment->getName() ?: 'anexo_' . Str::random(8);
                        $extensao     = $attachment->getExtension() ?: pathinfo($nomeOriginal, PATHINFO_EXTENSION);
                        $mimeType     = $attachment->getMimeType() ?: 'application/octet-stream';
                        $tamanhoBytes = $attachment->getSize() ?: 0;
                        $cid          = $attachment->getContentId();

                        $caminhoRelativo = 'anexos_tickets/' . Str::random(40) . ($extensao ? '.' . $extensao : '');
                        Storage::disk('public')->put($caminhoRelativo, $attachment->getContent());

                        MensagemAnexo::create([
                            'mensagem_id'  => $mensagemTicket->id,
                            'nomeOriginal' => $nomeOriginal,
                            'caminho'      => $caminhoRelativo,
                            'mimeType'     => $mimeType,
                            'extensao'     => $extensao,
                            'tamanhoBytes' => $tamanhoBytes,
                            'cid'          => $cid,
                        ]);

                        $this->line("   [Anexo Guardado]: {$nomeOriginal}");
                    }
                }

                // 9. Marca a mensagem como lida na caixa de correio
                $message->setFlag('Seen');
            }

            $this->info('Sincronização de e-mails concluída com sucesso.');

        } catch (\Exception $e) {
            $this->error('Erro durante a sincronização de e-mails: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}