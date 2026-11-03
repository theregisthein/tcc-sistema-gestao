import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const BASE_URL = "http://localhost:8000/api";

const STATUS_COLORS = {
  Aberto: { bg: "#EBF4FF", color: "#0066CC" },
  "A fazer": { bg: "#FFF1E8", color: "#F26522" },
  Pendente: { bg: "#F1F5F9", color: "#64748B" },
  Vencido: { bg: "#FFF1F2", color: "#E11D48" },
  Resolvido: { bg: "#ECFDF5", color: "#10B981" },
};

const PRIORITY_COLORS = {
  Alta: "#F26522",
  Média: "#F59E0B",
  Baixa: "#10B981",
  Urgente: "#E11D48",
};

function EmailIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TicketChannelIcon({ channel }) {
  const ch = (channel || "").toLowerCase();
  if (ch.includes("whats")) return <WhatsAppIcon />;
  return <EmailIcon />;
}

// ── Ticket Timer ────────────────────────────────────────────────────────────
function TicketTimer({ ticketId, state, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editH, setEditH] = useState("0");
  const [editM, setEditM] = useState("0");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (state.running) {
      intervalRef.current = setInterval(() => {
        onUpdate(ticketId, { ...state, seconds: (state.seconds || 0) + 1 });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.running, state.seconds]); // eslint-disable-line

  const seconds = state.seconds || 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const display = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  function togglePlay(e) {
    e.stopPropagation();
    onUpdate(ticketId, { ...state, running: !state.running });
  }

  function openEdit(e) {
    e.stopPropagation();
    setEditH(String(h));
    setEditM(String(m));
    setEditing(true);
  }

  function saveEdit(e) {
    e.stopPropagation();
    const totalSeconds = (parseInt(editH) || 0) * 3600 + (parseInt(editM) || 0) * 60;
    onUpdate(ticketId, { ...state, seconds: totalSeconds });
    setEditing(false);
  }

  function reset(e) {
    e.stopPropagation();
    onUpdate(ticketId, { seconds: 0, running: false });
  }

  if (editing) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border"
        style={{ borderColor: "#0066CC", background: "#EBF4FF" }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="number"
          min="0"
          max="99"
          value={editH}
          onChange={(e) => setEditH(e.target.value)}
          className="w-8 text-xs text-center border-none outline-none bg-transparent font-mono font-semibold"
          style={{ color: "#0066CC" }}
        />
        <span className="text-xs font-mono" style={{ color: "#0066CC" }}>h</span>
        <input
          type="number"
          min="0"
          max="59"
          value={editM}
          onChange={(e) => setEditM(e.target.value)}
          className="w-8 text-xs text-center border-none outline-none bg-transparent font-mono font-semibold"
          style={{ color: "#0066CC" }}
        />
        <span className="text-xs font-mono" style={{ color: "#0066CC" }}>m</span>
        <button
          onClick={saveEdit}
          className="w-5 h-5 rounded flex items-center justify-center text-white"
          style={{ background: "#0066CC" }}
        >
          ✓
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditing(false);
          }}
          className="w-5 h-5 rounded flex items-center justify-center text-slate-500"
          style={{ background: "#F1F5F9" }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={togglePlay}
        title={state.running ? "Pausar" : "Iniciar cronômetro"}
        className="w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0"
        style={{
          background: state.running ? "#FFF1F2" : "#ECFDF5",
          border: `1.5px solid ${state.running ? "#E11D48" : "#10B981"}`,
        }}
      >
        {state.running ? (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="#E11D48">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="#10B981">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      <button
        onClick={openEdit}
        title="Editar tempo manualmente"
        className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded transition-colors hover:bg-[#F1F5F9]"
        style={{
          color: state.running ? "#E11D48" : seconds > 0 ? "#1E293B" : "#94A3B8",
          minWidth: "58px",
          textAlign: "center",
        }}
      >
        {display}
      </button>

      {seconds > 0 && !state.running && (
        <button
          onClick={reset}
          title="Zerar cronômetro"
          className="w-4 h-4 rounded flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function FilterSection({ label, children }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider mb-2 text-[#64748B]">{label}</div>
      {children}
    </div>
  );
}

// ── Autocomplete Cliente ────────────────────────────────────────────────────
function ClientAutocomplete({ clients, selected, onSelect, error }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = (clients || []).filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return c.nomeFantasia && c.nomeFantasia.toLowerCase().includes(q);
  });

  if (selected) {
    return (
      <div>
        <label className="text-xs font-semibold block mb-1.5" style={{ color: "#475569" }}>
          Cliente <span className="text-red-500">*</span>
        </label>
        <div
          className="flex items-center justify-between p-3 rounded-xl border bg-white transition-all shadow-xs"
          style={{ borderColor: "#0066CC", background: "#F0F7FF" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "#0B2847" }}
            >
              {(selected.nomeFantasia || "FG").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm truncate block" style={{ color: "#1E293B" }}>
                {selected.nomeFantasia}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setQuery("");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white transition-colors hover:bg-[#F1F5F9] cursor-pointer"
            style={{ borderColor: "#CBD5E1", color: "#0066CC" }}
          >
            Trocar cliente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs font-semibold block mb-1.5" style={{ color: "#475569" }}>
        Cliente <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Digite para buscar o cliente..."
          className="w-full text-sm border rounded-lg px-3 py-2.5 outline-none transition-all"
          style={{
            borderColor: error ? "#EF4444" : "#CBD5E1",
            color: "#1E293B",
            background: "#fff",
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {error && <p className="text-xs mt-1 font-medium text-red-500">{error}</p>}

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto"
          style={{ borderColor: "#E2E8F0" }}
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-center text-slate-400">Nenhum cliente encontrado</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelect(c);
                  setIsOpen(false);
                  setQuery("");
                }}
                className="w-full text-left px-3 py-2.5 flex items-center gap-3 border-b last:border-b-0 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                style={{ borderColor: "#F1F5F9" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "#0B2847" }}
                >
                  {(c.nomeFantasia || "FG").slice(0, 2).toUpperCase()}
                </div>
                <div className="font-semibold text-xs text-slate-800 truncate">{c.nomeFantasia}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────── Modal Criar Novo Ticket ───────────────────────────────────────────────────
function NovoTicketModal({ isOpen, onClose, onCreateTicket, auxiliares }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [prioridadeId, setPrioridadeId] = useState("");
  const [canalId, setCanalId] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (auxiliares) {
      if (auxiliares.categorias?.length > 0) setCategoriaId(auxiliares.categorias[0].id);
      if (auxiliares.prioridades?.length > 0) setPrioridadeId(auxiliares.prioridades[0].id);
      if (auxiliares.canais?.length > 0) setCanalId(auxiliares.canais[0].id);
      if (auxiliares.usuarios?.length > 0) setUsuarioId(auxiliares.usuarios[0].id);
    }
  }, [auxiliares]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!selectedClient) errs.cliente = "Selecione um cliente.";
    if (!assunto.trim()) errs.assunto = "Título obrigatório.";
    if (!descricao.trim()) errs.descricao = "Descrição obrigatória.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const formData = new FormData();
    formData.append("cliente_id", selectedClient.id);
    formData.append("titulo", assunto.trim());
    formData.append("mensagem", descricao.trim());
    if (categoriaId) formData.append("categoria_id", categoriaId);
    if (prioridadeId) formData.append("prioridade_id", prioridadeId);
    if (canalId) formData.append("canal_id", canalId);
    if (usuarioId) {
      formData.append("usuarios[]", usuarioId);
      formData.append("usuario_id", usuarioId);
    }

    files.forEach((file) => {
      formData.append("anexos[]", file);
    });

    onCreateTicket(formData);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(11,40,71,0.6)", backdropFilter: "blur(3px)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden border"
        style={{ borderColor: "#E2E8F0" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-base font-bold text-slate-800">Criar Novo Ticket de Suporte</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <ClientAutocomplete
            clients={auxiliares?.clientes || []}
            selected={selectedClient}
            onSelect={setSelectedClient}
            error={errors.cliente}
          />

          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-700">
              Título / Assunto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Ex: Tabela de Frete com divergência de cálculo"
              className="w-full text-sm border rounded-lg px-3 py-2 outline-none"
              style={{ borderColor: errors.assunto ? "#EF4444" : "#CBD5E1" }}
            />
            {errors.assunto && <p className="text-xs text-red-500 mt-1">{errors.assunto}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-700">
              Descrição Completa <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva detalhadamente a solicitação ou erro..."
              className="w-full text-sm border rounded-lg px-3 py-2 outline-none resize-y"
              style={{ borderColor: errors.descricao ? "#EF4444" : "#CBD5E1" }}
            />
            {errors.descricao && <p className="text-xs text-red-500 mt-1">{errors.descricao}</p>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1.5 text-slate-700">Categoria</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none bg-white"
                style={{ borderColor: "#CBD5E1" }}
              >
                {(auxiliares?.categorias || []).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5 text-slate-700">Prioridade</label>
              <select
                value={prioridadeId}
                onChange={(e) => setPrioridadeId(e.target.value)}
                className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none bg-white"
                style={{ borderColor: "#CBD5E1" }}
              >
                {(auxiliares?.prioridades || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5 text-slate-700">Canal</label>
              <select
                value={canalId}
                onChange={(e) => setCanalId(e.target.value)}
                className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none bg-white"
                style={{ borderColor: "#CBD5E1" }}
              >
                {(auxiliares?.canais || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5 text-slate-700">Responsável</label>
              <select
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none bg-white"
                style={{ borderColor: "#CBD5E1" }}
              >
                {(auxiliares?.usuarios || []).map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-700">Anexos</label>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={(e) => setFiles(Array.from(e.target.files))}
              className="w-full text-xs border rounded-lg p-2"
            />
            {files.length > 0 && (
              <p className="text-[11px] text-slate-500 mt-1">{files.length} arquivo(s) selecionado(s)</p>
            )}
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border bg-white text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm cursor-pointer"
            style={{ background: "#0066CC" }}
          >
            Criar Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function Tickets({ initialStatus, onViewTicket }) {
  const [tickets, setTickets] = useState([]);
  const [auxiliares, setAuxiliares] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [statusFilter, setStatusFilter] = useState(initialStatus || "Todos");
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [clientSearch, setClientSearch] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [timers, setTimers] = useState({});

  async function carregarDados() {
    try {
      setCarregando(true);
      const [resAux, resTickets] = await Promise.all([
        fetch(`${BASE_URL}/tickets/auxiliares`),
        fetch(`${BASE_URL}/tickets`),
      ]);

      if (resAux.ok) {
        const dadosAux = await resAux.json();
        setAuxiliares(dadosAux);
      }

      if (resTickets.ok) {
        const dadosTickets = await resTickets.json();
        const lista = dadosTickets.data || dadosTickets || [];
        setTickets(Array.isArray(lista) ? lista : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const updateTimer = useCallback((id, state) => {
    setTimers((prev) => ({ ...prev, [id]: state }));
  }, []);

  async function handleUpdateTicket(id, updates) {
    try {
      const res = await fetch(`${BASE_URL}/tickets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Erro ao atualizar ticket");
        return;
      }

      await carregarDados();
    } catch (err) {
      console.error(err);
      alert("Erro de comunicação com o servidor.");
    }
  }

  async function handleCreateTicket(formData) {
    try {
      const res = await fetch(`${BASE_URL}/tickets`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Erro ao criar ticket");
        return;
      }

      const dadosCriados = await res.json();
      setShowNovoModal(false);
      setToastMessage(`Ticket #${dadosCriados.id} criado com sucesso!`);
      setTimeout(() => setToastMessage(null), 4000);
      await carregarDados();
    } catch (err) {
      console.error(err);
      alert("Falha de conexão ao criar ticket.");
    }
  }

  const filtrados = useMemo(() => {
    return tickets.filter((t) => {
      const statusNome = t.status?.nome || "Aberto";
      const prioridadeNome = t.prioridade?.nome || "Média";
      const clienteNome = t.cliente?.nomeFantasia || "";

      if (statusFilter !== "Todos" && statusNome !== statusFilter) return false;
      if (priorityFilter !== "Todas" && prioridadeNome !== priorityFilter) return false;
      if (clientSearch && !clienteNome.toLowerCase().includes(clientSearch.toLowerCase())) return false;
      return true;
    });
  }, [tickets, statusFilter, priorityFilter, clientSearch]);

  return (
    <div className="flex flex-1 overflow-hidden" style={{ background: "#F4F6F9" }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-white flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                🎫 Tickets de Suporte
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-sm font-bold bg-[#0B2847] text-white">
                {filtrados.length}
              </span>
            </div>

            <button
              onClick={() => setShowNovoModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-sm cursor-pointer"
              style={{ background: "#0066CC" }}
            >
              + Novo Ticket
            </button>
          </div>
        </div>

        {/* Feed de Tickets */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {carregando && (
            <div className="text-center py-20 text-slate-500 text-sm">Carregando tickets...</div>
          )}

          {!carregando && filtrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-3">🎫</div>
              <p className="font-semibold text-base text-slate-800">Nenhum ticket encontrado</p>
              <p className="text-xs text-slate-500 mt-1">Crie um novo ticket ou execute a sincronização de e-mails.</p>
            </div>
          )}

          {!carregando &&
            filtrados.map((ticket) => {
              const timerState = timers[ticket.id] || { seconds: 0, running: false };
              const statusNome = ticket.status?.nome || "Aberto";
              const prioridadeNome = ticket.prioridade?.nome || "Média";
              const canalNome = ticket.canal?.nome || "E-mail";
              const clienteNome = ticket.cliente?.nomeFantasia || "Cliente Geral";

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-xl border flex items-stretch overflow-hidden cursor-pointer transition-all duration-150 group"
                  style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                  onClick={() => onViewTicket && onViewTicket(ticket.id)}
                >
                  <div
                    className="w-1.5 flex-shrink-0"
                    style={{ background: PRIORITY_COLORS[prioridadeNome] || "#CBD5E1" }}
                  />

                  <div className="flex items-center px-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: "#0B2847" }}
                    >
                      {clienteNome.slice(0, 2).toUpperCase()}
                    </div>
                  </div>

                  <div className="flex-1 py-3 px-2 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 truncate max-w-[200px]">
                        {clienteNome}
                      </span>
                      <span className="text-xs font-bold" style={{ color: "#0066CC" }}>
                        #{ticket.id}
                      </span>
                    </div>

                    <div className="font-semibold text-sm mb-1.5 truncate text-slate-800">
                      {ticket.titulo}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <TicketChannelIcon channel={canalNome} />
                        {canalNome}
                      </span>
                      <span>•</span>
                      <span>{new Date(ticket.created_at || ticket.dataCriacao).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>

                  <div className="flex items-center px-3 border-l border-slate-100">
                    <TicketTimer ticketId={ticket.id} state={timerState} onUpdate={updateTimer} />
                  </div>

                  {/* Seletor rápido de Prioridade, Responsável e Status */}
                  <div
                    className="flex items-center gap-3 px-4 flex-shrink-0 border-l border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      className="text-xs font-bold border-none bg-transparent outline-none cursor-pointer"
                      style={{ color: PRIORITY_COLORS[prioridadeNome] || "#1E293B" }}
                      value={ticket.prioridade_id || ""}
                      onChange={(e) => handleUpdateTicket(ticket.id, { prioridade_id: e.target.value })}
                    >
                      <option value="">Prioridade</option>
                      {(auxiliares?.prioridades || []).map((p) => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>

                    <div className="h-6 w-px bg-slate-200" />

                    <select
                      className="text-xs border-none bg-transparent outline-none cursor-pointer max-w-[120px] truncate text-slate-600"
                      value={ticket.usuarios?.[0]?.id || ""}
                      onChange={(e) => handleUpdateTicket(ticket.id, { usuarios: e.target.value ? [e.target.value] : [] })}
                    >
                      <option value="">Não atribuído</option>
                      {(auxiliares?.usuarios || []).map((u) => (
                        <option key={u.id} value={u.id}>{u.nome}</option>
                      ))}
                    </select>

                    <div className="h-6 w-px bg-slate-200" />

                    <select
                      className="text-xs font-semibold border-none bg-transparent outline-none cursor-pointer"
                      style={{ color: STATUS_COLORS[statusNome]?.color || "#0066CC" }}
                      value={ticket.status_id || ""}
                      onChange={(e) => handleUpdateTicket(ticket.id, { status_id: e.target.value })}
                    >
                      {(auxiliares?.status || []).map((s) => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Painel lateral de filtros */}
      {showFilters && (
        <div className="w-72 flex-shrink-0 flex flex-col border-l bg-white overflow-y-auto" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <span className="font-semibold text-sm text-slate-800">Filtros</span>
            <button
              className="text-xs font-medium text-[#0066CC] cursor-pointer"
              onClick={() => {
                setStatusFilter("Todos");
                setPriorityFilter("Todas");
                setClientSearch("");
              }}
            >
              Limpar
            </button>
          </div>

          <div className="flex-1 px-4 py-4 space-y-5">
            <FilterSection label="Cliente">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full text-xs border rounded-lg px-3 py-2 outline-none"
                style={{ borderColor: "#E2E8F0" }}
              />
            </FilterSection>

            <FilterSection label="Status">
              <div className="space-y-1.5">
                {["Todos", ...(auxiliares?.status?.map((s) => s.nome) || [])].map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="status"
                      checked={statusFilter === s}
                      onChange={() => setStatusFilter(s)}
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection label="Prioridade">
              <div className="flex gap-2 flex-wrap">
                {["Todas", ...(auxiliares?.prioridades?.map((p) => p.nome) || [])].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer"
                    style={{
                      borderColor: priorityFilter === p ? "#0066CC" : "#E2E8F0",
                      background: priorityFilter === p ? "#EBF4FF" : "transparent",
                      color: priorityFilter === p ? "#0066CC" : "#64748B",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </FilterSection>
          </div>
        </div>
      )}

      <NovoTicketModal
        isOpen={showNovoModal}
        onClose={() => setShowNovoModal(false)}
        onCreateTicket={handleCreateTicket}
        auxiliares={auxiliares}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border bg-emerald-50 text-emerald-800 border-emerald-200 text-sm">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}