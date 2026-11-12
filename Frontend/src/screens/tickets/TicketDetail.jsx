import { useState, useRef, useEffect } from "react";

const BASE_URL = "http://localhost:8000/api";
const STORAGE_URL = "http://localhost:8000/storage";



const STATUS_COLORS = {
  "Aberto": { bg: "#EBF4FF", color: "#0066CC" },
  "A fazer": { bg: "#FFF1E8", color: "#F26522" },
  "Pendente": { bg: "#F1F5F9", color: "#64748B" },
  "Vencido": { bg: "#FFF1F2", color: "#E11D48" },
  "Resolvido": { bg: "#ECFDF5", color: "#10B981" },
};

const PRIORITY_COLORS = {
  "Alta": "#F26522",
  "Média": "#F59E0B",
  "Baixa": "#10B981",
  "Urgente": "#E11D48",
};

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function EditableSelect({ label, value, options = [], onChange, renderValue }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex items-start justify-between gap-2 group">
      <span className="text-xs flex-shrink-0 pt-0.5" style={{ color: "#64748B" }}>{label}</span>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-xs text-right rounded px-1.5 py-0.5 transition-colors hover:bg-[#F1F5F9] border border-transparent hover:border-[#E2E8F0] cursor-pointer"
          style={{ color: "#1E293B" }}
        >
          {renderValue ? renderValue(value) : <span className="font-medium">{value?.nome || value || "—"}</span>}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-lg border min-w-[160px] max-h-56 overflow-y-auto"
            style={{ background: "#fff", borderColor: "#E2E8F0" }}
          >
            {options.map((opt) => {
              const optId = opt.id ?? opt;
              const optNome = opt.nome ?? opt;
              const currentId = value?.id ?? value;
              const isSelected = optId === currentId || optNome === currentId;

              return (
                <button
                  key={optId}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-[#F4F6F9] transition-colors cursor-pointer"
                  style={{
                    background: isSelected ? "#F4F6F9" : "transparent",
                    fontWeight: isSelected ? 600 : 400,
                    color: "#1E293B",
                  }}
                >
                  {isSelected ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="w-2.5" />
                  )}
                  {optNome}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EditableDate({ label, value, onChange }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs flex-shrink-0" style={{ color: "#64748B" }}>{label}</span>
      {editing ? (
        <input
          type="datetime-local"
          defaultValue={value ? value.slice(0, 16) : ""}
          autoFocus
          onBlur={(e) => {
            onChange(e.target.value ? new Date(e.target.value).toISOString() : "");
            setEditing(false);
          }}
          onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}
          className="text-xs border rounded px-1.5 py-0.5 outline-none"
          style={{ borderColor: "#0066CC", color: "#1E293B" }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs rounded px-1.5 py-0.5 transition-colors hover:bg-[#F1F5F9] border border-transparent hover:border-[#E2E8F0] cursor-pointer"
          style={{ color: value ? "#1E293B" : "#94A3B8" }}
        >
          <span className="font-medium">{value ? formatDateTime(value) : "Definir data"}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      )}
    </div>
  );
}

function InfoRow({ label, value, bold }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs flex-shrink-0" style={{ color: "#64748B" }}>{label}</span>
      <span className={`text-xs text-right ${bold ? "font-semibold" : ""}`} style={{ color: "#1E293B" }}>
        {value}
      </span>
    </div>
  );
}

export default function TicketDetail({ ticketId, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [auxiliares, setAuxiliares] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [activeTab, setActiveTab] = useState("reply"); // "reply" ou "note"
  const [replyText, setReplyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [anexos, setAnexos] = useState([]);
  const fileInputRef = useRef(null);

  async function carregarDetalhes() {
    try {
      setCarregando(true);
      const [resTicket, resAux] = await Promise.all([
        fetch(`${BASE_URL}/tickets/${ticketId}`),
        fetch(`${BASE_URL}/tickets/auxiliares`),
      ]);

      if (resTicket.ok) {
        const dados = await resTicket.json();
        setTicket(dados);
      }
      if (resAux.ok) {
        const aux = await resAux.json();
        setAuxiliares(aux);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDetalhes();
  }, [ticketId]);

  async function atualizarCampo(campo, valor) {
    if (!ticket) return;
    try {
      const res = await fetch(`${BASE_URL}/tickets/${ticket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ [campo]: valor }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Erro ao atualizar ticket");
        return;
      }

      const atualizado = await res.json();
      setTicket((prev) => ({
        ...prev,
        ...atualizado,
        cliente: atualizado.cliente || null,
        cliente_id: atualizado.cliente_id || null,
        usuarios: atualizado.usuarios || [],
      }));
    } catch (err) {
      console.error(err);
      alert("Erro de comunicação ao atualizar");
    }
  }

  async function alterarResponsavel(usuarioId) {
    // Envia o array com o usuário selecionado ou array vazio se desatribuir
    const listaUsuarios = usuarioId ? [Number(usuarioId)] : [];
    await atualizarCampo("usuarios", listaUsuarios);
  }

  async function enviarResposta(finalizar = false) {
    const isNota = activeTab === "note";
    const textoMensagem = isNota ? noteText.trim() : replyText.trim();

    if (!textoMensagem && anexos.length === 0) return;

    try {
      setEnviando(true);
      const formData = new FormData();
      formData.append("mensagem", textoMensagem);
      formData.append("eh_interna", isNota ? "1" : "0");
      
      anexos.forEach((file) => {
        formData.append("anexos[]", file);
      });

      const res = await fetch(`${BASE_URL}/tickets/${ticket.id}/responder`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Erro ao salvar comunicação");
        return;
      }

      if (isNota) {
        setNoteText("");
      } else {
        setReplyText("");
      }
      setAnexos([]);

      if (finalizar) {
        const statusResolvidoId = auxiliares?.status?.find((s) => s.nome.toLowerCase().includes("resolvido"))?.id;
        if (statusResolvidoId) {
          await atualizarCampo("status_id", statusResolvidoId);
        }
        await atualizarCampo("dataFinalizado", new Date().toISOString());
      }

      await carregarDetalhes();
    } catch (err) {
      console.error(err);
      alert("Falha ao salvar comunicação");
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F4F6F9] text-sm text-slate-500">
        Carregando detalhes do ticket #{ticketId}...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F4F6F9] gap-3">
        <p className="text-slate-700 font-medium">Ticket não localizado no banco de dados.</p>
        <button onClick={onBack} className="text-xs font-semibold text-[#0066CC] underline cursor-pointer">
          ← Voltar para listagem
        </button>
      </div>
    );
  }

  const cliente = ticket.cliente;
  const statusAtual = ticket.status?.nome || "Aberto";
  const prioridadeAtual = ticket.prioridade?.nome || "Média";
  const categoriaAtual = ticket.categoria?.nome || "Geral";
  const canalAtual = ticket.canal?.nome || "E-mail";
  const statusStyle = STATUS_COLORS[statusAtual] || STATUS_COLORS["Aberto"];
  const mensagens = ticket.mensagens || [];
  const responsavel = ticket.usuarios?.[0] || null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F4F6F9" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 py-3 border-b bg-white flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm transition-colors cursor-pointer text-slate-500 hover:text-[#0066CC]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Tickets
        </button>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="text-sm font-medium text-slate-800 truncate">
          #{ticket.id} — {ticket.titulo}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: statusStyle.bg, color: statusStyle.color }}
          >
            {statusAtual}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Thread de Mensagens */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Barra de SLA / Info rápida */}
          <div
            className="flex items-center gap-4 px-6 py-2.5 border-b flex-shrink-0"
            style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}
          >
            <span className="text-xs font-medium text-amber-900">
              ⏱️ Resolução prevista: <strong>{ticket.prioridade?.prazo || "2 dias"}</strong>
            </span>
            <div className="h-4 w-px bg-amber-200" />
            <span className="text-xs text-amber-900">
              🎯 Categoria: <strong>{categoriaAtual}</strong>
            </span>
            <div className="h-4 w-px bg-amber-200" />
            <span className="text-xs text-amber-900">
              📢 Canal: <strong>{canalAtual}</strong>
            </span>
          </div>

          {/* Histórico da Linha do Tempo */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {mensagens.map((msg) => {
              const isOutgoing = Boolean(msg.usuario_id);
              const isNotaInterna = Boolean(msg.eh_interna) || (msg.assunto && msg.assunto.includes("[NOTA INTERNA]")); //VALIDA SE E NOTA INTERNA
              const remetenteFrom = msg.destinatarios?.find((d) => d.tipo === "from");
              
              const autorNome = isOutgoing
                ? (msg.usuario?.nome || "Atendente")
                : (cliente?.nomeFantasia || remetenteFrom?.nome || remetenteFrom?.email || "Remetente Externo");
              
              const avatarTexto = isOutgoing
                ? autorNome.slice(0, 2).toUpperCase()
                : (cliente?.nomeFantasia ? cliente.nomeFantasia.slice(0, 2).toUpperCase() : "EXT");

              const dataFormatada = formatDateTime(msg.data_envio || msg.created_at);

              return (
                <div key={msg.id} className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}>
                  {!isOutgoing && (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 flex-shrink-0 self-start mt-1"
                      style={{ background: cliente ? "#0B2847" : "#475569" }}
                    >
                      {avatarTexto}
                    </div>
                  )}

                  <div className={`max-w-xl ${isOutgoing ? "ml-4" : "mr-4"}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-medium text-slate-800">{autorNome}</span>
                      {isNotaInterna && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                          🔒 NOTA INTERNA
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">{dataFormatada}</span>
                    </div>

                    <div
                      className="rounded-xl p-4 text-sm leading-relaxed"
                      style={{
                        background: isNotaInterna 
                          ? "#FEFCE8" 
                          : isOutgoing 
                          ? "#EBF4FF" 
                          : "#fff",
                        border: `1px solid ${
                          isNotaInterna 
                            ? "#FDE68A" 
                            : isOutgoing 
                            ? "#BFDBFE" 
                            : "#E2E8F0"
                        }`,
                        color: "#1E293B",
                      }}
                    >
                      {msg.corpo_html ? (
                        <div
                          className="prose prose-sm max-w-none break-words"
                          dangerouslySetInnerHTML={{ __html: msg.corpo_html }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.corpo_texto}</p>
                      )}

                      {!isNotaInterna && msg.destinatarios && msg.destinatarios.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                          {msg.destinatarios.map((d) => (
                            <span key={d.id} className="mr-2 inline-block">
                              {d.tipo === "to" ? "Para: " : d.tipo === "cc" ? "Cc: " : "De: "}
                              <strong>{d.nome || d.email}</strong>
                            </span>
                          ))}
                        </div>
                      )}

                      {msg.anexos && msg.anexos.length > 0 && (
                        <div
                          className="mt-3 pt-3 border-t flex flex-wrap gap-2"
                          style={{ borderColor: isNotaInterna ? "#FDE68A" : isOutgoing ? "#BFDBFE" : "#E2E8F0" }}
                        >
                          {msg.anexos.map((att) => (
                            <a
                              key={att.id}
                              href={`${STORAGE_URL}/${att.caminho}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors hover:bg-blue-100"
                              style={{ background: "#F1F5F9", color: "#0066CC" }}
                            >
                              📎 {att.nomeOriginal}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {isOutgoing && (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ml-3 flex-shrink-0 self-start mt-1"
                      style={{ background: isNotaInterna ? "#D97706" : "#0066CC" }}
                    >
                      {avatarTexto}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Área de Resposta e Nota Interna */}
          <div className="border-t flex-shrink-0 bg-white" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex border-b" style={{ borderColor: "#E2E8F0" }}>
              <button
                onClick={() => setActiveTab("reply")}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer"
                style={{
                  borderColor: activeTab === "reply" ? "#0066CC" : "transparent",
                  color: activeTab === "reply" ? "#0066CC" : "#64748B",
                }}
              >
                ✉️ Responder ao Chamado
              </button>
              <button
                onClick={() => setActiveTab("note")}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer"
                style={{
                  borderColor: activeTab === "note" ? "#F59E0B" : "transparent",
                  color: activeTab === "note" ? "#D97706" : "#64748B",
                }}
              >
                🔒 Nota Interna
              </button>
            </div>

            {activeTab === "note" && (
              <div className="px-4 py-2 text-xs font-medium border-b" style={{ color: "#92400E", background: "#FFFBEB", borderColor: "#FDE68A" }}>
                🔒 Esta nota é visível <strong>apenas para a equipe interna</strong>. Nenhum e-mail será disparado para o cliente.
              </div>
            )}

            <div className="p-4">
              <textarea
                rows={4}
                value={activeTab === "reply" ? replyText : noteText}
                onChange={(e) => {
                  if (activeTab === "reply") {
                    setReplyText(e.target.value);
                  } else {
                    setNoteText(e.target.value);
                  }
                }}
                placeholder={
                  activeTab === "reply"
                    ? "Digite a resposta que será enviada por e-mail para o remetente..."
                    : "Digite uma anotação técnica/interna para a equipe de suporte..."
                }
                className="w-full text-sm resize-none outline-none rounded-lg p-3 transition-colors"
                style={{
                  background: activeTab === "note" ? "#FEFCE8" : "#F8FAFC",
                  border: `1px solid ${activeTab === "note" ? "#FDE68A" : "#E2E8F0"}`,
                  color: "#1E293B",
                }}
              />

              {anexos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {anexos.map((f, i) => (
                    <span key={i} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 flex items-center gap-1">
                      📄 {f.name}
                      <button
                        type="button"
                        onClick={() => setAnexos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-red-500 font-bold ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <div>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={(e) => setAnexos(Array.from(e.target.files))}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#0066CC] cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    Anexar arquivo
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === "reply" ? (
                    <>
                      <button
                        onClick={() => enviarResposta(false)}
                        disabled={enviando || !replyText.trim()}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
                        style={{ background: "#0066CC" }}
                      >
                        {enviando ? "Enviando..." : "Enviar Resposta"}
                      </button>
                      <button
                        onClick={() => enviarResposta(true)}
                        disabled={enviando || !replyText.trim()}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                        style={{ background: "#10B981" }}
                      >
                        Enviar e Finalizar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => enviarResposta(false)}
                      disabled={enviando || !noteText.trim()}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
                      style={{ background: "#D97706" }}
                    >
                      {enviando ? "Salvando..." : "Salvar Nota Interna"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Painel Lateral Direito */}
        <div className="w-72 flex-shrink-0 border-l overflow-y-auto bg-white" style={{ borderColor: "#E2E8F0" }}>
          <div className="p-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-500">
              Dados do Chamado
            </h3>

            <div className="space-y-3">
              <InfoRow label="ID" value={`#${ticket.id}`} bold />

              {/* Status */}
              <EditableSelect
                label="Status"
                value={ticket.status}
                options={auxiliares?.status || []}
                onChange={(opt) => atualizarCampo("status_id", opt.id)}
                renderValue={(v) => (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={STATUS_COLORS[v?.nome || v] || { background: "#F1F5F9", color: "#64748B" }}
                  >
                    {v?.nome || v}
                  </span>
                )}
              />

              {/* Prioridade */}
              <EditableSelect
                label="Prioridade"
                value={ticket.prioridade}
                options={auxiliares?.prioridades || []}
                onChange={(opt) => atualizarCampo("prioridade_id", opt.id)}
                renderValue={(v) => {
                  const nome = v?.nome || v;
                  return (
                    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: PRIORITY_COLORS[nome] || "#64748B" }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLORS[nome] || "#64748B" }} />
                      {nome}
                    </span>
                  );
                }}
              />

              {/* Categoria */}
              <EditableSelect
                label="Categoria"
                value={ticket.categoria}
                options={auxiliares?.categorias || []}
                onChange={(opt) => atualizarCampo("categoria_id", opt.id)}
              />

              {/* Canal */}
              <EditableSelect
                label="Canal"
                value={ticket.canal}
                options={auxiliares?.canais || []}
                onChange={(opt) => atualizarCampo("canal_id", opt.id)}
                renderValue={(v) => {
                  const nome = v?.nome || v;
                  return (
                    <span className="text-xs font-medium text-slate-800">
                      {nome.toLowerCase().includes("email") ? "✉️ " : "💬 "}
                      {nome}
                    </span>
                  );
                }}
              />

              <div className="pt-2 border-t space-y-2 border-slate-100">
                <InfoRow label="Criado em" value={formatDate(ticket.dataCriacao || ticket.created_at)} />
                <InfoRow label="Última Atualização" value={formatDate(ticket.updated_at)} />

                <EditableDate
                  label="Finalizado em"
                  value={ticket.dataFinalizado}
                  onChange={(v) => atualizarCampo("dataFinalizado", v)}
                />
              </div>
            </div>

            {/* Responsável Selecionável */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wider mb-2 text-slate-500">
                Responsável
              </div>

              <div className="mb-2">
                <select
                  value={responsavel?.id || ""}
                  onChange={(e) => alterarResponsavel(e.target.value)}
                  className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none font-medium transition-colors cursor-pointer"
                  style={{
                    borderColor: !responsavel ? "#CBD5E1" : "#93C5FD",
                    background: !responsavel ? "#F8FAFC" : "#EFF6FF",
                    color: !responsavel ? "#64748B" : "#1E40AF",
                  }}
                >
                  <option value="">👤 Não atribuído (Fila Geral)</option>
                  {(auxiliares?.usuarios || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      👤 {u.nome} {u.setor ? `(${u.setor})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {responsavel ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: "#0066CC" }}
                  >
                    {(responsavel.nome || "NA").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {responsavel.nome}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {responsavel.setor || "Suporte"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  Nenhum analista alocado a este chamado.
                </div>
              )}
            </div>
          </div>

          {/* Dados do Cliente com Seleção Editável */}
          <div className="p-4 border-t" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">
              Cliente Vinculado
            </h3>

            {/* Dropdown de Seleção de Cliente */}
            <div className="mb-3">
              <select
                value={ticket.cliente_id || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const novoClienteId = val !== "" ? Number(val) : null;
                  atualizarCampo("cliente_id", novoClienteId);
                }}
                className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none font-medium transition-colors cursor-pointer"
                style={{
                  borderColor: !ticket.cliente_id ? "#F59E0B" : "#CBD5E1",
                  background: !ticket.cliente_id ? "#FFFBEB" : "#fff",
                  color: !ticket.cliente_id ? "#B45309" : "#1E293B",
                }}
              >
                <option value="">⚠️ Sem cliente vinculado (Pendente)</option>
                {(auxiliares?.clientes || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    🏢 {c.nomeFantasia || c.razaoSocial}
                  </option>
                ))}
              </select>
            </div>

            {ticket.cliente ? (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <InfoRow label="Empresa" value={ticket.cliente.nomeFantasia || "—"} bold />
                <InfoRow label="E-mail Adm" value={ticket.cliente.emailAdm || "—"} />
                <InfoRow label="Domínio" value={ticket.cliente.dominio || "—"} />
                <InfoRow
                  label="Plano"
                  value={
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {ticket.cliente.plano?.nome || "Padrão"}
                    </span>
                  }
                />
              </div>
            ) : (
              <div className="p-3 rounded-lg border text-xs" style={{ background: "#FEFCE8", borderColor: "#FDE68A", color: "#854D0E" }}>
                <p className="font-semibold mb-1">Chamado sem cadastro</p>
                Este chamado foi aberto por um e-mail externo ainda não cadastrado. Você pode vinculá-lo selecionando uma empresa acima assim que cadastrar o cliente.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}