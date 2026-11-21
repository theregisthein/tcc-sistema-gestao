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
    protected $signature = 'tickets:sync-email {--all : Busca também e-mails já lidos recentes para teste}';
    protected $description = 'Sincroniza os e-mails da caixa de suporte e converte-os em tickets';

    public function handle()
    {
        $this->info('A verificar credenciais de e-mail ativas...');

        $config = EmailConfig::where('ativo', true)->first();

        if (!$config) {
            $this->warn('Nenhuma configuração de e-mail ativa encontrada na tabela email_config.');
            return 0;
        }

        try {
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

            $query = $folder->query();
            $messages = $this->option('all')
                ? $query->all()->limit(5)->get()
                : $query->unseen()->get();

            $this->info("Mensagens encontradas: " . count($messages));

            $canalEmailId = CanalConfig::where('nome', 'like', '%e-mail%')
                ->orWhere('nome', 'like', '%email%')
                ->value('id') ?? 4;

            $statusAbertoId = StatusConfig::where('nome', 'like', '%aberto%')->value('id') ?? 4;

            foreach ($messages as $message) {
                try {
                    $fromAttr = $message->getFrom();
                    $remetenteEmail = $fromAttr[0]->mail ?? null;
                    $remetenteNome  = $fromAttr[0]->personal ?? $remetenteEmail;

                    if (!$remetenteEmail) {
                        $this->warn('E-mail sem remetente identificável ignorado.');
                        continue;
                    }

                    $assuntoRaw = $message->getSubject() ? (string) $message->getSubject() : '(Sem Assunto)';
                    $assuntoDecodificado = @iconv_mime_decode($assuntoRaw, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8');
                    $assunto = Str::limit($assuntoDecodificado ?: $assuntoRaw, 250, '');

                    $corpoHtml  = $message->hasHTMLBody() ? $message->getHTMLBody() : null;
                    $corpoTexto = $message->hasTextBody() ? $message->getTextBody() : strip_tags($corpoHtml ?? '');
                    $messageId  = (string) ($message->getMessageId() ?? '');

                    if ($messageId && MensagemTicket::where('message_id', $messageId)->exists()) {
                        $this->line("Mensagem já importada ({$messageId}). Marcando como lida...");
                        $message->setFlag('Seen');
                        continue;
                    }

                    $rawDate   = $message->getDate()?->first();
                    $dataEnvio = $rawDate ? Carbon::parse($rawDate) : Carbon::now();

                    $this->line("A processar e-mail de: {$remetenteEmail} | Assunto: {$assunto}");

                    $clienteId = null;
                    $remetenteLower = mb_strtolower(trim($remetenteEmail));

                    $contato = ContatoCliente::whereRaw('LOWER(email) = ?', [$remetenteLower])->first();
                    if ($contato) {
                        $clienteId = $contato->cliente_id;
                    } else {
                        $cliente = Cliente::whereRaw('LOWER(emailAdm) = ?', [$remetenteLower])->first();
                        if ($cliente) {
                            $clienteId = $cliente->id;
                        }
                    }

                    $ticketExistenteId = null;
                    if (preg_match('/\[TICKET\s*#(\d+)\]/i', $assunto, $matches)) {
                        $ticketExistenteId = $matches[1];
                    }

                    $ticket = $ticketExistenteId ? Ticket::find($ticketExistenteId) : null;

                    if (!$ticket) {
                        $ticket = Ticket::create([
                            'cliente_id'        => $clienteId,
                            'status_id'         => $statusAbertoId,
                            'canal_id'          => $canalEmailId,
                            'categoria_id'      => null,
                            'prioridade_id'     => null,
                            'dataCriacao'       => Carbon::now(),
                            'titulo'            => $assunto,
                            'message_id_header' => $messageId ?: null,
                        ]);

                        $this->info("-> Novo Ticket criado com ID #{$ticket->id}");
                    } else {
                        $ticket->update([
                            'status_id'      => $statusAbertoId,
                            'dataFinalizado' => null,
                        ]);

                        $this->info("-> Nova réplica adicionada ao Ticket existente #{$ticket->id} (Status reaberto)");
                    }

                    $mensagemTicket = MensagemTicket::create([
                        'ticket_id'   => $ticket->id,
                        'usuario_id'  => null,
                        'assunto'     => $assunto,
                        'corpo_html'  => $corpoHtml,
                        'corpo_texto' => $corpoTexto,
                        'message_id'  => $messageId ?: null,
                        'data_envio'  => $dataEnvio,
                    ]);

                    // Grava o REMETENTE ORIGINAL (FROM)
                    MensagemDestinatario::create([
                        'mensagem_ticket_id' => $mensagemTicket->id,
                        'tipo'               => 'from',
                        'nome'               => $remetenteNome,
                        'email'              => $remetenteEmail,
                    ]);

                    $toList = $message->getTo()?->toArray() ?? [];
                    foreach ($toList as $to) {
                        if (!empty($to->mail)) {
                            MensagemDestinatario::create([
                                'mensagem_ticket_id' => $mensagemTicket->id,
                                'tipo'               => 'to',
                                'nome'               => $to->personal ?? null,
                                'email'              => $to->mail,
                            ]);
                        }
                    }

                    $ccList = $message->getCc()?->toArray() ?? [];
                    foreach ($ccList as $cc) {
                        if (!empty($cc->mail)) {
                            MensagemDestinatario::create([
                                'mensagem_ticket_id' => $mensagemTicket->id,
                                'tipo'               => 'cc',
                                'nome'               => $cc->personal ?? null,
                                'email'              => $cc->mail,
                            ]);
                        }
                    }

                    if ($message->hasAttachments()) {
                        foreach ($message->getAttachments() as $attachment) {
                            $nomeOriginal = Str::limit($attachment->getName() ?: 'anexo_' . Str::random(8), 490, '');
                            $extensao     = Str::limit($attachment->getExtension() ?: pathinfo($nomeOriginal, PATHINFO_EXTENSION), 10, '');
                            $mimeType     = Str::limit($attachment->getMimeType() ?: 'application/octet-stream', 95, '');
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

                    $message->setFlag('Seen');

                } catch (\Throwable $msgEx) {
                    $this->error("Erro ao processar e-mail individual: {$msgEx->getMessage()} (Linha {$msgEx->getLine()})");
                }
            }

            $this->info('Sincronização de e-mails concluída.');

        } catch (\Throwable $e) {
            $this->error("Erro de conexão/geral: {$e->getMessage()} (Linha {$e->getLine()})");
            return 1;
        }

        return 0;
    }
}