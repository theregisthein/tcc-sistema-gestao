import { useState, useRef, useEffect } from "react";
import { TICKETS } from "../data/mock";
import { configStore } from "./Configuracoes";

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
};

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}

// Inline editable field with dropdown
function EditableSelect({
  label,
  value,
  options,
  onChange,
  renderValue,
}) {
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
          className="flex items-center gap-1.5 text-xs text-right rounded px-1.5 py-0.5 transition-colors hover:bg-[#F1F5F9] border border-transparent hover:border-[#E2E8F0]"
          style={{ color: "#1E293B" }}
        >
          {renderValue ? renderValue(value) : <span className="font-medium">{value || "—"}</span>}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-lg border min-w-[160px]"
            style={{ background: "#fff", borderColor: "#E2E8F0" }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-[#F4F6F9] transition-colors"
                style={{
                  background: opt === value ? "#F4F6F9" : "transparent",
                  fontWeight: opt === value ? 600 : 400,
                  color: "#1E293B",
                }}
              >
                {opt === value && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {opt !== value && <span className="w-2.5" />}
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Inline editable date field
function EditableDate({
  label,
  value,
  onChange,
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs flex-shrink-0" style={{ color: "#64748B" }}>{label}</span>
      {editing ? (
        <input
          type="datetime-local"
          defaultValue={value ? value.slice(0, 16) : ""}
          autoFocus
          onBlur={(e) => { onChange(e.target.value ? new Date(e.target.value).toISOString() : ""); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}
          className="text-xs border rounded px-1.5 py-0.5 outline-none"
          style={{ borderColor: "#0066CC", color: "#1E293B" }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs rounded px-1.5 py-0.5 transition-colors hover:bg-[#F1F5F9] border border-transparent hover:border-[#E2E8F0]"
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

export default function TicketDetail({ ticketId, onBack }) {
  const ticket = TICKETS.find((t) => t.id === ticketId) || TICKETS[0];
  const [activeTab, setActiveTab] = useState("reply");
  const [replyText, setReplyText] = useState("");
  const [messages, setMessages] = useState(ticket.messages);

  // Editable right-panel fields
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [category, setCategory] = useState(ticket.type);
  const [channel, setChannel] = useState(ticket.channel === "email" ? "E-mail" : "WhatsApp");
  const [finalizadoEm, setFinalizadoEm] = useState("");
  const [ultimaMovimentacao] = useState(ticket.updated);

  function sendReply() {
    if (!replyText.trim()) return;
    const newMsg = {
      id: messages.length + 1,
      from: "regis.rinaldi@fretegestao.com.br",
      fromName: "Régis Rinaldi",
      type: activeTab === "reply" ? "outgoing" : "note",
      content: replyText,
      date: new Date().toISOString(),
      attachments: [],
    };
    setMessages([...messages, newMsg]);
    setReplyText("");
  }

  function handleFinalize() {
    sendReply();
    setStatus("Resolvido");
    setFinalizadoEm(new Date().toISOString());
  }

  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS["Aberto"];

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F4F6F9" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 py-3 border-b bg-white flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "#64748B" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#0066CC"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Tickets
        </button>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="text-sm font-medium" style={{ color: "#1E293B" }}>#{ticket.id} — {ticket.subject}</span>
        <div className="ml-auto flex items-center gap-2">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: statusStyle.bg, color: statusStyle.color }}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Thread (70%) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* SLA bar */}
          <div
            className="flex items-center gap-4 px-6 py-2.5 border-b flex-shrink-0"
            style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}
          >
            <span className="text-xs font-medium" style={{ color: "#92400E" }}>
              ⏱️ Resolução prevista em: <strong>{ticket.slaResolution}</strong>
            </span>
            <div className="h-4 w-px" style={{ background: "#FDE68A" }} />
            <span className="text-xs" style={{ color: "#92400E" }}>
              🎯 Categoria: <strong>{category}</strong>
            </span>
            <div className="h-4 w-px" style={{ background: "#FDE68A" }} />
            <span className="text-xs" style={{ color: "#92400E" }}>
              📢 Canal: <strong>{channel}</strong>
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((msg) => {
              if (msg.type === "note") {
                return (
                  <div key={msg.id} className="rounded-xl p-4 border" style={{ background: "#FEF9C3", borderColor: "#FDE047" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span className="text-xs font-semibold" style={{ color: "#854D0E" }}>
                        Nota Interna — Apenas colaboradores da Frete Gestão visualizam
                      </span>
                      <span className="ml-auto text-xs" style={{ color: "#A16207" }}>{formatDateTime(msg.date)}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mb-2" style={{ background: "#0066CC" }}>RR</div>
                    <p className="text-sm" style={{ color: "#713F12" }}>{msg.content}</p>
                  </div>
                );
              }

              const isOutgoing = msg.type === "outgoing";
              return (
                <div key={msg.id} className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}>
                  {!isOutgoing && (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 flex-shrink-0 self-start mt-1" style={{ background: "#0B2847" }}>
                      {ticket.clientInitials}
                    </div>
                  )}
                  <div className={`max-w-xl ${isOutgoing ? "ml-4" : "mr-4"}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-medium" style={{ color: "#1E293B" }}>{msg.fromName}</span>
                      <span className="text-xs" style={{ color: "#94A3B8" }}>{formatDateTime(msg.date)}</span>
                    </div>
                    <div
                      className="rounded-xl p-4 text-sm leading-relaxed"
                      style={{
                        background: isOutgoing ? "#EBF4FF" : "#fff",
                        border: `1px solid ${isOutgoing ? "#BFDBFE" : "#E2E8F0"}`,
                        color: "#1E293B",
                      }}
                    >
                      {msg.content}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t flex flex-wrap gap-2" style={{ borderColor: isOutgoing ? "#BFDBFE" : "#E2E8F0" }}>
                          {msg.attachments.map((att) => (
                            <span key={att} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer" style={{ background: "#F1F5F9", color: "#0066CC" }}>
                              📎 {att}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {isOutgoing && (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ml-3 flex-shrink-0 self-start mt-1" style={{ background: "#0066CC" }}>RR</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reply area */}
          <div className="border-t flex-shrink-0 bg-white" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex border-b" style={{ borderColor: "#E2E8F0" }}>
              <button
                onClick={() => setActiveTab("reply")}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{ borderColor: activeTab === "reply" ? "#0066CC" : "transparent", color: activeTab === "reply" ? "#0066CC" : "#64748B" }}
              >
                ✉️ Responder ao Cliente
              </button>
              <button
                onClick={() => setActiveTab("note")}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{ borderColor: activeTab === "note" ? "#F59E0B" : "transparent", color: activeTab === "note" ? "#D97706" : "#64748B" }}
              >
                🔒 Nota Interna
              </button>
            </div>

            {activeTab === "note" && (
              <div className="px-4 pt-2 text-xs font-medium" style={{ color: "#92400E", background: "#FFFBEB" }}>
                ⚠️ Nota restrita — visível apenas para a equipe Frete Gestão
              </div>
            )}

            <div className="p-4">
              <div className="flex items-center gap-1 mb-2 pb-2 border-b" style={{ borderColor: "#F1F5F9" }}>
                {["B", "I", "U"].map((f) => (
                  <button key={f} className="w-7 h-7 rounded flex items-center justify-center text-xs font-semibold transition-colors hover:bg-[#F1F5F9]" style={{ color: "#64748B" }}>{f}</button>
                ))}
                <div className="w-px h-4 mx-1" style={{ background: "#E2E8F0" }} />
                <button className="w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-[#F1F5F9]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
              </div>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={activeTab === "reply" ? "Digite sua resposta ao cliente..." : "Adicionar nota interna (não visível ao cliente)..."}
                className="w-full text-sm resize-none outline-none rounded-lg p-3"
                style={{
                  background: activeTab === "note" ? "#FEFCE8" : "#F8FAFC",
                  border: `1px solid ${activeTab === "note" ? "#FDE68A" : "#E2E8F0"}`,
                  color: "#1E293B",
                }}
              />
              <div className="flex items-center justify-between mt-3">
                <button className="flex items-center gap-1.5 text-xs" style={{ color: "#64748B" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  Anexar arquivo
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={sendReply}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: "#0066CC" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#0054a8"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#0066CC"; }}
                  >
                    {activeTab === "reply" ? "Enviar Resposta" : "Adicionar Nota"}
                  </button>
                  <button
                    onClick={handleFinalize}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: "#10B981" }}
                  >
                    Enviar e Finalizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Context panel (30%) */}
        <div className="w-72 flex-shrink-0 border-l overflow-y-auto" style={{ background: "#fff", borderColor: "#E2E8F0" }}>
          {/* Ticket data */}
          <div className="p-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#64748B" }}>
              Dados do Chamado
            </h3>

            <div className="space-y-2">
              {/* ID — read only */}
              <InfoRow label="ID" value={`#${ticket.id}`} />

              {/* Status — editable */}
              <EditableSelect
                label="Status"
                value={status}
                options={configStore.statusOptions}
                onChange={setStatus}
                renderValue={(v) => (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={STATUS_COLORS[v] || { background: "#F1F5F9", color: "#64748B" }}
                  >
                    {v}
                  </span>
                )}
              />

              {/* Priority — editable */}
              <EditableSelect
                label="Prioridade"
                value={priority}
                options={configStore.priorityOptions}
                onChange={setPriority}
                renderValue={(v) => (
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: PRIORITY_COLORS[v] || "#64748B" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLORS[v] || "#64748B" }} />
                    {v}
                  </span>
                )}
              />

              {/* Category — editable */}
              <EditableSelect
                label="Categoria"
                value={category}
                options={configStore.categoryOptions}
                onChange={setCategory}
              />

              {/* Channel — editable */}
              <EditableSelect
                label="Canal"
                value={channel}
                options={configStore.channelOptions}
                onChange={setChannel}
                renderValue={(v) => (
                  <span className="text-xs font-medium">
                    {v === "E-mail" ? "✉️ " : v === "WhatsApp" ? "💬 " : "📞 "}
                    {v}
                  </span>
                )}
              />

              {/* Dates */}
              <div className="pt-1 border-t space-y-2" style={{ borderColor: "#F1F5F9" }}>
                <InfoRow label="Criado em" value={formatDate(ticket.created)} />
                <InfoRow label="Última Movimentação" value={formatDate(ultimaMovimentacao)} />

                {/* Finalizado em — editable */}
                <EditableDate
                  label="Finalizado em"
                  value={finalizadoEm}
                  onChange={(v) => {
                    setFinalizadoEm(v);
                    if (v) setStatus("Resolvido");
                  }}
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t" style={{ borderColor: "#E2E8F0" }}>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>Participantes</div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "#0066CC" }}>RR</div>
                <div>
                  <div className="text-xs font-medium" style={{ color: "#1E293B" }}>Régis Rinaldi</div>
                  <div className="text-[10px]" style={{ color: "#64748B" }}>Analista responsável</div>
                </div>
              </div>
            </div>
          </div>

          {/* Client data */}
          <div className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#64748B" }}>Dados do Cliente</h3>
            <div className="space-y-2.5">
              <InfoRow label="Empresa" value={ticket.client} bold />
              <InfoRow label="Solicitante" value={ticket.requester} />
              <InfoRow label="CNPJ" value="89.327.642/0001-08" />
              <InfoRow label="Plano" value={
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#EBF4FF", color: "#0066CC" }}>
                  Enterprise
                </span>
              } />
              <InfoRow label="Transportadoras" value="Sequóia, TNT, Jadlog" />
            </div>
            <button
              className="mt-4 w-full py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-[#EBF4FF]"
              style={{ borderColor: "#0066CC", color: "#0066CC" }}
            >
              Ver ficha completa do cliente →
            </button>
          </div>
        </div>
      </div>
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
