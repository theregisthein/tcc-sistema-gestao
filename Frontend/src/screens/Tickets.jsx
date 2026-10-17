import { useState, useEffect, useRef, useCallback } from "react"
import { TICKETS, CURRENT_USER, CLIENTES, USUARIOS } from "../data/mock"
import { configStore } from "./Configuracoes"

const STATUS_COLORS = {
  Aberto: { bg: "#EBF4FF", color: "#0066CC" },
  "A fazer": { bg: "#FFF1E8", color: "#F26522" },
  Pendente: { bg: "#F1F5F9", color: "#64748B" },
  Vencido: { bg: "#FFF1F2", color: "#E11D48" },
  Resolvido: { bg: "#ECFDF5", color: "#10B981" },
}

const PRIORITY_COLORS = {
  Urgente: "#E11D48",
  Alta: "#F26522",
  Média: "#F59E0B",
  Baixa: "#10B981",
}

const STATUS_OPTIONS = [
  "Todos",
  "Aberto",
  "A fazer",
  "Pendente",
  "Vencido",
  "Resolvido",
]
const PRIORITY_OPTIONS = ["Todas", "Urgente", "Alta", "Média", "Baixa"]
const TYPE_OPTIONS = [
  "Todos",
  "Tabela de Frete",
  "Integração API",
  "Dúvidas de Cotação",
  "Erro Operacional",
  "Configuração de Sistema",
]
const CHANNEL_OPTIONS = [
  "Todos",
  "E-mail",
  "WhatsApp",
  "Telefone",
  "Chat",
  "Portal",
]

function EmailIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#64748B"
      strokeWidth="2"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#10B981"
      strokeWidth="2"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0284C7"
      strokeWidth="2"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8B5CF6"
      strokeWidth="2"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function PortalIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0066CC"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function TicketChannelIcon({ channel }) {
  const ch = (channel || "").toLowerCase()
  if (ch.includes("whats")) return <WhatsAppIcon />
  if (ch.includes("tel") || ch.includes("fone")) return <PhoneIcon />
  if (ch.includes("chat")) return <ChatIcon />
  if (ch.includes("port") || ch.includes("web")) return <PortalIcon />
  return <EmailIcon />
}

// ── Ticket Timer ────────────────────────────────────────────────────────────

