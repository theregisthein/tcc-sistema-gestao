import { useState, useRef, useEffect } from "react"
import { CLIENTES, TRANSPORTADORAS } from "../data/mock"
import { configStore } from "./Configuracoes"

const PLAN_COLORS = {
  Enterprise: { bg: "#F5F3FF", color: "#7C3AED" },
  Profissional: { bg: "#EBF4FF", color: "#0066CC" },
  Starter: { bg: "#ECFDF5", color: "#10B981" },
}

// Inline dropdown component
function InlineSelect({
  value,
  options,
  onChange,
  renderOption,
  renderSelected,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className="flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-[#F1F5F9] border border-transparent hover:border-[#E2E8F0]"
      >
        {renderSelected ? (
          renderSelected(value)
        ) : (
          <span className="text-xs font-medium" style={{ color: "#1E293B" }}>
            {value}
          </span>
        )}
        <svg
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-lg border min-w-[140px]"
          style={{ background: "#fff", borderColor: "#E2E8F0" }}
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-[#F4F6F9] transition-colors"
              style={{
                background: opt === value ? "#F4F6F9" : "transparent",
                fontWeight: opt === value ? 600 : 400,
              }}
            >
              {opt === value && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0066CC"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {opt !== value && <span className="w-2.5" />}
              {renderOption ? (
                renderOption(opt)
              ) : (
                <span style={{ color: "#1E293B" }}>{opt}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Inline editable text
function InlineText({ value, onChange, placeholder }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  function confirm() {
    onChange(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        className="text-xs border rounded px-1.5 py-0.5 outline-none w-28"
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={confirm}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirm()
          if (e.key === "Escape") {
            setDraft(String(value))
            setEditing(false)
          }
        }}
        style={{ borderColor: "#0066CC", color: "#1E293B" }}
      />
    )
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
      className="flex items-center gap-1 text-xs rounded px-1 py-0.5 hover:bg-[#F1F5F9] border border-transparent hover:border-[#E2E8F0]"
      style={{ color: "#1E293B" }}
    >
      <span className="font-medium">{value || placeholder}</span>
      <svg
        width="9"
        height="9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#94A3B8"
        strokeWidth="2"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  )
}

// Form field helper for modals
function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label
        className="text-xs font-medium block mb-1.5"
        style={{ color: "#64748B" }}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
        style={{ borderColor: "#E2E8F0", color: "#1E293B", background: "#fff" }}
        onFocus={(e) => {
          e.target.style.borderColor = "#0066CC"
          e.target.style.boxShadow = "0 0 0 3px rgba(0,102,204,0.1)"
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#E2E8F0"
          e.target.style.boxShadow = "none"
        }}
      />
    </div>
  )
}

function ModalSection({ title, children }) {
  return (
    <div>
      <div
        className="text-xs font-semibold uppercase tracking-wider mb-3 pb-2 border-b"
        style={{ color: "#64748B", borderColor: "#E2E8F0" }}
      >
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

// Money formatting helper for BRL
function formatMoneyBRL(value) {
  if (value === null || value === undefined || value === "") return "R$ 0,00"
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }
  const digits = String(value).replace(/\D/g, "")
  if (!digits) return "R$ 0,00"
  const num = Number(digits) / 100
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

// Money input component for BRL
function MoneyField({
  label,
  value,
  onChange,
  placeholder = "R$ 0,00",
  required = false,
}) {
  const displayValue = formatMoneyBRL(value)

  function handleChange(e) {
    const raw = e.target.value.replace(/\D/g, "")
    if (!raw) {
      onChange("R$ 0,00")
      return
    }
    const num = Number(raw) / 100
    const formatted = num.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
    onChange(formatted)
  }

  return (
    <div>
      <label
        className="text-xs font-medium block mb-1.5"
        style={{ color: "#64748B" }}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full text-sm font-semibold border rounded-lg px-3 py-2 outline-none transition-all"
        style={{ borderColor: "#E2E8F0", color: "#1E293B", background: "#fff" }}
        onFocus={(e) => {
          e.target.style.borderColor = "#0066CC"
          e.target.style.boxShadow = "0 0 0 3px rgba(0,102,204,0.1)"
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#E2E8F0"
          e.target.style.boxShadow = "none"
        }}
      />
    </div>
  )
}

// Autocomplete com busca para vincular transportadoras cadastradas
function TransportadorasSelector({
  selected = [],
  onAdd,
  onRemove,
  allOptions = [],
}) {
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

  // Filtra as opções cadastradas que ainda não foram vinculadas
  const available = allOptions.filter((opt) => {
    const isAlreadySelected = (selected || []).includes(opt)
    if (isAlreadySelected) return false
    if (!query.trim()) return true
    return opt.toLowerCase().includes(query.toLowerCase().trim())
  })

  function handleAdd(itemToAdd) {
    const target = (itemToAdd || query).trim()
    if (!target) return
    const matched =
      available.find((t) => t.toLowerCase() === target.toLowerCase()) ||
      (available.length > 0 && !itemToAdd ? available[0] : target)

    if (matched && !(selected || []).includes(matched)) {
      onAdd(matched)
      setQuery("")
      setIsOpen(false)
    }
  }

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Campo de busca com autocomplete e botão adicionar */}
      <div>
        <label
          className="text-xs font-medium block mb-1.5"
          style={{ color: "#64748B" }}
        >
          Adicionar Transportadora Homologada
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
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
                <path d="m21 21-4.35-4.35" />
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAdd()
                }
                if (e.key === "Escape") {
                  setIsOpen(false)
                }
              }}
              placeholder="Digite para buscar transportadora..."
              className="w-full text-xs pl-9 pr-8 py-2 border rounded-lg outline-none transition-all"
              style={{
                borderColor: "#E2E8F0",
                color: "#1E293B",
                background: "#fff",
              }}
              onFocusCapture={(e) => {
                e.target.style.borderColor = "#0066CC"
                e.target.style.boxShadow = "0 0 0 2px rgba(0,102,204,0.1)"
              }}
              onBlurCapture={(e) => {
                e.target.style.borderColor = "#E2E8F0"
                e.target.style.boxShadow = "none"
              }}
            />
            {/* Botão para abrir o catálogo */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#1E293B] cursor-pointer"
              title="Abrir catálogo de transportadoras cadastradas"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Menu Dropdown com autocomplete */}
            {isOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border rounded-xl shadow-xl max-h-52 overflow-y-auto"
                style={{ borderColor: "#E2E8F0" }}
              >
                <div
                  className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider border-b bg-[#F8FAFC]"
                  style={{ color: "#64748B", borderColor: "#F1F5F9" }}
                >
                  Transportadoras Cadastradas ({available.length})
                </div>
                {available.length === 0 ? (
                  <div className="p-3 text-xs text-center text-[#94A3B8]">
                    {query.trim()
                      ? `Nenhuma transportadora encontrada para "${query}"`
                      : "Todas as transportadoras cadastradas já estão vinculadas a este cliente."}
                  </div>
                ) : (
                  <div className="py-1">
                    {available.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleAdd(t)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                        style={{ color: "#1E293B" }}
                      >
                        <span className="flex items-center gap-2">
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#0066CC"
                            strokeWidth="2"
                          >
                            <rect x="1" y="3" width="15" height="13" rx="2" />
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                          </svg>
                          <span className="font-medium">{t}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-[#0066CC]">
                          + Vincular
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleAdd()}
            disabled={!query.trim() && available.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
            style={{ background: "#0066CC" }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled)
                e.currentTarget.style.background = "#0054a8"
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled)
                e.currentTarget.style.background = "#0066CC"
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Adicionar
          </button>
        </div>
      </div>

      {/* Exibição apenas das transportadoras vinculadas */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[#64748B]">
            Transportadoras vinculadas ({selected.length})
          </span>
        </div>

        {selected.length === 0 ? (
          <div
            className="text-xs text-[#94A3B8] italic p-3 rounded-lg border border-dashed text-center bg-[#F8FAFC]"
            style={{ borderColor: "#CBD5E1" }}
          >
            Nenhuma transportadora vinculada ao cliente no momento.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selected.map((tName) => (
              <span
                key={tName}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border shadow-2xs transition-all"
                style={{
                  background: "#EBF4FF",
                  borderColor: "#BFDBFE",
                  color: "#0066CC",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span>{tName}</span>
                <button
                  type="button"
                  onClick={() => onRemove(tName)}
                  className="ml-0.5 p-0.5 rounded hover:bg-blue-200 text-blue-700 hover:text-red-600 transition-colors cursor-pointer"
                  title={`Desvincular ${tName}`}
                >
                  <svg
                    width="12"
                    height="12"
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Seção dinâmica de Parceiros / Integrações (ERPs, WMS, TMS, etc.)
function ParceirosSection({ parceiros = [], onChange }) {
  const [tagInput, setTagInput] = useState("")
  const items = Array.isArray(parceiros) ? parceiros : []

  function handleAddTag() {
    const trimmed = tagInput.trim()
    if (!trimmed) return
    if (items.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setTagInput("")
      return
    }
    onChange([...items, trimmed])
    setTagInput("")
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  function handleRemove(tagToRemove) {
    onChange(items.filter((p) => p !== tagToRemove))
  }

  return (
    <div>
      <div
        className="flex items-center justify-between pb-2 mb-3 border-b"
        style={{ borderColor: "#E2E8F0" }}
      >
        <div>
          <span
            className="text-xs font-semibold uppercase tracking-wider block"
            style={{ color: "#64748B" }}
          >
            4. Parceiros & Integrações Tecnológicas
          </span>
          <span className="text-[11px] text-[#94A3B8]">
            ERPs, WMS, TMS ou parceiros de tecnologia do cliente
          </span>
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: "#F1F5F9", color: "#64748B" }}
        >
          {items.length} {items.length === 1 ? "parceiro" : "parceiros"}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
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
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite a integração/parceiro (ex: SAP, TOTVS, Bling, Senior WMS) e tecle Enter..."
              className="w-full text-xs pl-9 pr-3 py-2 border rounded-lg outline-none transition-all"
              style={{
                borderColor: "#E2E8F0",
                color: "#1E293B",
                background: "#fff",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#0066CC"
                e.target.style.boxShadow = "0 0 0 2px rgba(0,102,204,0.1)"
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E2E8F0"
                e.target.style.boxShadow = "none"
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleAddTag}
            disabled={!tagInput.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
            style={{ background: "#0066CC" }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled)
                e.currentTarget.style.background = "#0054a8"
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled)
                e.currentTarget.style.background = "#0066CC"
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Adicionar
          </button>
        </div>

        {/* Badges / Tags list */}
        {items.length === 0 ? (
          <div
            className="p-3.5 rounded-lg border border-dashed text-center bg-[#F8FAFC]"
            style={{ borderColor: "#CBD5E1" }}
          >
            <p className="text-xs text-[#94A3B8]">
              Nenhum parceiro ou integração cadastrado. Digite o nome acima e
              pressione Enter ou clique em Adicionar.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {items.map((partner) => (
              <span
                key={partner}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border shadow-2xs transition-all"
                style={{
                  background: "#F5F3FF",
                  borderColor: "#DDD6FE",
                  color: "#6D28D9",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                <span className="font-semibold">{partner}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(partner)}
                  className="ml-0.5 p-0.5 rounded hover:bg-purple-200 text-purple-700 hover:text-red-600 transition-colors cursor-pointer"
                  title={`Remover ${partner}`}
                >
                  <svg
                    width="12"
                    height="12"
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Seção de Anexos do Cliente (contratos, atas, termos, documentações de integração)
function AnexosSection({ anexos = [], onChange }) {
  const fileInputRef = useRef(null)
  const items = Array.isArray(anexos) ? anexos : []

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  function handleFilesAdded(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newItems = files.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: formatBytes(file.size),
      data: new Date().toISOString().slice(0, 10),
    }))

    onChange([...items, ...newItems])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function removeAnexo(idOrIdx) {
    onChange(
      items.filter((item, idx) => item.id !== idOrIdx && idx !== idOrIdx),
    )
  }

  return (
    <div>
      <div
        className="flex items-center justify-between pb-2 mb-3 border-b"
        style={{ borderColor: "#E2E8F0" }}
      >
        <div>
          <span
            className="text-xs font-semibold uppercase tracking-wider block"
            style={{ color: "#64748B" }}
          >
            6. Anexos & Documentações
          </span>
          <span className="text-[11px] text-[#94A3B8]">
            Contratos, atas, termos de adesão e documentações de integração
          </span>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border"
          style={{
            borderColor: "#0066CC",
            color: "#0066CC",
            background: "#F8FAFC",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#EBF4FF"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#F8FAFC"
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          Anexar Arquivos
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFilesAdded}
        className="hidden"
      />

      {/* Upload zone or list */}
      {items.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-6 rounded-xl border border-dashed text-center bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-all cursor-pointer group"
          style={{ borderColor: "#CBD5E1" }}
        >
          <div
            className="w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-2 text-[#64748B] group-hover:text-[#0066CC] group-hover:scale-105 transition-all"
            style={{ background: "#EEF2F6" }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-[#1E293B] mb-0.5">
            Clique para selecionar arquivos do seu computador
          </p>
          <p className="text-[11px] text-[#94A3B8]">
            PDF, DOCX, XLSX, TXT, PNG ou JPG (contratos, atas, termos assinados)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((anexo, idx) => (
            <div
              key={anexo.id || idx}
              className="flex items-center justify-between p-2.5 rounded-xl border bg-white hover:border-[#CBD5E1] transition-all"
              style={{ borderColor: "#E2E8F0" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#F1F5F9", color: "#0066CC" }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div
                    className="text-xs font-semibold text-[#1E293B] truncate max-w-sm"
                    title={anexo.name}
                  >
                    {anexo.name}
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    {anexo.size}{" "}
                    {anexo.data ? `• Adicionado em ${anexo.data}` : ""}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => removeAnexo(anexo.id || idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remover arquivo anexo"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 border border-dashed rounded-lg text-xs font-medium text-[#64748B] hover:text-[#0066CC] hover:bg-[#F8FAFC] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            style={{ borderColor: "#CBD5E1" }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Anexar mais um arquivo
          </button>
        </div>
      )}
    </div>
  )
}

// Seção dinâmica de contatos em pares [Nome] e [E-mail]
function ContatosSection({ contatos = [], onChange }) {
  const items = Array.isArray(contatos) ? contatos : []

  function addContato() {
    onChange([
      ...items,
      { id: Date.now() + Math.random(), nome: "", email: "" },
    ])
  }

  function updateContato(idx, field, value) {
    const updated = items.map((c, i) =>
      i === idx ? { ...c, [field]: value } : c,
    )
    onChange(updated)
  }

  function removeContato(idx) {
    const updated = items.filter((_, i) => i !== idx)
    onChange(updated)
  }

  return (
    <div>
      <div
        className="flex items-center justify-between pb-2 mb-3 border-b"
        style={{ borderColor: "#E2E8F0" }}
      >
        <div
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "#64748B" }}
        >
          5. Contatos & Canais Autorizados
        </div>
        <button
          type="button"
          onClick={addContato}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border"
          style={{
            borderColor: "#0066CC",
            color: "#0066CC",
            background: "#F8FAFC",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#EBF4FF"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#F8FAFC"
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar Contato
        </button>
      </div>

      {items.length === 0 ? (
        <div
          className="p-5 rounded-xl border border-dashed text-center bg-[#F8FAFC]"
          style={{ borderColor: "#CBD5E1" }}
        >
          <p className="text-xs text-[#64748B] mb-2.5">
            Nenhum contato autorizado cadastrado para este cliente.
          </p>
          <button
            type="button"
            onClick={addContato}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs cursor-pointer"
            style={{ background: "#0066CC" }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Adicionar Primeiro Contato
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="grid grid-cols-[1fr_1fr_40px] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            <div>Nome do Contato</div>
            <div>E-mail Autorizado</div>
            <div></div>
          </div>
          {items.map((contato, idx) => (
            <div
              key={contato.id || idx}
              className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center p-2 rounded-xl border bg-white transition-all hover:border-[#CBD5E1]"
              style={{ borderColor: "#E2E8F0" }}
            >
              <div>
                <input
                  type="text"
                  value={contato.nome || ""}
                  onChange={(e) => updateContato(idx, "nome", e.target.value)}
                  placeholder="Nome (ex: Carlos Silva)"
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-none transition-all"
                  style={{
                    borderColor: "#E2E8F0",
                    color: "#1E293B",
                    background: "#fff",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066CC"
                    e.target.style.boxShadow = "0 0 0 2px rgba(0,102,204,0.1)"
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E2E8F0"
                    e.target.style.boxShadow = "none"
                  }}
                />
              </div>
              <div>
                <input
                  type="email"
                  value={contato.email || ""}
                  onChange={(e) => updateContato(idx, "email", e.target.value)}
                  placeholder="E-mail (ex: carlos@empresa.com.br)"
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-none transition-all"
                  style={{
                    borderColor: "#E2E8F0",
                    color: "#1E293B",
                    background: "#fff",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0066CC"
                    e.target.style.boxShadow = "0 0 0 2px rgba(0,102,204,0.1)"
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E2E8F0"
                    e.target.style.boxShadow = "none"
                  }}
                />
              </div>
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removeContato(idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remover este contato"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Modal da Ficha Completa do Cliente
function FichaClienteModal({
  client,
  onClose,
  onSave,
  planOptions,
  allTransportadoras,
}) {
  const [form, setForm] = useState({
    id: client.id,
    razaoSocial: client.razaoSocial || "",
    nomeFantasia: client.nomeFantasia || "",
    cnpj: client.cnpj || "",
    dominio: client.dominio || "",
    adminEmail: client.adminEmail || "",
    filiais: client.filiais ?? "0",
    contaFrete: client.contaFrete
      ? formatMoneyBRL(client.contaFrete)
      : "R$ 0,00",
    transportadoras: client.transportadoras ? [...client.transportadoras] : [],
    contrato: client.contrato || "",
    dataFinalContrato: client.dataFinalContrato || "",
    inicioImplantacao: client.inicioImplantacao || "",
    dataFinalImplantacao: client.dataFinalImplantacao || "",
    dataGoLive: client.dataGoLive || "",
    parceiros: Array.isArray(client.parceiros) ? [...client.parceiros] : [],
    anexos: Array.isArray(client.anexos) ? [...client.anexos] : [],
    plano: client.plano || "Profissional",
    status: client.status || "Ativo",
    contatos: Array.isArray(client.contatos)
      ? client.contatos.map((ct) => ({ ...ct }))
      : client.emailsAutorizados
        ? client.emailsAutorizados.split(",").map((em, idx) => ({
            id: idx + 1,
            nome: "",
            email: em.trim(),
          }))
        : [],
  })

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleAddTransportadora(tName) {
    if (!tName) return
    setForm((prev) => {
      const current = prev.transportadoras || []
      if (current.includes(tName)) return prev
      return { ...prev, transportadoras: [...current, tName] }
    })
  }

  function handleRemoveTransportadora(tName) {
    setForm((prev) => ({
      ...prev,
      transportadoras: (prev.transportadoras || []).filter((t) => t !== tName),
    }))
  }

  function handleSave() {
    onSave({
      ...form,
      contaFrete: formatMoneyBRL(form.contaFrete),
    })
  }

  const initials = (form.nomeFantasia || form.razaoSocial || "CL")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(11,40,71,0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b bg-white flex-shrink-0"
          style={{ borderColor: "#E2E8F0" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-[#F1F5F9] cursor-pointer"
              style={{ borderColor: "#E2E8F0", color: "#64748B" }}
              title="Voltar para a listagem"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Voltar
            </button>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: "#0B2847" }}
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className="text-base font-bold"
                  style={{ color: "#1E293B" }}
                >
                  Ficha do Cliente: {form.nomeFantasia || form.razaoSocial}
                </h2>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={
                    form.status === "Ativo"
                      ? { background: "#ECFDF5", color: "#10B981" }
                      : { background: "#F1F5F9", color: "#64748B" }
                  }
                >
                  {form.status}
                </span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={
                    PLAN_COLORS[form.plano] || {
                      background: "#F1F5F9",
                      color: "#64748B",
                    }
                  }
                >
                  {form.plano}
                </span>
              </div>
              <div className="text-xs" style={{ color: "#64748B" }}>
                {form.razaoSocial} · {form.dominio || "Sem domínio definido"}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            title="Fechar ficha"
          >
            <svg
              width="20"
              height="20"
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Highlights Bar */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 rounded-xl border bg-[#F8FAFC]"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-0.5">
                CNPJ Principal
              </div>
              <div className="text-xs font-mono font-medium text-[#1E293B] truncate">
                {form.cnpj || "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-0.5">
                Domínio
              </div>
              <div className="text-xs font-medium text-[#0066CC] truncate">
                {form.dominio || "—"}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-0.5">
                Conta Frete
              </div>
              <div className="text-xs font-semibold text-[#1E293B]">
                {formatMoneyBRL(form.contaFrete)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-0.5">
                Data Go-live
              </div>
              <div className="text-xs font-semibold text-[#F26522] flex items-center gap-1">
                <span>🚀</span> {form.dataGoLive || "A definir"}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-0.5">
                Filiais Cadastradas
              </div>
              <div className="text-xs font-medium text-[#1E293B]">
                {form.filiais === "—" ||
                form.filiais === "0" ||
                form.filiais === 0
                  ? "Nenhuma filial"
                  : `${form.filiais} filiais`}
              </div>
            </div>
          </div>

          {/* Section 1: Empresa */}
          <ModalSection title="1. Identificação da Empresa">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                label="Razão Social"
                value={form.razaoSocial}
                onChange={(v) => update("razaoSocial", v)}
                placeholder="Ex: Móveis Florense Ltda"
              />
              <FormField
                label="Nome Fantasia"
                value={form.nomeFantasia}
                onChange={(v) => update("nomeFantasia", v)}
                placeholder="Ex: Florense"
              />
              <FormField
                label="CNPJ Principal"
                value={form.cnpj}
                onChange={(v) => update("cnpj", v)}
                placeholder="00.000.000/0001-00"
              />
              <FormField
                label="Domínio Corporativo"
                value={form.dominio}
                onChange={(v) => update("dominio", v)}
                placeholder="empresa.fretegestao.com.br"
              />
              <FormField
                label="Usuário Administrador (E-mail)"
                value={form.adminEmail}
                onChange={(v) => update("adminEmail", v)}
                placeholder="admin@empresa.com.br"
                type="email"
              />
              <FormField
                label="Filiais (Quantidade ou CNPJs)"
                value={form.filiais}
                onChange={(v) => update("filiais", v)}
                placeholder="Ex: 3"
              />
            </div>
          </ModalSection>

          {/* Section 2: Operação de Frete */}
          <ModalSection title="2. Operação de Frete & Transportadoras">
            <div className="space-y-4">
              <div className="max-w-xs">
                <MoneyField
                  label="Conta Frete"
                  value={form.contaFrete}
                  onChange={(v) => update("contaFrete", v)}
                  placeholder="R$ 0,00"
                />
              </div>

              <TransportadorasSelector
                selected={form.transportadoras}
                onAdd={handleAddTransportadora}
                onRemove={handleRemoveTransportadora}
                allOptions={allTransportadoras}
              />
            </div>
          </ModalSection>

          {/* Section 3: Contrato, Marcos & Prazos */}
          <ModalSection title="3. Contrato, Marcos & Prazos">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField
                label="Data de Assinatura do Contrato"
                value={form.contrato}
                onChange={(v) => update("contrato", v)}
                type="date"
              />
              <FormField
                label="Data Final de Contrato"
                value={form.dataFinalContrato}
                onChange={(v) => update("dataFinalContrato", v)}
                type="date"
              />
              <FormField
                label="Data de Início da Implantação"
                value={form.inicioImplantacao}
                onChange={(v) => update("inicioImplantacao", v)}
                type="date"
              />
              <FormField
                label="Data Final de Implantação"
                value={form.dataFinalImplantacao}
                onChange={(v) => update("dataFinalImplantacao", v)}
                type="date"
              />
              <div className="sm:col-span-2 lg:col-span-1">
                <FormField
                  label="Data Go-live (Virada de Chave)"
                  value={form.dataGoLive}
                  onChange={(v) => update("dataGoLive", v)}
                  type="date"
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: "#64748B" }}
                >
                  Plano Contratado
                </label>
                <select
                  className="w-full text-sm border rounded-lg px-3 py-2 outline-none bg-white font-medium cursor-pointer"
                  value={form.plano}
                  onChange={(e) => update("plano", e.target.value)}
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                >
                  {planOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: "#64748B" }}
                >
                  Status Operacional
                </label>
                <select
                  className="w-full text-sm border rounded-lg px-3 py-2 outline-none bg-white font-medium cursor-pointer"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
            </div>
          </ModalSection>

          {/* Section 4: Parceiros & Integrações */}
          <ParceirosSection
            parceiros={form.parceiros}
            onChange={(newParceiros) => update("parceiros", newParceiros)}
          />

          {/* Section 5: Contatos Autorizados */}
          <ContatosSection
            contatos={form.contatos}
            onChange={(newContatos) => update("contatos", newContatos)}
          />

          {/* Section 6: Anexos e Documentações */}
          <AnexosSection
            anexos={form.anexos}
            onChange={(newAnexos) => update("anexos", newAnexos)}
          />
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t bg-[#F8FAFC] flex-shrink-0"
          style={{ borderColor: "#E2E8F0" }}
        >
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-white cursor-pointer"
            style={{ borderColor: "#CBD5E1", color: "#64748B" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Voltar para a Lista
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-white cursor-pointer"
              style={{ borderColor: "#E2E8F0", color: "#64748B" }}
            >
              Fechar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-sm cursor-pointer"
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal para Adicionar Novo Cliente
function NovoClienteModal({ onClose, onAdd, planOptions, allTransportadoras }) {
  const [form, setForm] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    dominio: "",
    adminEmail: "",
    filiais: "0",
    contaFrete: "R$ 0,00",
    transportadoras: [],
    contrato: new Date().toISOString().slice(0, 10),
    dataFinalContrato: "",
    inicioImplantacao: new Date().toISOString().slice(0, 10),
    dataFinalImplantacao: "",
    dataGoLive: "",
    parceiros: [],
    anexos: [],
    plano: planOptions[0] || "Profissional",
    status: "Ativo",
    contatos: [{ id: 1, nome: "", email: "" }],
  })

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleAddTransportadora(tName) {
    if (!tName) return
    setForm((prev) => {
      const current = prev.transportadoras || []
      if (current.includes(tName)) return prev
      return { ...prev, transportadoras: [...current, tName] }
    })
  }

  function handleRemoveTransportadora(tName) {
    setForm((prev) => ({
      ...prev,
      transportadoras: (prev.transportadoras || []).filter((t) => t !== tName),
    }))
  }

  function handleSubmit() {
    if (!form.razaoSocial.trim() && !form.nomeFantasia.trim()) return
    onAdd({
      ...form,
      id: Date.now(),
      nomeFantasia: form.nomeFantasia.trim() || form.razaoSocial.trim(),
      razaoSocial: form.razaoSocial.trim() || form.nomeFantasia.trim(),
      contaFrete: formatMoneyBRL(form.contaFrete),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(11,40,71,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "#E2E8F0" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "#1E293B" }}>
            Novo Cliente
          </h2>
          <button
            onClick={onClose}
            style={{ color: "#64748B" }}
            className="cursor-pointer"
          >
            <svg
              width="20"
              height="20"
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

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <ModalSection title="1. Identificação da Empresa">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                label="Razão Social"
                value={form.razaoSocial}
                onChange={(v) => update("razaoSocial", v)}
                placeholder="Ex: Móveis Florense Ltda"
                required
              />
              <FormField
                label="Nome Fantasia"
                value={form.nomeFantasia}
                onChange={(v) => update("nomeFantasia", v)}
                placeholder="Ex: Florense"
              />
              <FormField
                label="CNPJ Principal"
                value={form.cnpj}
                onChange={(v) => update("cnpj", v)}
                placeholder="00.000.000/0001-00"
                required
              />
              <FormField
                label="Domínio"
                value={form.dominio}
                onChange={(v) => update("dominio", v)}
                placeholder="empresa.fretegestao.com.br"
              />
              <FormField
                label="Usuário Administrador (E-mail)"
                value={form.adminEmail}
                onChange={(v) => update("adminEmail", v)}
                placeholder="admin@empresa.com.br"
                type="email"
              />
              <FormField
                label="Filiais (CNPJs adicionais ou Qtd)"
                value={form.filiais}
                onChange={(v) => update("filiais", v)}
                placeholder="Ex: 2 filiais"
              />
            </div>
          </ModalSection>

          <ModalSection title="2. Operação de Frete & Transportadoras">
            <div className="space-y-4">
              <div className="max-w-xs">
                <MoneyField
                  label="Conta Frete"
                  value={form.contaFrete}
                  onChange={(v) => update("contaFrete", v)}
                  placeholder="R$ 0,00"
                />
              </div>

              <TransportadorasSelector
                selected={form.transportadoras}
                onAdd={handleAddTransportadora}
                onRemove={handleRemoveTransportadora}
                allOptions={allTransportadoras}
              />
            </div>
          </ModalSection>

          <ModalSection title="3. Contrato, Marcos & Prazos">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField
                label="Data de Assinatura"
                value={form.contrato}
                onChange={(v) => update("contrato", v)}
                type="date"
              />
              <FormField
                label="Data Final de Contrato"
                value={form.dataFinalContrato}
                onChange={(v) => update("dataFinalContrato", v)}
                type="date"
              />
              <FormField
                label="Início da Implantação"
                value={form.inicioImplantacao}
                onChange={(v) => update("inicioImplantacao", v)}
                type="date"
              />
              <FormField
                label="Data Final de Implantação"
                value={form.dataFinalImplantacao}
                onChange={(v) => update("dataFinalImplantacao", v)}
                type="date"
              />
              <div className="sm:col-span-2 lg:col-span-1">
                <FormField
                  label="Data Go-live (Virada de Chave)"
                  value={form.dataGoLive}
                  onChange={(v) => update("dataGoLive", v)}
                  type="date"
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: "#64748B" }}
                >
                  Plano
                </label>
                <select
                  className="w-full text-sm border rounded-lg px-3 py-2 outline-none bg-white font-medium cursor-pointer"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  value={form.plano}
                  onChange={(e) => update("plano", e.target.value)}
                >
                  {planOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: "#64748B" }}
                >
                  Status inicial
                </label>
                <select
                  className="w-full text-sm border rounded-lg px-3 py-2 outline-none bg-white font-medium cursor-pointer"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
            </div>
          </ModalSection>

          <ParceirosSection
            parceiros={form.parceiros}
            onChange={(newParceiros) => update("parceiros", newParceiros)}
          />

          <ContatosSection
            contatos={form.contatos}
            onChange={(newContatos) => update("contatos", newContatos)}
          />

          <AnexosSection
            anexos={form.anexos}
            onChange={(newAnexos) => update("anexos", newAnexos)}
          />
        </div>

        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: "#E2E8F0" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer"
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
            style={{ background: "#0066CC" }}
            disabled={!form.razaoSocial.trim() && !form.nomeFantasia.trim()}
          >
            Salvar Cliente
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Clientes() {
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState("Todos")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(null)

  // Mutable client list with editable fields
  const [clients, setClients] = useState(
    CLIENTES.map((c) => ({
      ...c,
      filiais: c.filiais === 0 ? "—" : String(c.filiais),
      contaFrete: formatMoneyBRL(c.contaFrete),
      dataFinalContrato: c.dataFinalContrato || "",
      dataFinalImplantacao: c.dataFinalImplantacao || "",
      dataGoLive: c.dataGoLive || "",
      parceiros: Array.isArray(c.parceiros) ? [...c.parceiros] : [],
      anexos: Array.isArray(c.anexos) ? [...c.anexos] : [],
      contatos: Array.isArray(c.contatos)
        ? c.contatos
        : c.emailsAutorizados
          ? c.emailsAutorizados.split(",").map((em, idx) => ({
              id: idx + 1,
              nome: "",
              email: em.trim(),
            }))
          : [],
    })),
  )

  function updateClient(id, field, value) {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    )
  }

  function handleSaveFicha(updatedClient) {
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)),
    )
    const idx = CLIENTES.findIndex((c) => c.id === updatedClient.id)
    if (idx !== -1) {
      CLIENTES[idx] = { ...CLIENTES[idx], ...updatedClient }
    }
    setSelectedClientId(null)
  }

  function handleAddClient(newClient) {
    setClients((prev) => [newClient, ...prev])
    CLIENTES.unshift(newClient)
    setShowNovoModal(false)
  }

  const filtered = clients.filter((c) => {
    if (
      search &&
      !c.razaoSocial.toLowerCase().includes(search.toLowerCase()) &&
      !c.nomeFantasia.toLowerCase().includes(search.toLowerCase()) &&
      !c.cnpj.includes(search)
    )
      return false
    if (planFilter !== "Todos" && c.plano !== planFilter) return false
    if (statusFilter !== "Todos" && c.status !== statusFilter) return false
    return true
  })

  // Use plan options from configStore
  const planOptions = configStore.planOptions

  // List of all carrier names for selection
  const allCarrierNames = [
    ...new Set([
      ...TRANSPORTADORAS.map((t) => t.nome),
      "Sequóia",
      "TNT",
      "Jadlog",
      "Correios",
      "Total Express",
      "Azul Cargo",
      "Braspress",
    ]),
  ]

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: "#F4F6F9" }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b bg-white flex-shrink-0"
        style={{ borderColor: "#E2E8F0" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>
              🏢 Clientes
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
              Base de empresas cadastradas e parametrização contratual
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
            style={{ background: "#0066CC" }}
            onClick={() => setShowNovoModal(true)}
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
            Novo Cliente
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#64748B" }}
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
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por CNPJ, Razão Social ou Nome Fantasia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none"
              style={{
                border: "1px solid #E2E8F0",
                color: "#1E293B",
                background: "#F8FAFC",
              }}
            />
          </div>
          <select
            className="text-sm border rounded-lg px-3 py-2 outline-none cursor-pointer"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
          >
            <option>Todos</option>
            {planOptions.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select
            className="text-sm border rounded-lg px-3 py-2 outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
          >
            <option>Todos</option>
            <option>Ativo</option>
            <option>Inativo</option>
          </select>
          <div className="ml-auto text-xs" style={{ color: "#64748B" }}>
            Total: <strong>{filtered.length}</strong>{" "}
            {filtered.length === 1 ? "cliente" : "clientes"}
          </div>
        </div>
      </div>

      {/* Hint */}
      <div className="px-6 pt-3">
        <div
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
          style={{ background: "#EBF4FF", color: "#0066CC" }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Clique em <strong>"Ver ficha →"</strong> para visualizar todos os
          detalhes cadastrados do cliente ou editar informações completas.
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-6 pt-3">
        <div
          className="bg-white rounded-xl border overflow-hidden"
          style={{
            borderColor: "#E2E8F0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "#F8FAFC",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                {[
                  "",
                  "Empresa",
                  "CNPJ",
                  "Plano ✎",
                  "Filiais ✎",
                  "Transportadoras",
                  "Contrato",
                  "Status ✎",
                  "Ação",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: h.includes("✎") ? "#0066CC" : "#64748B" }}
                  >
                    {h.replace(" ✎", "")}
                    {h.includes("✎") && (
                      <span
                        className="ml-1 text-[10px] font-normal normal-case"
                        style={{ color: "#94A3B8" }}
                      >
                        ✎
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                return (
                  <tr
                    key={c.id}
                    className="border-t hover:bg-[#FAFBFC] transition-colors"
                    style={{ borderColor: "#E2E8F0" }}
                  >
                    <td className="px-4 py-3">
                      <div
                        onClick={() => setSelectedClientId(c.id)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ background: "#0B2847" }}
                        title="Ver ficha do cliente"
                      >
                        {c.nomeFantasia.slice(0, 2).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedClientId(c.id)}
                        className="font-medium text-left hover:underline cursor-pointer block"
                        style={{ color: "#1E293B" }}
                      >
                        {c.razaoSocial}
                      </button>
                      <div className="text-xs" style={{ color: "#64748B" }}>
                        {c.nomeFantasia} · {c.dominio}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-xs font-mono"
                      style={{ color: "#1E293B" }}
                    >
                      {c.cnpj}
                    </td>

                    {/* Plano — editable in place */}
                    <td className="px-4 py-3">
                      <InlineSelect
                        value={c.plano}
                        options={planOptions}
                        onChange={(v) => updateClient(c.id, "plano", v)}
                        renderSelected={(v) => {
                          const col = PLAN_COLORS[v] || {
                            bg: "#F1F5F9",
                            color: "#64748B",
                          }
                          return (
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={col}
                            >
                              {v}
                            </span>
                          )
                        }}
                        renderOption={(v) => {
                          const col = PLAN_COLORS[v] || {
                            bg: "#F1F5F9",
                            color: "#64748B",
                          }
                          return (
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={col}
                            >
                              {v}
                            </span>
                          )
                        }}
                      />
                    </td>

                    {/* Filiais — editable text in place */}
                    <td className="px-4 py-3">
                      <InlineText
                        value={c.filiais}
                        onChange={(v) => updateClient(c.id, "filiais", v)}
                        placeholder="Ex: 3"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.transportadoras || []).slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="text-[11px] px-1.5 py-0.5 rounded"
                            style={{ background: "#F1F5F9", color: "#64748B" }}
                          >
                            {t}
                          </span>
                        ))}
                        {(c.transportadoras || []).length > 2 && (
                          <span
                            className="text-[11px] px-1.5 py-0.5 rounded"
                            style={{ background: "#F1F5F9", color: "#64748B" }}
                          >
                            +{(c.transportadoras || []).length - 2}
                          </span>
                        )}
                        {(!c.transportadoras ||
                          c.transportadoras.length === 0) && (
                          <span className="text-[11px] text-[#94A3B8]">
                            Nenhuma
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "#64748B" }}
                    >
                      <div>{c.contrato}</div>
                      {c.dataGoLive && (
                        <div
                          className="text-[11px] text-[#F26522] font-semibold flex items-center gap-1 mt-0.5"
                          title="Data Go-live prevista/realizada"
                        >
                          <span>🚀</span> {c.dataGoLive}
                        </div>
                      )}
                    </td>

                    {/* Status — editable in place */}
                    <td className="px-4 py-3">
                      <InlineSelect
                        value={c.status}
                        options={["Ativo", "Inativo"]}
                        onChange={(v) => updateClient(c.id, "status", v)}
                        renderSelected={(v) => (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={
                              v === "Ativo"
                                ? { background: "#ECFDF5", color: "#10B981" }
                                : { background: "#F1F5F9", color: "#64748B" }
                            }
                          >
                            {v}
                          </span>
                        )}
                        renderOption={(v) => (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={
                              v === "Ativo"
                                ? { background: "#ECFDF5", color: "#10B981" }
                                : { background: "#F1F5F9", color: "#64748B" }
                            }
                          >
                            {v}
                          </span>
                        )}
                      />
                    </td>

                    {/* Action: Ver ficha */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedClientId(c.id)}
                        className="text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer hover:underline"
                        style={{ color: "#0066CC" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#0054a8"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#0066CC"
                        }}
                        title={`Ver ficha completa de ${c.nomeFantasia}`}
                      >
                        Ver ficha →
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-[#94A3B8]"
                  >
                    Nenhum cliente encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ficha do Cliente */}
      {selectedClient && (
        <FichaClienteModal
          client={selectedClient}
          onClose={() => setSelectedClientId(null)}
          onSave={handleSaveFicha}
          planOptions={planOptions}
          allTransportadoras={allCarrierNames}
        />
      )}

      {/* Modal Novo Cliente */}
      {showNovoModal && (
        <NovoClienteModal
          onClose={() => setShowNovoModal(false)}
          onAdd={handleAddClient}
          planOptions={planOptions}
          allTransportadoras={allCarrierNames}
        />
      )}
    </div>
  )
}
