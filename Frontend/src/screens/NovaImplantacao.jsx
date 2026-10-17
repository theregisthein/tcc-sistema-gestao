import { useState, useMemo, useRef, useEffect } from "react";
import {
  IMPLANTACOES,
  CLIENTES,
  TRANSPORTADORAS,
  USUARIOS,
  CURRENT_USER,
} from "../data/mock";
import { configStore } from "./Configuracoes";

const STATUS_OPTIONS = [
  "Coleta de Dados",
  "Parametrização de Tabelas",
  "Em Homologação",
  "Go-Live Agendado",
];

const STATUS_COLORS = {
  "Coleta de Dados": { bg: "#EBF4FF", color: "#0066CC" },
  "Parametrização de Tabelas": { bg: "#FFF1E8", color: "#F26522" },
  "Em Homologação": { bg: "#FFFBEB", color: "#D97706" },
  "Go-Live Agendado": { bg: "#ECFDF5", color: "#10B981" },
  "Finalizada": { bg: "#F1F5F9", color: "#64748B" },
};

const PRIORITY_COLORS = {
  "Alta": { color: "#F26522", bg: "#FFF1E8" },
  "Média": { color: "#F59E0B", bg: "#FFFBEB" },
  "Baixa": { color: "#10B981", bg: "#ECFDF5" },
};

const PLAN_INFO = {
  Starter: {
    color: "#10B981",
    bg: "#ECFDF5",
    desc: "Até 5 tabelas • 1 integração ERP padrão",
  },
  Profissional: {
    color: "#0066CC",
    bg: "#EBF4FF",
    desc: "Até 15 tabelas • ERPs + E-commerces",
  },
  Enterprise: {
    color: "#7C3AED",
    bg: "#F5F3FF",
    desc: "Tabelas ilimitadas • Múltiplos CNPJs e filiais",
  },
};

const DEFAULT_INTEGRATIONS = [
  "Protheus",
  "VTEX",
  "Bling",
  "Tiny",
  "WooCommerce",
  "SAP",
  "Omie",
  "Sankhya",
  "Senior WMS",
  "Intelipost",
];

const DEFAULT_MODULES = [
  { id: "cotacao", name: "Cotação de Frete em Tempo Real", default: true },
  { id: "tracking", name: "Rastreamento & Tracking de Pedidos", default: true },
  { id: "auditoria", name: "Auditoria & Fatura de Fretes (CT-e)", default: false },
  { id: "despacho", name: "Painel de Expedição & Despacho", default: false },
  { id: "ocorrencias", name: "Gestão de Ocorrências e Sinistros", default: false },
];

const DEFAULT_CHECKLIST_TEMPLATE = {
  "Fase 1: Coleta de Dados & Validação Cadastral": [
    { id: "f1t1", label: "Validação do CNPJ principal e dados societários", done: false },
    { id: "f1t2", label: "Cadastro de filiais e CNPJs vinculados (se houver)", done: false },
    { id: "f1t3", label: "Validação do contrato assinado e escopo técnico", done: false },
    { id: "f1t4", label: "Criação do domínio personalizado no sistema FG", done: false },
    { id: "f1t5", label: "Cadastro e envio de acessos do usuário administrador", done: false },
  ],
  "Fase 2: Homologação de Transportadoras & Tabelas": [
    { id: "f2t1", label: "Mapeamento e vínculo das transportadoras contratadas", done: false },
    { id: "f2t2", label: "Carga e conferência das tabelas de frete recebidas", done: false },
    { id: "f2t3", label: "Validação de prazos, taxas de cubagem e generalidades", done: false },
    { id: "f2t4", label: "Homologação de fretes regionais e testes de simulação", done: false },
  ],
  "Fase 3: Parametrização de Regras e Integração de APIs": [
    { id: "f3t1", label: "Configuração das credenciais e webhooks de integração", done: false },
    { id: "f3t2", label: "Configuração das regras de seleção de transportadora", done: false },
    { id: "f3t3", label: "Testes de cotação via API e validação de payloads", done: false },
    { id: "f3t4", label: "Homologação em ambiente de homologação (Staging)", done: false },
  ],
  "Fase 4: Treinamento, Homologação com Cliente e Go-Live": [
    { id: "f4t1", label: "Treinamento operacional com a equipe do cliente", done: false },
    { id: "f4t2", label: "Validação final e aprovação formal do cliente", done: false },
    { id: "f4t3", label: "Agendamento da virada de chave (Go-Live)", done: false },
    { id: "f4t4", label: "Execução do Go-Live e acompanhamento assistido inicial", done: false },
  ],
};