function TicketTimer({ ticketId, state, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [editH, setEditH] = useState("0")
  const [editM, setEditM] = useState("0")
  const intervalRef = useRef(null)

  // tick
  useEffect(() => {
    if (state.running) {
      intervalRef.current = setInterval(() => {
        onUpdate(ticketId, { ...state, seconds: state.seconds + 1 })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.running, state.seconds]) // eslint-disable-line

  const h = Math.floor(state.seconds / 3600)
  const m = Math.floor((state.seconds % 3600) / 60)
  const s = state.seconds % 60
  const display = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`

  function togglePlay(e) {
    e.stopPropagation()
    onUpdate(ticketId, { ...state, running: !state.running })
  }

  function openEdit(e) {
    e.stopPropagation()
    setEditH(String(h))
    setEditM(String(m))
    setEditing(true)
  }

  function saveEdit(e) {
    e.stopPropagation()
    const totalSeconds =
      (parseInt(editH) || 0) * 3600 + (parseInt(editM) || 0) * 60
    onUpdate(ticketId, { ...state, seconds: totalSeconds })
    setEditing(false)
  }

  function reset(e) {
    e.stopPropagation()
    onUpdate(ticketId, { seconds: 0, running: false })
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
        <span className="text-xs font-mono" style={{ color: "#0066CC" }}>
          h
        </span>
        <input
          type="number"
          min="0"
          max="59"
          value={editM}
          onChange={(e) => setEditM(e.target.value)}
          className="w-8 text-xs text-center border-none outline-none bg-transparent font-mono font-semibold"
          style={{ color: "#0066CC" }}
        />
        <span className="text-xs font-mono" style={{ color: "#0066CC" }}>
          m
        </span>
        <button
          onClick={saveEdit}
          className="w-5 h-5 rounded flex items-center justify-center"
          style={{ background: "#0066CC" }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setEditing(false)
          }}
          className="w-5 h-5 rounded flex items-center justify-center"
          style={{ background: "#F1F5F9" }}
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748B"
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Play/Pause */}
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
          // Pause icon
          <svg width="8" height="8" viewBox="0 0 24 24" fill="#E11D48">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          // Play icon
          <svg width="8" height="8" viewBox="0 0 24 24" fill="#10B981">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      {/* Display */}
      <button
        onClick={openEdit}
        title="Editar tempo manualmente"
        className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded transition-colors hover:bg-[#F1F5F9]"
        style={{
          color: state.running
            ? "#E11D48"
            : state.seconds > 0
              ? "#1E293B"
              : "#94A3B8",
          minWidth: "58px",
          textAlign: "center",
        }}
      >
        {display}
      </button>

      {/* Reset — only shown when time > 0 and not running */}
      {state.seconds > 0 && !state.running && (
        <button
          onClick={reset}
          title="Zerar cronômetro"
          className="w-4 h-4 rounded flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748B"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ── Filter section helper ───────────────────────────────────────────────────
function FilterSection({ label, children }) {
  return (
    <div>
      <div
        className="text-[11px] font-semibold uppercase tracking-wider mb-2"
        style={{ color: "#64748B" }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

// ── Autocomplete Cliente ────────────────────────────────────────────────────
function ClientAutocomplete({ clients, selected, onSelect, error }) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = clients.filter((c) => {
    if (!query.trim()) return true
    const q = query.toLowerCase().trim()
    return (
      (c.nomeFantasia && c.nomeFantasia.toLowerCase().includes(q)) ||
      (c.razaoSocial && c.razaoSocial.toLowerCase().includes(q)) ||
      (c.cnpj && c.cnpj.includes(q))
    )
  })

  if (selected) {
    return (
      <div>
        <label
          className="text-xs font-semibold block mb-1.5"
          style={{ color: "#475569" }}
        >
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
              {(selected.nomeFantasia || selected.razaoSocial || "FG")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="font-bold text-sm truncate"
                  style={{ color: "#1E293B" }}
                >
                  {selected.nomeFantasia || selected.razaoSocial}
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "#E2E8F0", color: "#475569" }}
                >
                  {selected.plano || "Cliente"}
                </span>
              </div>
              <div className="text-xs truncate" style={{ color: "#64748B" }}>
                {selected.razaoSocial} • CNPJ: {selected.cnpj || "—"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null)
              setQuery("")
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white transition-colors hover:bg-[#F1F5F9] cursor-pointer"
            style={{ borderColor: "#CBD5E1", color: "#0066CC" }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Trocar cliente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <label
        className="text-xs font-semibold block mb-1.5"
        style={{ color: "#475569" }}
      >
        Cliente <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "#94A3B8" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Digite para buscar por nome fantasia, razão social ou CNPJ..."
          className="w-full text-sm border rounded-lg pl-9 pr-8 py-2.5 outline-none transition-all"
          style={{
            borderColor: error ? "#EF4444" : "#CBD5E1",
            color: "#1E293B",
            background: "#fff",
            boxShadow: error ? "0 0 0 2px rgba(239, 68, 68, 0.15)" : "none",
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

      {error && (
        <p className="text-xs mt-1 font-medium" style={{ color: "#EF4444" }}>
          {error}
        </p>
      )}

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto"
          style={{ borderColor: "#E2E8F0" }}
        >
          {filtered.length === 0 ? (
            <div
              className="px-4 py-3 text-xs text-center"
              style={{ color: "#94A3B8" }}
            >
              Nenhum cliente encontrado com "{query}"
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelect(c)
                  setIsOpen(false)
                  setQuery("")
                }}
                className="w-full text-left px-3 py-2.5 flex items-center gap-3 border-b last:border-b-0 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                style={{ borderColor: "#F1F5F9" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "#0B2847" }}
                >
                  {(c.nomeFantasia || c.razaoSocial || "FG")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold text-xs truncate"
                      style={{ color: "#1E293B" }}
                    >
                      {c.nomeFantasia}
                    </span>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{ background: "#F1F5F9", color: "#64748B" }}
                    >
                      {c.plano}
                    </span>
                  </div>
                  <div
                    className="text-[11px] truncate"
                    style={{ color: "#64748B" }}
                  >
                    {c.razaoSocial} • CNPJ: {c.cnpj}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Modal Criar Novo Ticket ───────────────────────────────────────────────────
function NovoTicketModal({ isOpen, onClose, onCreateTicket }) {
  const [selectedClient, setSelectedClient] = useState(null)
  const [solicitanteNome, setSolicitanteNome] = useState("")
  const [solicitanteEmail, setSolicitanteEmail] = useState("")
  const [assunto, setAssunto] = useState("")
  const [descricao, setDescricao] = useState("")

  const categories = configStore.categoryOptions || [
    "Tabela de Frete",
    "Integração API",
    "Dúvidas de Cotação",
    "Erro Operacional",
    "Configuração de Sistema",
  ]
  const [categoria, setCategoria] = useState(categories[0] || "Tabela de Frete")

  const priorities = ["Urgente", "Alta", "Média", "Baixa"]
  const [prioridade, setPrioridade] = useState("Média")

  const channels = configStore.channelOptions || [
    "E-mail",
    "WhatsApp",
    "Telefone",
    "Chat",
    "Portal",
  ]
  const [canal, setCanal] = useState(channels[0] || "E-mail")

  const [transportadora, setTransportadora] = useState("")
  const [responsavel, setResponsavel] = useState(CURRENT_USER.name)

  const [attachments, setAttachments] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)

  // Reset form on open/close
  useEffect(() => {
    if (!isOpen) {
      setSelectedClient(null)
      setSolicitanteNome("")
      setSolicitanteEmail("")
      setAssunto("")
      setDescricao("")
      setCategoria(categories[0] || "Tabela de Frete")
      setPrioridade("Média")
      setCanal(channels[0] || "E-mail")
      setTransportadora("")
      setResponsavel(CURRENT_USER.name)
      setAttachments([])
      setErrors({})
      setTouched(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Handle client selection and pre-populate contacts if available
  function handleSelectClient(client) {
    setSelectedClient(client)
    setTransportadora("")
    if (errors.cliente) {
      setErrors((prev) => ({ ...prev, cliente: null }))
    }
    if (client) {
      if (Array.isArray(client.contatos) && client.contatos.length > 0) {
        setSolicitanteNome(client.contatos[0].nome)
        setSolicitanteEmail(client.contatos[0].email)
      } else if (client.adminEmail) {
        setSolicitanteNome(client.nomeFantasia || "Administrador")
        setSolicitanteEmail(client.adminEmail)
      }
    } else {
      setSolicitanteNome("")
      setSolicitanteEmail("")
    }
  }

  // Client's registered contacts list
  const clientContacts = []
  if (selectedClient) {
    if (Array.isArray(selectedClient.contatos)) {
      clientContacts.push(...selectedClient.contatos)
    }
    if (selectedClient.adminEmail) {
      const exists = clientContacts.some(
        (c) => c.email === selectedClient.adminEmail,
      )
      if (!exists) {
        clientContacts.push({
          id: "admin",
          nome: selectedClient.nomeFantasia || "Administrador",
          email: selectedClient.adminEmail,
        })
      }
    }
  }

  // Client's linked transportadoras
  const clientTransportadoras = selectedClient?.transportadoras || []

  // File upload helpers
  function addFiles(fileList) {
    const newItems = Array.from(fileList).map((f) => ({
      name: f.name,
      size: f.size,
      formattedSize:
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(f.size / 1024)} KB`,
    }))
    setAttachments((prev) => [...prev, ...newItems])
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  function removeAttachment(index) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Form submission
  function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)

    const errs = {}
    if (!selectedClient) {
      errs.cliente = "Selecione um cliente para o chamado."
    }
    if (!solicitanteNome.trim()) {
      errs.solicitanteNome = "O nome do solicitante é obrigatório."
    }
    if (!solicitanteEmail.trim()) {
      errs.solicitanteEmail = "O e-mail do solicitante é obrigatório."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(solicitanteEmail.trim())) {
      errs.solicitanteEmail =
        "Digite um e-mail válido (ex: contato@empresa.com.br)."
    }
    if (!assunto.trim()) {
      errs.assunto = "O título / assunto do chamado é obrigatório."
    }
    if (!descricao.trim()) {
      errs.descricao = "A descrição detalhada da solicitação é obrigatória."
    }
    if (!categoria) {
      errs.categoria = "Selecione uma categoria."
    }
    if (!prioridade) {
      errs.prioridade = "Selecione a prioridade."
    }
    if (!canal) {
      errs.canal = "Selecione o canal de origem."
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    onCreateTicket({
      client: selectedClient,
      clientName: selectedClient.nomeFantasia || selectedClient.razaoSocial,
      clientInitials: (
        selectedClient.nomeFantasia ||
        selectedClient.razaoSocial ||
        "CL"
      )
        .slice(0, 2)
        .toUpperCase(),
      requesterName: solicitanteNome.trim(),
      requesterEmail: solicitanteEmail.trim(),
      subject: assunto.trim(),
      description: descricao.trim(),
      category: categoria,
      priority: prioridade,
      channel: canal,
      transportadora: transportadora || null,
      assignee: responsavel,
      attachments: attachments.map((a) => a.name),
    })
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
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "#E2E8F0" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
              style={{ background: "#0B2847" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>
                Criar Novo Ticket de Suporte
              </h2>
              <p className="text-xs" style={{ color: "#64748B" }}>
                Preencha o formulário para registrar e encaminhar o chamado na
                fila operacional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
        >
          {/* Validation Alert */}
          {touched && Object.keys(errors).length > 0 && (
            <div
              className="flex items-start gap-2.5 p-3.5 rounded-xl border"
              style={{
                background: "#FFF1F2",
                borderColor: "#FECDD3",
                color: "#9F1239",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E11D48"
                strokeWidth="2"
                className="flex-shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="text-xs">
                <span className="font-bold">Atenção:</span> Existem campos
                obrigatórios pendentes ou inválidos destacados em vermelho.
              </div>
            </div>
          )}

          {/* 1. Cliente & Solicitante */}
          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between"
              style={{ color: "#0B2847", borderColor: "#E2E8F0" }}
            >
              <span>1. Cliente & Solicitante</span>
              <span className="text-[10px] font-normal text-slate-500">
                Origem do contato
              </span>
            </div>

            <div className="space-y-4">
              {/* Autocomplete Cliente */}
              <ClientAutocomplete
                clients={CLIENTES}
                selected={selectedClient}
                onSelect={handleSelectClient}
                error={errors.cliente}
              />

              {/* Contatos cadastrados (chips) */}
              {selectedClient && clientContacts.length > 0 && (
                <div
                  className="p-3 rounded-xl border space-y-2"
                  style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}
                >
                  <div
                    className="text-[11px] font-semibold flex items-center gap-1.5"
                    style={{ color: "#475569" }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Contatos vinculados na ficha do cliente (clique para
                    preencher):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {clientContacts.map((ct, idx) => {
                      const isSelected =
                        solicitanteEmail === ct.email &&
                        solicitanteNome === ct.nome
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSolicitanteNome(ct.nome)
                            setSolicitanteEmail(ct.email)
                            if (
                              errors.solicitanteNome ||
                              errors.solicitanteEmail
                            ) {
                              setErrors((prev) => ({
                                ...prev,
                                solicitanteNome: null,
                                solicitanteEmail: null,
                              }))
                            }
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border font-medium transition-all cursor-pointer"
                          style={{
                            background: isSelected ? "#EBF4FF" : "#FFFFFF",
                            borderColor: isSelected ? "#0066CC" : "#CBD5E1",
                            color: isSelected ? "#0066CC" : "#334155",
                          }}
                        >
                          <span>👤 {ct.nome}</span>
                          <span className="text-[11px] opacity-75">
                            ({ct.email})
                          </span>
                          {isSelected && (
                            <span className="text-[11px] font-bold text-[#0066CC]">
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Nome e E-mail do Solicitante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    className="text-xs font-semibold block mb-1.5"
                    style={{ color: "#475569" }}
                  >
                    Nome do Solicitante <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={solicitanteNome}
                    onChange={(e) => {
                      setSolicitanteNome(e.target.value)
                      if (errors.solicitanteNome)
                        setErrors((prev) => ({
                          ...prev,
                          solicitanteNome: null,
                        }))
                    }}
                    placeholder="Ex: Cristiano Richter"
                    className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                    style={{
                      borderColor: errors.solicitanteNome
                        ? "#EF4444"
                        : "#CBD5E1",
                      color: "#1E293B",
                      background: "#fff",
                      boxShadow: errors.solicitanteNome
                        ? "0 0 0 2px rgba(239, 68, 68, 0.15)"
                        : "none",
                    }}
                  />
                  {errors.solicitanteNome && (
                    <p
                      className="text-xs mt-1 font-medium"
                      style={{ color: "#EF4444" }}
                    >
                      {errors.solicitanteNome}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="text-xs font-semibold block mb-1.5"
                    style={{ color: "#475569" }}
                  >
                    E-mail do Solicitante{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={solicitanteEmail}
                    onChange={(e) => {
                      setSolicitanteEmail(e.target.value)
                      if (errors.solicitanteEmail)
                        setErrors((prev) => ({
                          ...prev,
                          solicitanteEmail: null,
                        }))
                    }}
                    placeholder="Ex: cristiano@empresa.com.br"
                    className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                    style={{
                      borderColor: errors.solicitanteEmail
                        ? "#EF4444"
                        : "#CBD5E1",
                      color: "#1E293B",
                      background: "#fff",
                      boxShadow: errors.solicitanteEmail
                        ? "0 0 0 2px rgba(239, 68, 68, 0.15)"
                        : "none",
                    }}
                  />
                  {errors.solicitanteEmail && (
                    <p
                      className="text-xs mt-1 font-medium"
                      style={{ color: "#EF4444" }}
                    >
                      {errors.solicitanteEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Detalhes do Chamado */}
          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between"
              style={{ color: "#0B2847", borderColor: "#E2E8F0" }}
            >
              <span>2. Detalhes da Solicitação</span>
              <span className="text-[10px] font-normal text-slate-500">
                Resumo e escopo
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Título / Assunto */}
              <div>
                <label
                  className="text-xs font-semibold block mb-1.5"
                  style={{ color: "#475569" }}
                >
                  Título / Assunto do Chamado{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={assunto}
                  onChange={(e) => {
                    setAssunto(e.target.value)
                    if (errors.assunto)
                      setErrors((prev) => ({ ...prev, assunto: null }))
                  }}
                  placeholder="Ex: TABELA DE FRETE - ERRO DE CÁLCULO CEP DESTINO SUL"
                  className="w-full text-sm border rounded-lg px-3 py-2.5 outline-none transition-all font-medium"
                  style={{
                    borderColor: errors.assunto ? "#EF4444" : "#CBD5E1",
                    color: "#1E293B",
                    background: "#fff",
                    boxShadow: errors.assunto
                      ? "0 0 0 2px rgba(239, 68, 68, 0.15)"
                      : "none",
                  }}
                />
                {errors.assunto && (
                  <p
                    className="text-xs mt-1 font-medium"
                    style={{ color: "#EF4444" }}
                  >
                    {errors.assunto}
                  </p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label
                  className="text-xs font-semibold block mb-1.5"
                  style={{ color: "#475569" }}
                >
                  Descrição Completa <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={descricao}
                  onChange={(e) => {
                    setDescricao(e.target.value)
                    if (errors.descricao)
                      setErrors((prev) => ({ ...prev, descricao: null }))
                  }}
                  placeholder="Detalhe com clareza o problema relatado pelo cliente, passos para reproduzir, impacto operacional ou instruções enviadas..."
                  className="w-full text-sm border rounded-lg px-3 py-2.5 outline-none transition-all resize-y"
                  style={{
                    borderColor: errors.descricao ? "#EF4444" : "#CBD5E1",
                    color: "#1E293B",
                    background: "#fff",
                    boxShadow: errors.descricao
                      ? "0 0 0 2px rgba(239, 68, 68, 0.15)"
                      : "none",
                  }}
                />
                {errors.descricao && (
                  <p
                    className="text-xs mt-1 font-medium"
                    style={{ color: "#EF4444" }}
                  >
                    {errors.descricao}
                  </p>
                )}
              </div>

              {/* Classificações Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                {/* Categoria */}
                <div>
                  <label
                    className="text-xs font-semibold block mb-1.5"
                    style={{ color: "#475569" }}
                  >
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none font-medium bg-white"
                    style={{ borderColor: "#CBD5E1", color: "#1E293B" }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prioridade */}
                <div>
                  <label
                    className="text-xs font-semibold block mb-1.5"
                    style={{ color: "#475569" }}
                  >
                    Prioridade <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value)}
                    className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none font-bold bg-white"
                    style={{
                      borderColor: "#CBD5E1",
                      color: PRIORITY_COLORS[prioridade] || "#1E293B",
                    }}
                  >
                    {priorities.map((p) => (
                      <option key={p} value={p}>
                        ● {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Canal */}
                <div>
                  <label
                    className="text-xs font-semibold block mb-1.5"
                    style={{ color: "#475569" }}
                  >
                    Canal de Origem <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={canal}
                    onChange={(e) => setCanal(e.target.value)}
                    className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none font-medium bg-white"
                    style={{ borderColor: "#CBD5E1", color: "#1E293B" }}
                  >
                    {channels.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch === "E-mail"
                          ? "✉️ E-mail"
                          : ch === "WhatsApp"
                            ? "💬 WhatsApp"
                            : ch === "Telefone"
                              ? "📞 Telefone"
                              : ch === "Chat"
                                ? "💬 Chat"
                                : "🌐 Portal"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transportadora vinculada */}
                <div>
                  <label
                    className="text-xs font-semibold block mb-1.5"
                    style={{ color: "#475569" }}
                  >
                    Transportadora (Opcional)
                  </label>
                  <select
                    value={transportadora}
                    onChange={(e) => setTransportadora(e.target.value)}
                    disabled={
                      !selectedClient || clientTransportadoras.length === 0
                    }
                    className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none font-medium bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    style={{ borderColor: "#CBD5E1", color: "#1E293B" }}
                  >
                    {!selectedClient ? (
                      <option value="">Selecione o cliente primeiro</option>
                    ) : clientTransportadoras.length === 0 ? (
                      <option value="">Nenhuma vinculada ao cliente</option>
                    ) : (
                      <>
                        <option value="">Nenhuma / Chamado Geral</option>
                        {clientTransportadoras.map((t) => (
                          <option key={t} value={t}>
                            🚛 {t}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {selectedClient && clientTransportadoras.length > 0 && (
                    <span
                      className="text-[10px] mt-1 block"
                      style={{ color: "#64748B" }}
                    >
                      {clientTransportadoras.length} vinculada(s) ao cliente
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Atribuição de Responsável */}
          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between"
              style={{ color: "#0B2847", borderColor: "#E2E8F0" }}
            >
              <span>3. Atribuição & Responsável</span>
              <span className="text-[10px] font-normal text-slate-500">
                Distribuição interna
              </span>
            </div>

            <div>
              <label
                className="text-xs font-semibold block mb-1.5"
                style={{ color: "#475569" }}
              >
                Atribuir chamado a
              </label>
              <select
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                className="w-full sm:w-80 text-sm border rounded-lg px-3 py-2 outline-none bg-white font-medium"
                style={{ borderColor: "#CBD5E1", color: "#1E293B" }}
              >
                <option value={CURRENT_USER.name}>
                  {CURRENT_USER.name} (Você - {CURRENT_USER.role || "Suporte"})
                </option>
                {USUARIOS.filter((u) => u.nome !== CURRENT_USER.name).map(
                  (u) => (
                    <option key={u.id} value={u.nome}>
                      {u.nome} ({u.setor})
                    </option>
                  ),
                )}
                <option value="Não atribuído">
                  Não atribuído (Pendente na Fila Geral)
                </option>
              </select>
              <p className="text-[11px] mt-1" style={{ color: "#64748B" }}>
                O analista designado receberá notificações sobre o tempo de
                atendimento e SLA deste chamado.
              </p>
            </div>
          </div>

          {/* 4. Anexos & Evidências */}
          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between"
              style={{ color: "#0B2847", borderColor: "#E2E8F0" }}
            >
              <span>4. Anexos & Evidências (Opcional)</span>
              <span className="text-[10px] font-normal text-slate-500">
                Comprovantes e planilhas
              </span>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors"
              style={{
                borderColor: isDragging ? "#0066CC" : "#CBD5E1",
                background: isDragging ? "#EBF4FF" : "#F8FAFC",
              }}
            >
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files)
                }}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-1.5">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0066CC"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div
                  className="text-xs font-semibold"
                  style={{ color: "#1E293B" }}
                >
                  Clique para anexar arquivos ou arraste-os para cá
                </div>
                <div className="text-[11px]" style={{ color: "#64748B" }}>
                  Suporta tabelas Excel (.xlsx, .csv), PDFs, logs e capturas de
                  tela (até 15MB cada)
                </div>
              </div>
            </div>

            {/* Attached files list */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border bg-white text-xs"
                    style={{ borderColor: "#E2E8F0" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#0066CC"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span
                        className="font-medium truncate"
                        style={{ color: "#1E293B" }}
                      >
                        {file.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({file.formattedSize})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-slate-400 hover:text-red-500 font-bold p-1 cursor-pointer"
                      title="Remover anexo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0"
          style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}
        >
          <span className="text-xs" style={{ color: "#64748B" }}>
            <span className="text-red-500 font-bold">*</span> Campos
            obrigatórios
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium border bg-white transition-colors hover:bg-slate-50 cursor-pointer"
              style={{ borderColor: "#CBD5E1", color: "#64748B" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
              style={{ background: "#0066CC" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0054a8"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0066CC"
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Criar Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function Tickets({ initialStatus, onViewTicket }) {
  const [tickets, setTickets] = useState(TICKETS)
  const [statusFilter, setStatusFilter] = useState(initialStatus || "Todos")
  const [priorityFilter, setPriorityFilter] = useState("Todas")
  const [typeFilter, setTypeFilter] = useState("Todos")
  const [channelFilter, setChannelFilter] = useState("Todos")
  const [clientSearch, setClientSearch] = useState("")
  const [showFilters, setShowFilters] = useState(true)
  const [selectedIds, setSelectedIds] = useState([])
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Timer state per ticket: { [ticketId]: { seconds, running } }
  const [timers, setTimers] = useState(() =>
    Object.fromEntries(
      TICKETS.map((t) => [t.id, { seconds: 0, running: false }]),
    ),
  )

  const updateTimer = useCallback((id, state) => {
    setTimers((prev) => ({ ...prev, [id]: state }))
  }, [])

  // Update a ticket in both state and in-memory module TICKETS
  function handleUpdateTicket(id, updates) {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    )
    const found = TICKETS.find((t) => t.id === id)
    if (found) Object.assign(found, updates)
  }

  // Create Ticket handler
  function handleCreateTicket(newTicketData) {
    const maxId = tickets.reduce((max, t) => {
      const num =
        typeof t.id === "number"
          ? t.id
          : parseInt(String(t.id).replace(/\D/g, ""), 10)
      return !isNaN(num) && num > max ? num : max
    }, 5460)
    const newId = maxId + 1

    const now = new Date()
    const dateStr = now.toISOString().split("T")[0]

    const newTicket = {
      id: newId,
      client: newTicketData.clientName,
      clientInitials: newTicketData.clientInitials || "CL",
      subject: newTicketData.subject,
      channel: newTicketData.channel.toLowerCase().includes("whats")
        ? "whatsapp"
        : newTicketData.channel.toLowerCase().includes("tel")
          ? "telefone"
          : newTicketData.channel.toLowerCase().includes("chat")
            ? "chat"
            : newTicketData.channel.toLowerCase().includes("port")
              ? "portal"
              : "email",
      channelName: newTicketData.channel,
      requester: newTicketData.requesterName.toLowerCase().replace(/\s+/g, "."),
      requesterName: newTicketData.requesterName,
      requesterEmail: newTicketData.requesterEmail,
      status: "Aberto",
      priority: newTicketData.priority,
      assignee: newTicketData.assignee,
      type: newTicketData.category,
      transportadora: newTicketData.transportadora || null,
      slaResolution:
        newTicketData.priority === "Urgente"
          ? "4 horas"
          : newTicketData.priority === "Alta"
            ? "1 dia"
            : newTicketData.priority === "Média"
              ? "2 dias"
              : "3 dias",
      slaResponse: "Aguardando primeira resposta",
      created: dateStr,
      updated: dateStr,
      messages: [
        {
          id: 1,
          from: newTicketData.requesterEmail,
          fromName: newTicketData.requesterName,
          type: "incoming",
          content: newTicketData.description,
          date: now.toISOString(),
          attachments: newTicketData.attachments || [],
        },
      ],
    }

    // Prepend to TICKETS mock store and React state
    TICKETS.unshift(newTicket)
    setTickets((prev) => [newTicket, ...prev])
    setTimers((prev) => ({
      ...prev,
      [newTicket.id]: { seconds: 0, running: false },
    }))
    setShowNovoModal(false)

    setToastMessage(`Ticket #${newId} criado com sucesso!`)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "Todos" && t.status !== statusFilter) return false
    if (priorityFilter !== "Todas" && t.priority !== priorityFilter)
      return false
    if (typeFilter !== "Todos" && t.type !== typeFilter) return false
    if (channelFilter !== "Todos") {
      const chFilter = channelFilter.toLowerCase()
      const tCh = (t.channel || "").toLowerCase()
      if (!tCh.includes(chFilter.slice(0, 4))) return false
    }
    if (
      clientSearch &&
      !t.client.toLowerCase().includes(clientSearch.toLowerCase())
    )
      return false
    return true
  })

  function toggleOne(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const activeFilterCount = [
    statusFilter !== "Todos",
    priorityFilter !== "Todas",
    typeFilter !== "Todos",
    channelFilter !== "Todos",
    !!clientSearch,
  ].filter(Boolean).length

  // Count running timers
  const runningCount = Object.values(timers).filter((t) => t.running).length

  return (
    <div
      className="flex flex-1 overflow-hidden"
      style={{ background: "#F4F6F9" }}
    >
      {/* Main feed */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-4 border-b bg-white flex-shrink-0"
          style={{ borderColor: "#E2E8F0" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                🎫 Tickets de Suporte
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-sm font-bold"
                style={{ background: "#0B2847", color: "#fff" }}
              >
                {filtered.length}
              </span>
              {runningCount > 0 && (
                <span
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: "#FFF1F2", color: "#E11D48" }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ background: "#E11D48" }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-1.5 w-1.5"
                      style={{ background: "#E11D48" }}
                    />
                  </span>
                  {runningCount} cronômetro{runningCount > 1 ? "s" : ""} ativo
                  {runningCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Novo Ticket Button */}
            <button
              onClick={() => setShowNovoModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-sm cursor-pointer"
              style={{ background: "#0066CC" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0054a8"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0066CC"
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              + Novo Ticket
            </button>
          </div>

          {/* Active filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {statusFilter !== "Todos" && (
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background: STATUS_COLORS[statusFilter]?.bg || "#EBF4FF",
                  color: STATUS_COLORS[statusFilter]?.color || "#0066CC",
                }}
              >
                Status: {statusFilter}
                <button onClick={() => setStatusFilter("Todos")}>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "#EBF4FF", color: "#0066CC" }}
            >
              Responsável: {CURRENT_USER.name}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <select
                className="text-xs border rounded-lg px-2 py-1.5 outline-none"
                style={{ borderColor: "#E2E8F0", color: "#64748B" }}
              >
                <option>Ordenar por: Data de criação ▾</option>
                <option>Ordenar por: Prioridade</option>
                <option>Ordenar por: SLA</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={{
                  borderColor: showFilters ? "#0066CC" : "#E2E8F0",
                  color: showFilters ? "#0066CC" : "#64748B",
                  background: showFilters ? "#EBF4FF" : "transparent",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>
          </div>
        </div>

        {/* Ticket feed */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {selectedIds.length > 0 && (
            <div
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: "#EBF4FF", color: "#0066CC" }}
            >
              <input type="checkbox" checked className="rounded" readOnly />
              {selectedIds.length} ticket(s) selecionado(s)
              <button className="ml-auto underline text-xs">
                Atribuir em lote
              </button>
              <button className="underline text-xs">Alterar status</button>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-3">🎫</div>
              <p className="font-medium" style={{ color: "#1E293B" }}>
                Nenhum ticket encontrado
              </p>
              <p className="text-sm mt-1" style={{ color: "#64748B" }}>
                Tente ajustar os filtros
              </p>
            </div>
          )}

          {filtered.map((ticket) => {
            const timerState = timers[ticket.id] || {
              seconds: 0,
              running: false,
            }

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-xl border flex items-stretch overflow-hidden cursor-pointer transition-all duration-150 group"
                style={{
                  borderColor: "#E2E8F0",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.08)"
                  e.currentTarget.style.borderColor = "#0066CC"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)"
                  e.currentTarget.style.borderColor = "#E2E8F0"
                }}
                onClick={() => onViewTicket(ticket.id)}
              >
                {/* Left priority bar */}
                <div
                  className="w-1 flex-shrink-0"
                  style={{ background: PRIORITY_COLORS[ticket.priority] }}
                />

                {/* Checkbox */}
                <div
                  className="flex items-center px-3"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleOne(ticket.id)
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(ticket.id)}
                    onChange={() => toggleOne(ticket.id)}
                    className="rounded"
                  />
                </div>

                {/* Avatar */}
                <div className="flex items-center px-2">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: "#0B2847" }}
                  >
                    {ticket.clientInitials}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 py-3 px-2 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full truncate max-w-[200px]"
                      style={{ background: "#F1F5F9", color: "#64748B" }}
                    >
                      {ticket.client}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: "#0066CC" }}
                    >
                      #{ticket.id}
                    </span>
                    {ticket.transportadora && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                        🚛 {ticket.transportadora}
                      </span>
                    )}
                  </div>
                  <div
                    className="font-semibold text-sm mb-1.5 truncate"
                    style={{ color: "#1E293B" }}
                  >
                    {ticket.subject}
                  </div>
                  <div
                    className="flex items-center gap-3 text-xs"
                    style={{ color: "#64748B" }}
                  >
                    <span className="flex items-center gap-1">
                      <TicketChannelIcon channel={ticket.channel} />
                      {ticket.requesterName || ticket.requester}
                    </span>
                    <span>•</span>
                    <span>{ticket.slaResponse}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      ⏳{" "}
                      <span
                        style={{
                          color:
                            ticket.status === "Vencido" ? "#E11D48" : "#64748B",
                        }}
                      >
                        {ticket.slaResolution}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Timer column */}
                <div
                  className="flex items-center px-3 border-l"
                  style={{ borderColor: "#F1F5F9" }}
                >
                  <TicketTimer
                    ticketId={ticket.id}
                    state={timerState}
                    onUpdate={updateTimer}
                  />
                </div>

                {/* Right inline selectors */}
                <div
                  className="flex items-center gap-3 px-4 flex-shrink-0 border-l"
                  style={{ borderColor: "#F1F5F9" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Priority */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          PRIORITY_COLORS[ticket.priority] || "#CBD5E1",
                      }}
                    />
                    <select
                      className="text-xs border-none bg-transparent outline-none cursor-pointer font-medium"
                      style={{
                        color: PRIORITY_COLORS[ticket.priority] || "#1E293B",
                      }}
                      value={ticket.priority}
                      onChange={(e) =>
                        handleUpdateTicket(ticket.id, {
                          priority: e.target.value,
                        })
                      }
                    >
                      <option>Urgente</option>
                      <option>Alta</option>
                      <option>Média</option>
                      <option>Baixa</option>
                    </select>
                  </div>
                  <div className="h-6 w-px" style={{ background: "#E2E8F0" }} />

                  {/* Assignee */}
                  <select
                    className="text-xs border-none bg-transparent outline-none cursor-pointer max-w-[120px] truncate"
                    style={{ color: "#64748B" }}
                    value={ticket.assignee}
                    onChange={(e) =>
                      handleUpdateTicket(ticket.id, {
                        assignee: e.target.value,
                      })
                    }
                  >
                    <option>Régis Rinaldi</option>
                    <option>Ana Paula Costa</option>
                    <option>Carlos Mendes</option>
                    <option>Beatriz Santos</option>
                    <option>Não atribuído</option>
                  </select>
                  <div className="h-6 w-px" style={{ background: "#E2E8F0" }} />

                  {/* Status */}
                  <select
                    className="text-xs font-medium border-none bg-transparent outline-none cursor-pointer"
                    style={{
                      color: STATUS_COLORS[ticket.status]?.color || "#0066CC",
                    }}
                    value={ticket.status}
                    onChange={(e) =>
                      handleUpdateTicket(ticket.id, { status: e.target.value })
                    }
                  >
                    <option>Aberto</option>
                    <option>A fazer</option>
                    <option>Pendente</option>
                    <option>Resolvido</option>
                    <option>Vencido</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div
          className="w-72 flex-shrink-0 flex flex-col border-l overflow-y-auto"
          style={{ background: "#fff", borderColor: "#E2E8F0" }}
        >
          <div
            className="flex items-center justify-between px-4 py-4 border-b"
            style={{ borderColor: "#E2E8F0" }}
          >
            <span
              className="font-semibold text-sm"
              style={{ color: "#1E293B" }}
            >
              Filtros Avançados
            </span>
            <button
              className="text-xs font-medium"
              style={{ color: "#0066CC" }}
              onClick={() => {
                setStatusFilter("Todos")
                setPriorityFilter("Todas")
                setTypeFilter("Todos")
                setChannelFilter("Todos")
                setClientSearch("")
              }}
            >
              Limpar Filtros
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            <FilterSection label="Responsável">
              <select
                className="w-full text-xs border rounded-lg px-3 py-2 outline-none"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                defaultValue={CURRENT_USER.name}
              >
                <option>Régis Rinaldi</option>
                <option>Ana Paula Costa</option>
                <option>Carlos Mendes</option>
                <option>Todos</option>
              </select>
            </FilterSection>
            <FilterSection label="Status">
              <div className="space-y-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={statusFilter === s}
                      onChange={() => setStatusFilter(s)}
                      className="accent-[#0066CC]"
                    />
                    <span className="text-xs" style={{ color: "#1E293B" }}>
                      {s}
                    </span>
                    {s !== "Todos" && (
                      <span
                        className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={
                          STATUS_COLORS[s] || {
                            background: "#F1F5F9",
                            color: "#64748B",
                          }
                        }
                      >
                        {tickets.filter((t) => t.status === s).length}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </FilterSection>
            <FilterSection label="Cliente">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full text-xs border rounded-lg px-3 py-2 outline-none"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
              />
            </FilterSection>
            <FilterSection label="Prioridade">
              <div className="flex gap-2 flex-wrap">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
                    style={{
                      borderColor:
                        priorityFilter === p
                          ? PRIORITY_COLORS[p] || "#0066CC"
                          : "#E2E8F0",
                      background:
                        priorityFilter === p
                          ? `${PRIORITY_COLORS[p] || "#0066CC"}18`
                          : "transparent",
                      color:
                        priorityFilter === p
                          ? PRIORITY_COLORS[p] || "#0066CC"
                          : "#64748B",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </FilterSection>
            <FilterSection label="Tipo de Ticket">
              <select
                className="w-full text-xs border rounded-lg px-3 py-2 outline-none"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </FilterSection>
            <FilterSection label="Canal / Fonte">
              <div className="flex gap-2">
                {CHANNEL_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setChannelFilter(c)}
                    className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={{
                      borderColor: channelFilter === c ? "#0066CC" : "#E2E8F0",
                      background:
                        channelFilter === c ? "#EBF4FF" : "transparent",
                      color: channelFilter === c ? "#0066CC" : "#64748B",
                    }}
                  >
                    {c === "E-mail" ? "✉️ " : c === "WhatsApp" ? "💬 " : ""}
                    {c}
                  </button>
                ))}
              </div>
            </FilterSection>
            <FilterSection label="Prazo para Resolução (SLA)">
              <select
                className="w-full text-xs border rounded-lg px-3 py-2 outline-none"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
              >
                <option>A qualquer momento</option>
                <option>Próximas 24h</option>
                <option>Esta semana</option>
                <option>Vencido</option>
              </select>
            </FilterSection>
            <FilterSection label="Data de Criação">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="text-xs border rounded-lg px-2 py-1.5 outline-none"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                />
                <input
                  type="date"
                  className="text-xs border rounded-lg px-2 py-1.5 outline-none"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                />
              </div>
            </FilterSection>
          </div>
          <div className="p-4 border-t" style={{ borderColor: "#E2E8F0" }}>
            <button
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer"
              style={{ background: "#0066CC" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0054a8"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0066CC"
              }}
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Novo Ticket Modal */}
      <NovoTicketModal
        isOpen={showNovoModal}
        onClose={() => setShowNovoModal(false)}
        onCreateTicket={handleCreateTicket}
      />

      {/* Success Toast */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all"
          style={{
            background: "#ECFDF5",
            borderColor: "#A7F3D0",
            color: "#065F46",
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "#10B981" }}
          >
            ✓
          </div>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-xs opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