function formatMoneyBRL(value) {
  if (value === null || value === undefined || value === "") return "R$ 0,00";
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "R$ 0,00";
  const num = Number(digits) / 100;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCNPJ(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

function generateInitials(text) {
  if (!text) return "FG";
  const parts = text.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function calculateDaysRemaining(targetDateStr) {
  if (!targetDateStr) return null;
  const target = new Date(targetDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function generateNextImplantacaoId() {
  const existingNumbers = IMPLANTACOES.map((imp) => {
    const match = imp.id?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  });
  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 100;
  const nextNum = maxNumber + 1;
  return `IMP-${String(nextNum).padStart(4, "0")}`;
}

export default function NovaImplantacao({ onBack, onCreated }) {
  // Modal / Feedback state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [errors, setErrors] = useState({});

  // Client Selection Mode: "existing" ou "new"
  const [clientMode, setClientMode] = useState("existing");
  const [selectedClientId, setSelectedClientId] = useState("");

  // Identification & Client Fields (RF 01, RF 11)
  const [clientName, setClientName] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [domain, setDomain] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [filiaisCount, setFiliaisCount] = useState(0);
  const [contaFrete, setContaFrete] = useState("R$ 0,00");

  // Project Management & Assignment (RF 11, RF 13, ER novaImplantacao)
  const [assignee, setAssignee] = useState(CURRENT_USER.name || "Régis Rinaldi");
  const [coAssignees, setCoAssignees] = useState([]);
  const [priority, setPriority] = useState("Alta");
  const [status, setStatus] = useState("Coleta de Dados");

  // Deadlines & Dates (RF 11, RF 12)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [signatureDate, setSignatureDate] = useState(todayStr);
  const [startDate, setStartDate] = useState(todayStr);
  // Default Go-Live: 30 dias após início
  const defaultGoLive = new Date();
  defaultGoLive.setDate(defaultGoLive.getDate() + 30);
  const [goLiveDate, setGoLiveDate] = useState(defaultGoLive.toISOString().slice(0, 10));

  // Technical Scope & Systems (RF 11, ER Plano, Modulo, ClienteTransportadora)
  const [plan, setPlan] = useState("Profissional");
  const [tablesCount, setTablesCount] = useState(6);
  const [selectedTransportadoras, setSelectedTransportadoras] = useState([]);
  const [selectedIntegrations, setSelectedIntegrations] = useState(["Protheus"]);
  const [newIntegrationInput, setNewIntegrationInput] = useState("");
  const [selectedModules, setSelectedModules] = useState(["cotacao", "tracking"]);

  // Dynamic Checklist (RF 11, ER Checklist)
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST_TEMPLATE);
  const [newChecklistTask, setNewChecklistTask] = useState({});
  const [expandedPhases, setExpandedPhases] = useState({
    "Fase 1: Coleta de Dados & Validação Cadastral": true,
    "Fase 2: Homologação de Transportadoras & Tabelas": true,
    "Fase 3: Parametrização de Regras e Integração de APIs": false,
    "Fase 4: Treinamento, Homologação com Cliente e Go-Live": false,
  });

  // Attachments (RF 01, RF 11, ER anexo)
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // Notes & Observações (RF 11, ER novaImplantacao.observacao)
  const [notes, setNotes] = useState("");

  // Autocomplete / Search for Existing Client
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculated Days
  const daysRemaining = useMemo(() => calculateDaysRemaining(goLiveDate), [goLiveDate]);

  // Clients filtered for selection
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return CLIENTES;
    const q = clientSearchQuery.toLowerCase();
    return CLIENTES.filter(
      (c) =>
        c.nomeFantasia.toLowerCase().includes(q) ||
        c.razaoSocial.toLowerCase().includes(q) ||
        c.cnpj.includes(q)
    );
  }, [clientSearchQuery]);

  // Handle client selection from existing CLIENTES
  function handleSelectExistingClient(client) {
    setSelectedClientId(client.id);
    setClientName(client.nomeFantasia);
    setRazaoSocial(client.razaoSocial);
    setCnpj(client.cnpj);
    setDomain(client.dominio || `${client.nomeFantasia.toLowerCase().replace(/\s+/g, "")}.fretegestao.com.br`);
    setAdminEmail(client.adminEmail || "");
    setFiliaisCount(client.filiais || 0);
    setContaFrete(client.contaFrete || "R$ 0,00");
    if (client.plano) setPlan(client.plano);
    if (client.transportadoras && client.transportadoras.length > 0) {
      setSelectedTransportadoras(client.transportadoras);
    }
    if (client.parceiros && client.parceiros.length > 0) {
      // Map parceiros that match or add them
      setSelectedIntegrations(client.parceiros);
    }
    if (client.contatos && client.contatos.length > 0) {
      setContactName(client.contatos[0].nome || "");
    }
    if (client.contrato) {
      setSignatureDate(client.contrato);
    }
    if (client.inicioImplantacao) {
      setStartDate(client.inicioImplantacao);
    }
    if (client.dataGoLive) {
      setGoLiveDate(client.dataGoLive);
    }
    setIsSearchOpen(false);
    setClientSearchQuery(client.nomeFantasia);

    // Clear validation error on client name
    if (errors.clientName) {
      setErrors((prev) => ({ ...prev, clientName: null }));
    }
  }

  // Toggle transportadora selection
  function handleToggleTransportadora(nomeTransp) {
    setSelectedTransportadoras((prev) =>
      prev.includes(nomeTransp)
        ? prev.filter((t) => t !== nomeTransp)
        : [...prev, nomeTransp]
    );
  }

  // Toggle integration selection
  function handleToggleIntegration(intName) {
    setSelectedIntegrations((prev) =>
      prev.includes(intName)
        ? prev.filter((i) => i !== intName)
        : [...prev, intName]
    );
  }

  // Add custom integration
  function handleAddCustomIntegration() {
    const trimmed = newIntegrationInput.trim();
    if (!trimmed) return;
    if (!selectedIntegrations.includes(trimmed)) {
      setSelectedIntegrations((prev) => [...prev, trimmed]);
    }
    setNewIntegrationInput("");
  }

  // Toggle module selection
  function handleToggleModule(modId) {
    setSelectedModules((prev) =>
      prev.includes(modId)
        ? prev.filter((m) => m !== modId)
        : [...prev, modId]
    );
  }

  // Checklist manipulations
  function handleToggleTask(phaseName, taskId) {
    setChecklist((prev) => ({
      ...prev,
      [phaseName]: prev[phaseName].map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t
      ),
    }));
  }

  function handleAddTaskToPhase(phaseName) {
    const text = (newChecklistTask[phaseName] || "").trim();
    if (!text) return;
    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: text,
      done: false,
    };
    setChecklist((prev) => ({
      ...prev,
      [phaseName]: [...prev[phaseName], newTask],
    }));
    setNewChecklistTask((prev) => ({ ...prev, [phaseName]: "" }));
  }

  function handleRemoveTask(phaseName, taskId) {
    setChecklist((prev) => ({
      ...prev,
      [phaseName]: prev[phaseName].filter((t) => t.id !== taskId),
    }));
  }

  // File Upload handling (simulated)
  function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newItems = files.map((f) => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      type: f.name.endsWith(".pdf")
        ? "PDF"
        : f.name.endsWith(".xlsx") || f.name.endsWith(".xls")
        ? "Planilha"
        : "Documento",
      date: todayStr,
    }));
    setAttachments((prev) => [...prev, ...newItems]);
  }

  function handleRemoveAttachment(idx) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  // Basic Validation
  function validateForm() {
    const newErrors = {};

    if (!clientName.trim()) {
      newErrors.clientName = "O nome do cliente é obrigatório.";
    }

    if (!assignee) {
      newErrors.assignee = "Selecione o analista responsável pelo projeto.";
    }

    if (!startDate) {
      newErrors.startDate = "A data de início da implantação é obrigatória.";
    }

    if (!goLiveDate) {
      newErrors.goLiveDate = "A data prevista para Go-Live é obrigatória.";
    } else if (startDate && new Date(goLiveDate) < new Date(startDate)) {
      newErrors.goLiveDate = "A data de Go-Live não pode ser anterior à data de início.";
    }

    if (!plan) {
      newErrors.plan = "Selecione o plano contratado.";
    }

    if (selectedTransportadoras.length === 0) {
      newErrors.transportadoras = "Vincule ao menos 1 transportadora à implantação.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Submit and create new implantação
  function handleSubmit(e) {
    if (e) e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const newId = generateNextImplantacaoId();
    const clientInitials = generateInitials(clientName);

    // Count tasks
    const allTasks = Object.values(checklist).flat();
    const totalTasks = allTasks.length;
    const tasksDone = allTasks.filter((t) => t.done).length;

    // Build implantacao entity compatible with IMPLANTACOES and ER diagram
    const novaImplantacaoData = {
      id: newId,
      client: clientName.trim(),
      clientInitials,
      plan,
      domain: domain.trim() || `${clientName.toLowerCase().replace(/\s+/g, "")}.fretegestao.com.br`,
      startDate,
      signatureDate: signatureDate || startDate,
      integrations: selectedIntegrations.length > 0 ? selectedIntegrations : ["Protheus"],
      tablesCount: Number(tablesCount) || 1,
      status,
      priority,
      assignee,
      tasksTotal: totalTasks > 0 ? totalTasks : 16,
      tasksDone,
      daysRemaining: daysRemaining !== null ? daysRemaining : 30,
      goLiveDate,
      overdue: daysRemaining !== null && daysRemaining < 0,
      checklist,
      notes: notes.trim(),
      attachments: attachments.map((a) => a.name),
      // Extra attributes from ER diagram & RF 11
      razaoSocial: razaoSocial.trim(),
      cnpj: cnpj.trim(),
      adminEmail: adminEmail.trim(),
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      contaFrete,
      filiaisCount: Number(filiaisCount) || 0,
      transportadoras: selectedTransportadoras,
      modules: selectedModules,
      createdAt: new Date().toISOString(),
    };

    // Add to mock in-memory database
    IMPLANTACOES.unshift(novaImplantacaoData);

    setCreatedId(newId);
    setShowSuccessModal(true);
  }

  // Total tasks count for badge
  const totalChecklistTasks = useMemo(() => {
    return Object.values(checklist).reduce((acc, curr) => acc + curr.length, 0);
  }, [checklist]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#F4F6F9" }}>
      {/* Top Header Sticky */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-20" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center justify-between mb-2">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[#0066CC]"
              style={{ color: "#64748B" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Projetos de Implantação
            </button>
            <span style={{ color: "#CBD5E1" }}>/</span>
            <span className="text-xs font-semibold" style={{ color: "#1E293B" }}>
              Nova Implantação
            </span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-[#F8FAFC]"
              style={{ borderColor: "#E2E8F0", color: "#64748B" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-all"
              style={{ background: "#F26522" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#d4541a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#F26522"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
              Salvar Implantação
            </button>
          </div>
        </div>

        {/* Title & Status Summary */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: "#1E293B" }}>
              🚀 Cadastro de Nova Implantação
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
              Preencha o escopo contratual, prazos, transportadoras e checklist operacional para o onboarding.
            </p>
          </div>

          {/* Live mini preview tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={STATUS_COLORS[status] || STATUS_COLORS["Coleta de Dados"]}
            >
              Fase: {status}
            </span>
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold border"
              style={{
                borderColor: PRIORITY_COLORS[priority]?.color,
                color: PRIORITY_COLORS[priority]?.color,
                background: PRIORITY_COLORS[priority]?.bg,
              }}
            >
              Prioridade {priority}
            </span>
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: PLAN_INFO[plan]?.bg, color: PLAN_INFO[plan]?.color }}
            >
              Plano {plan}
            </span>
          </div>
        </div>
      </div>

      {/* Validation Errors Alert Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div
            className="p-4 rounded-xl border flex items-start gap-3"
            style={{ background: "#FFF1F2", borderColor: "#FECDD3", color: "#9F1239" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="text-xs">
              <span className="font-bold">Atenção: Por favor, corrija os seguintes campos obrigatórios:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {Object.values(errors).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* KPI Preview Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E2E8F0" }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
              Cliente Identificado
            </div>
            <div className="text-base font-bold truncate mt-1" style={{ color: "#1E293B" }}>
              {clientName || "Não selecionado"}
            </div>
            <div className="text-xs truncate mt-0.5" style={{ color: "#64748B" }}>
              {cnpj ? formatCNPJ(cnpj) : "Aguardando definição"}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E2E8F0" }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
              Previsão de Go-Live
            </div>
            <div className="text-base font-bold mt-1" style={{ color: "#1E293B" }}>
              {goLiveDate ? new Date(goLiveDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
            </div>
            <div
              className="text-xs font-medium mt-0.5"
              style={{
                color:
                  daysRemaining === null
                    ? "#64748B"
                    : daysRemaining < 0
                    ? "#E11D48"
                    : daysRemaining <= 5
                    ? "#D97706"
                    : "#10B981",
              }}
            >
              {daysRemaining === null
                ? "Defina as datas"
                : daysRemaining < 0
                ? `Atrasado há ${Math.abs(daysRemaining)} dias`
                : `${daysRemaining} dias restantes`}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E2E8F0" }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
              Transportadoras
            </div>
            <div className="text-base font-bold mt-1" style={{ color: "#0066CC" }}>
              {selectedTransportadoras.length} selecionada(s)
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>
              {tablesCount} tabelas estimadas
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E2E8F0" }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
              Checklist Inicial
            </div>
            <div className="text-base font-bold mt-1" style={{ color: "#10B981" }}>
              {totalChecklistTasks} tarefas
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>
              Em 4 fases estruturadas
            </div>
          </div>
        </div>

        {/* SECTION 1: DADOS DO CLIENTE (RF 01, RF 11, ER Cliente) */}
        <div
          className="bg-white rounded-xl border p-6"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0B2847" }}>
                1
              </span>
              <div>
                <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>
                  Identificação do Cliente
                </h2>
                <p className="text-xs" style={{ color: "#64748B" }}>
                  Selecione um cliente já cadastrado no sistema ou informe os dados da nova empresa.
                </p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setClientMode("existing")}
                className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: clientMode === "existing" ? "#fff" : "transparent",
                  color: clientMode === "existing" ? "#0066CC" : "#64748B",
                  boxShadow: clientMode === "existing" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                }}
              >
                Vincular Cliente Existente
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientMode("new");
                  setSelectedClientId("");
                }}
                className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: clientMode === "new" ? "#fff" : "transparent",
                  color: clientMode === "new" ? "#0066CC" : "#64748B",
                  boxShadow: clientMode === "new" ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                }}
              >
                Novo Cliente
              </button>
            </div>
          </div>

          {/* If Existing Client Mode: Search Dropdown */}
          {clientMode === "existing" && (
            <div className="mb-5 relative" ref={searchContainerRef}>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Pesquisar e Selecionar Cliente da Base <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Digite o nome fantasia, razão social ou CNPJ do cliente..."
                  value={clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full text-sm border rounded-lg px-3 py-2.5 pl-9 outline-none transition-all"
                  style={{
                    borderColor: errors.clientName ? "#E11D48" : "#E2E8F0",
                    color: "#1E293B",
                  }}
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  className="absolute left-3 top-3"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {/* Dropdown Options */}
              {isSearchOpen && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border rounded-xl shadow-xl max-h-60 overflow-y-auto"
                  style={{ borderColor: "#E2E8F0" }}
                >
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-xs text-center" style={{ color: "#64748B" }}>
                      Nenhum cliente encontrado. Digite outro termo ou selecione "Novo Cliente".
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <button
                        type="button"
                        key={client.id}
                        onClick={() => handleSelectExistingClient(client)}
                        className="w-full text-left px-4 py-2.5 border-b last:border-b-0 hover:bg-[#F8FAFC] transition-colors flex items-center justify-between"
                        style={{ borderColor: "#F1F5F9" }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: "#0B2847" }}
                          >
                            {client.nomeFantasia.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold" style={{ color: "#1E293B" }}>
                              {client.nomeFantasia}
                            </div>
                            <div className="text-[11px]" style={{ color: "#64748B" }}>
                              {client.razaoSocial} • CNPJ: {client.cnpj}
                            </div>
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: PLAN_INFO[client.plano]?.bg || "#EBF4FF",
                            color: PLAN_INFO[client.plano]?.color || "#0066CC",
                          }}
                        >
                          {client.plano || "Plano"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form Fields: Clientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Nome Fantasia do Cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Móveis Florense"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  if (errors.clientName) setErrors((prev) => ({ ...prev, clientName: null }));
                }}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                style={{
                  borderColor: errors.clientName ? "#E11D48" : "#E2E8F0",
                  color: "#1E293B",
                }}
              />
              {errors.clientName && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.clientName}</span>
              )}
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Razão Social
              </label>
              <input
                type="text"
                placeholder="Ex: Móveis Florense Ltda"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                CNPJ (Matriz)
              </label>
              <input
                type="text"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Domínio Frete Gestão
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="empresa.fretegestao.com.br"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                  style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                E-mail Administrador do Cliente
              </label>
              <input
                type="email"
                placeholder="admin@empresa.com.br"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Conta Frete Mensal Estimada (R$)
              </label>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={contaFrete}
                onChange={(e) => setContaFrete(formatMoneyBRL(e.target.value))}
                className="w-full text-sm font-semibold border rounded-lg px-3 py-2 outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Nome do Contato Principal
              </label>
              <input
                type="text"
                placeholder="Ex: Cristiano Richter"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Telefone / WhatsApp de Contato
              </label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Quantidade de Filiais / CNPJs Vinculados
              </label>
              <input
                type="number"
                min="0"
                value={filiaisCount}
                onChange={(e) => setFiliaisCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: GESTÃO DO PROJETO & RESPONSÁVEIS (RF 11, RF 13, ER UsuarioImplantacao) */}
        <div
          className="bg-white rounded-xl border p-6"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-2 pb-4 mb-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0B2847" }}>
              2
            </span>
            <div>
              <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>
                Gestão do Projeto & Responsáveis
              </h2>
              <p className="text-xs" style={{ color: "#64748B" }}>
                Defina o analista responsável, a prioridade da implantação e o status inicial do projeto.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Responsável Principal */}
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Analista Responsável Principal <span className="text-red-500">*</span>
              </label>
              <select
                value={assignee}
                onChange={(e) => {
                  setAssignee(e.target.value);
                  if (errors.assignee) setErrors((prev) => ({ ...prev, assignee: null }));
                }}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                style={{
                  borderColor: errors.assignee ? "#E11D48" : "#E2E8F0",
                  color: "#1E293B",
                }}
              >
                {USUARIOS.map((u) => (
                  <option key={u.id} value={u.nome}>
                    {u.nome} ({u.setor})
                  </option>
                ))}
              </select>
              {errors.assignee && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.assignee}</span>
              )}
            </div>

            {/* Status Inicial */}
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Status Inicial do Onboarding
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all font-medium"
                style={{
                  borderColor: "#E2E8F0",
                  color: STATUS_COLORS[status]?.color || "#1E293B",
                }}
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Nível de Prioridade
              </label>
              <div className="flex gap-2">
                {["Alta", "Média", "Baixa"].map((p) => {
                  const pConfig = PRIORITY_COLORS[p];
                  const isSelected = priority === p;
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5"
                      style={{
                        borderColor: isSelected ? pConfig.color : "#E2E8F0",
                        background: isSelected ? pConfig.bg : "transparent",
                        color: isSelected ? pConfig.color : "#64748B",
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: pConfig.color }}
                      />
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: PRAZOS E CRONOGRAMA (RF 11, RF 12, RF 13) */}
        <div
          className="bg-white rounded-xl border p-6"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-2 pb-4 mb-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0B2847" }}>
              3
            </span>
            <div>
              <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>
                Prazos e Cronograma de Implantação
              </h2>
              <p className="text-xs" style={{ color: "#64748B" }}>
                Defina as datas contratuais, início dos trabalhos e a meta de Go-Live.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Data de Assinatura do Contrato
              </label>
              <input
                type="date"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Data de Início da Implantação <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: null }));
                }}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                style={{
                  borderColor: errors.startDate ? "#E11D48" : "#E2E8F0",
                  color: "#1E293B",
                }}
              />
              {errors.startDate && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.startDate}</span>
              )}
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Data Prevista para Go-Live (Prazo Final) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={goLiveDate}
                onChange={(e) => {
                  setGoLiveDate(e.target.value);
                  if (errors.goLiveDate) setErrors((prev) => ({ ...prev, goLiveDate: null }));
                }}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all font-semibold"
                style={{
                  borderColor: errors.goLiveDate ? "#E11D48" : "#E2E8F0",
                  color: "#1E293B",
                }}
              />
              {errors.goLiveDate && (
                <span className="text-[11px] text-red-500 mt-1 block">{errors.goLiveDate}</span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: ESCOPO TÉCNICO, PLANO & TRANSPORTADORAS (RF 11, ER Plano, Modulo, ClienteTransportadora) */}
        <div
          className="bg-white rounded-xl border p-6"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-2 pb-4 mb-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0B2847" }}>
              4
            </span>
            <div>
              <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>
                Escopo Técnico, Sistemas & Transportadoras
              </h2>
              <p className="text-xs" style={{ color: "#64748B" }}>
                Configure o plano contratado, os parceiros integrados e as transportadoras vinculadas.
              </p>
            </div>
          </div>

          {/* Plano Contratado */}
          <div className="mb-6">
            <label className="text-xs font-medium block mb-2" style={{ color: "#64748B" }}>
              Plano de Assinatura <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.keys(PLAN_INFO).map((p) => {
                const isSelected = plan === p;
                const info = PLAN_INFO[p];
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPlan(p)}
                    className="p-3.5 rounded-xl border text-left transition-all"
                    style={{
                      borderColor: isSelected ? info.color : "#E2E8F0",
                      background: isSelected ? info.bg : "#fff",
                      boxShadow: isSelected ? `0 0 0 2px ${info.color}20` : "none",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm" style={{ color: info.color }}>
                        {p}
                      </span>
                      {isSelected && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: "#64748B" }}>
                      {info.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantidade de Tabelas */}
          <div className="mb-6 max-w-xs">
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
              Quantidade Estimada de Tabelas de Frete
            </label>
            <input
              type="number"
              min="1"
              value={tablesCount}
              onChange={(e) => setTablesCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
              style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
            />
          </div>

          {/* Transportadoras Envolvidas */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: "#64748B" }}>
                Transportadoras Envolvidas no Onboarding <span className="text-red-500">*</span>
              </label>
              <span className="text-xs font-semibold" style={{ color: "#0066CC" }}>
                {selectedTransportadoras.length} selecionada(s)
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: "#94A3B8" }}>
              Selecione as transportadoras que terão tabelas parametrizadas e homologadas na implantação.
            </p>

            <div className="flex flex-wrap gap-2">
              {TRANSPORTADORAS.map((transp) => {
                const isSelected = selectedTransportadoras.includes(transp.nome);
                return (
                  <button
                    type="button"
                    key={transp.id}
                    onClick={() => {
                      handleToggleTransportadora(transp.nome);
                      if (errors.transportadoras) setErrors((prev) => ({ ...prev, transportadoras: null }));
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={{
                      borderColor: isSelected ? "#0066CC" : "#E2E8F0",
                      background: isSelected ? "#EBF4FF" : "#fff",
                      color: isSelected ? "#0066CC" : "#1E293B",
                    }}
                  >
                    {isSelected ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="w-2 h-2 rounded-full" style={{ background: transp.ativo ? "#10B981" : "#94A3B8" }} />
                    )}
                    {transp.nome}
                  </button>
                );
              })}
            </div>
            {errors.transportadoras && (
              <span className="text-[11px] text-red-500 mt-2 block">{errors.transportadoras}</span>
            )}
          </div>

          {/* Sistemas & Integrações */}
          <div className="mb-6">
            <label className="text-xs font-medium block mb-2" style={{ color: "#64748B" }}>
              Sistemas e Plataformas Integradas (ERPs / E-commerces / TMS)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {DEFAULT_INTEGRATIONS.map((int) => {
                const isSelected = selectedIntegrations.includes(int);
                return (
                  <button
                    type="button"
                    key={int}
                    onClick={() => handleToggleIntegration(int)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={{
                      borderColor: isSelected ? "#7C3AED" : "#E2E8F0",
                      background: isSelected ? "#F5F3FF" : "#fff",
                      color: isSelected ? "#7C3AED" : "#64748B",
                    }}
                  >
                    🔗 {int} {isSelected ? "✓" : ""}
                  </button>
                );
              })}
            </div>

            {/* Custom integration input */}
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Outro sistema / ERP customizado..."
                value={newIntegrationInput}
                onChange={(e) => setNewIntegrationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomIntegration();
                  }
                }}
                className="flex-1 text-xs border rounded-lg px-3 py-2 outline-none"
                style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
              />
              <button
                type="button"
                onClick={handleAddCustomIntegration}
                className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-[#F8FAFC]"
                style={{ borderColor: "#E2E8F0", color: "#0066CC" }}
              >
                + Adicionar
              </button>
            </div>
          </div>

          {/* Módulos Frete Gestão */}
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: "#64748B" }}>
              Módulos Frete Gestão Contratados
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DEFAULT_MODULES.map((mod) => {
                const isChecked = selectedModules.includes(mod.id);
                return (
                  <label
                    key={mod.id}
                    className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors"
                    style={{
                      borderColor: isChecked ? "#0066CC" : "#E2E8F0",
                      background: isChecked ? "#F8FAFC" : "#fff",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleModule(mod.id)}
                      className="rounded accent-[#0066CC]"
                    />
                    <span className="text-xs font-semibold" style={{ color: "#1E293B" }}>
                      {mod.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 5: CHECKLIST OPERACIONAL (RF 11, ER Checklist) */}
        <div
          className="bg-white rounded-xl border p-6"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0B2847" }}>
                5
              </span>
              <div>
                <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>
                  Checklist Operacional Padrão de Onboarding
                </h2>
                <p className="text-xs" style={{ color: "#64748B" }}>
                  As fases abaixo serão criadas automaticamente para acompanhar o progresso da implantação.
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#ECFDF5", color: "#10B981" }}>
              {totalChecklistTasks} tarefas no plano
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(checklist).map(([phaseName, tasks], pIdx) => {
              const isExpanded = expandedPhases[phaseName] ?? true;
              return (
                <div
                  key={phaseName}
                  className="border rounded-xl overflow-hidden"
                  style={{ borderColor: "#E2E8F0" }}
                >
                  {/* Phase Header */}
                  <div
                    onClick={() =>
                      setExpandedPhases((prev) => ({
                        ...prev,
                        [phaseName]: !prev[phaseName],
                      }))
                    }
                    className="p-3 bg-[#F8FAFC] flex items-center justify-between cursor-pointer border-b"
                    style={{ borderColor: "#E2E8F0" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: "#0066CC" }}>
                        #{pIdx + 1}
                      </span>
                      <span className="text-xs font-bold" style={{ color: "#1E293B" }}>
                        {phaseName}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>
                        {tasks.length} itens
                      </span>
                    </div>

                    <button type="button" className="text-xs" style={{ color: "#64748B" }}>
                      {isExpanded ? "▲ Recolher" : "▼ Expandir"}
                    </button>
                  </div>

                  {/* Tasks List */}
                  {isExpanded && (
                    <div className="p-4 space-y-2 bg-white">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[#F8FAFC] group"
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => handleToggleTask(phaseName, task.id)}
                              className="rounded accent-[#0066CC]"
                            />
                            <span
                              className="text-xs"
                              style={{
                                color: task.done ? "#94A3B8" : "#1E293B",
                                textDecoration: task.done ? "line-through" : "none",
                              }}
                            >
                              {task.label}
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveTask(phaseName, task.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:underline px-2"
                          >
                            Remover
                          </button>
                        </div>
                      ))}

                      {/* Add task inline */}
                      <div className="flex gap-2 pt-2 border-t mt-2" style={{ borderColor: "#F1F5F9" }}>
                        <input
                          type="text"
                          placeholder="Adicionar tarefa personalizada nesta fase..."
                          value={newChecklistTask[phaseName] || ""}
                          onChange={(e) =>
                            setNewChecklistTask((prev) => ({
                              ...prev,
                              [phaseName]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTaskToPhase(phaseName);
                            }
                          }}
                          className="flex-1 text-xs border rounded-lg px-3 py-1.5 outline-none"
                          style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTaskToPhase(phaseName)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{ background: "#0066CC" }}
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 6: ANEXOS E DOCUMENTOS (RF 01, RF 11, ER anexo) */}
        <div
          className="bg-white rounded-xl border p-6"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-2 pb-4 mb-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0B2847" }}>
              6
            </span>
            <div>
              <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>
                Documentos e Anexos Iniciais
              </h2>
              <p className="text-xs" style={{ color: "#64748B" }}>
                Anexe o contrato assinado, planilhas de tabela de frete ou manuais técnicos.
              </p>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-[#F8FAFC]"
            style={{ borderColor: "#CBD5E1" }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-2" style={{ background: "#EBF4FF" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="text-xs font-semibold" style={{ color: "#1E293B" }}>
              Clique aqui ou arraste os arquivos da implantação
            </div>
            <div className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>
              Formatos aceitos: PDF, XLSX, XLS, DOCX, JPG, PNG (máx. 25MB por arquivo)
            </div>
          </div>

          {/* List of attachments */}
          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border bg-[#F8FAFC]"
                  style={{ borderColor: "#E2E8F0" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">📄</span>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: "#1E293B" }}>
                        {att.name}
                      </div>
                      <div className="text-[11px]" style={{ color: "#64748B" }}>
                        {att.size} • {att.type} • Adicionado hoje
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 7: OBSERVAÇÕES & PARTICULARIDADES (RF 11, ER novaImplantacao.observacao) */}
        <div
          className="bg-white rounded-xl border p-6"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-2 pb-4 mb-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0B2847" }}>
              7
            </span>
            <div>
              <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>
                Observações Operacionais & Alinhamento
              </h2>
              <p className="text-xs" style={{ color: "#64748B" }}>
                Registre detalhes específicos acordados com o cliente, canais prioritários e pontos de atenção.
              </p>
            </div>
          </div>

          <textarea
            rows="4"
            placeholder="Ex: Cliente opera com carga fracionada no Sul e Sudeste. Solicita prioridade na validação das tabelas de frete da Braspress. Ponto focal técnico: cristiano.richter@empresa.com.br..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs border rounded-lg p-3 outline-none transition-all leading-relaxed"
            style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
          />
        </div>

        {/* Form Bottom Actions */}
        <div
          className="bg-white rounded-xl border p-4 flex items-center justify-between"
          style={{ borderColor: "#E2E8F0" }}
        >
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-[#F8FAFC]"
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
          >
            ← Voltar para Implantações
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setStatus("Coleta de Dados");
                handleSubmit();
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-[#F8FAFC]"
              style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
            >
              Salvar como Rascunho
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-md transition-all"
              style={{ background: "#F26522" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#d4541a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#F26522"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
              Finalizar e Iniciar Implantação
            </button>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 text-center border shadow-2xl animate-in fade-in zoom-in-95"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div
              className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 text-2xl"
              style={{ background: "#ECFDF5", color: "#10B981" }}
            >
              🚀
            </div>
            <h3 className="text-lg font-bold" style={{ color: "#1E293B" }}>
              Implantação Criada com Sucesso!
            </h3>
            <p className="text-xs mt-2" style={{ color: "#64748B" }}>
              O projeto <span className="font-bold text-[#0066CC]">{createdId}</span> para o cliente{" "}
              <span className="font-bold" style={{ color: "#1E293B" }}>{clientName}</span> foi cadastrado e iniciado. O checklist com {totalChecklistTasks} tarefas está pronto para acompanhamento.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-[#F8FAFC]"
                style={{ borderColor: "#E2E8F0", color: "#64748B" }}
              >
                Voltar à Listagem
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onCreated) {
                    onCreated(createdId);
                  } else {
                    onBack();
                  }
                }}
                className="flex-1 py-2 rounded-lg text-xs font-bold text-white transition-all"
                style={{ background: "#0066CC" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#0054a8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#0066CC"; }}
              >
                Ver Detalhes do Projeto →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
