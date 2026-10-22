import { useState, useMemo, useRef, useEffect } from "react";

const BASE_URL = "http://localhost:8000/api";

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
  Alta: { color: "#F26522", bg: "#FFF1E8" },
  Média: { color: "#F59E0B", bg: "#FFFBEB" },
  Baixa: { color: "#10B981", bg: "#ECFDF5" },
};

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
  return (Number(digits) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCNPJ(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export default function NovaImplantacao({ onBack, onCreated }) {
  const [clientesApi, setClientesApi] = useState([]);
  const [usuariosApi, setUsuariosApi] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [errors, setErrors] = useState({});

  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [domain, setDomain] = useState("");
  const [contaFrete, setContaFrete] = useState("R$ 0,00");

  const [selectedResponsavelId, setSelectedResponsavelId] = useState("");
  const [responsaveis, setResponsaveis] = useState([]);
  const [priority, setPriority] = useState("Alta");
  const [status, setStatus] = useState("Coleta de Dados");

  // Datas 100% editáveis
  const todayStr = new Date().toISOString().slice(0, 10);
  const [signatureDate, setSignatureDate] = useState(todayStr);
  const [startDate, setStartDate] = useState(todayStr);
  const defaultGoLive = new Date();
  defaultGoLive.setDate(defaultGoLive.getDate() + 30);
  const [goLiveDate, setGoLiveDate] = useState(defaultGoLive.toISOString().slice(0, 10));

  // Checklist dinâmico
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST_TEMPLATE);
  const [expandedPhases, setExpandedPhases] = useState({
    "Fase 1: Coleta de Dados & Validação Cadastral": true,
  });
  const [newTaskInput, setNewTaskInput] = useState({});
  const [newPhaseName, setNewPhaseName] = useState("");
  const [addingPhase, setAddingPhase] = useState(false);

  const [notes, setNotes] = useState("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    async function carregarDadosBanco() {
      try {
        setLoadingInitial(true);
        const [resClientes, resUsuarios] = await Promise.all([
          fetch(`${BASE_URL}/clientes`),
          fetch(`${BASE_URL}/usuarios`),
        ]);

        if (resClientes.ok) {
          const dados = await resClientes.json();
          setClientesApi(Array.isArray(dados) ? dados : []);
        }

        if (resUsuarios.ok) {
          const dados = await resUsuarios.json();
          const lista = Array.isArray(dados) ? dados : [];
          setUsuariosApi(lista);
          if (lista.length > 0) setResponsaveis([lista[0]]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInitial(false);
      }
    }
    carregarDadosBanco();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return clientesApi;
    const q = clientSearchQuery.toLowerCase();
    const qNum = clientSearchQuery.replace(/\D/g, "");

    return clientesApi.filter((c) => {
      const matriz = (c.empresas || []).find((e) => e.is_matriz) || (c.empresas || [])[0] || {};
      const nomeFantasia = (c.nomeFantasia || "").toLowerCase();
      const razao = (matriz.razaoSocial || "").toLowerCase();
      const cnpjStr = matriz.cnpj || "";

      return (
        nomeFantasia.includes(q) ||
        razao.includes(q) ||
        cnpjStr.includes(clientSearchQuery) ||
        (qNum && cnpjStr.replace(/\D/g, "").includes(qNum))
      );
    });
  }, [clientSearchQuery, clientesApi]);

  function handleSelectExistingClient(client) {
    const matriz = (client.empresas || []).find((e) => e.is_matriz) || (client.empresas || [])[0] || {};
    setSelectedClientId(client.id);
    setClientName(client.nomeFantasia || "");
    setRazaoSocial(matriz.razaoSocial || client.nomeFantasia || "");
    setCnpj(matriz.cnpj || "");
    setDomain(client.dominio || "");
    setContaFrete(formatMoneyBRL(client.valorContaFrete || 0));

    if (client.dataAssContrato) setSignatureDate(client.dataAssContrato);
    if (client.dataIniImpl) setStartDate(client.dataIniImpl);
    if (client.dataFinImpl) setGoLiveDate(client.dataFinImpl);

    setIsSearchOpen(false);
    setClientSearchQuery(client.nomeFantasia);
    if (errors.clientName) setErrors((prev) => ({ ...prev, clientName: null }));
  }

  function handleAddResponsavel() {
    if (!selectedResponsavelId) return;
    const idNum = Number(selectedResponsavelId);
    if (responsaveis.some((u) => u.id === idNum)) return;

    const userObj = usuariosApi.find((u) => u.id === idNum);
    if (userObj) {
      setResponsaveis((prev) => [...prev, userObj]);
      setSelectedResponsavelId("");
      if (errors.assignee) setErrors((prev) => ({ ...prev, assignee: null }));
    }
  }

  function handleRemoveResponsavel(id) {
    setResponsaveis((prev) => prev.filter((u) => u.id !== id));
  }

  // Manipulação de Checklists e Itens
  function handleToggleTask(phaseName, taskId) {
    setChecklist((prev) => ({
      ...prev,
      [phaseName]: prev[phaseName].map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
    }));
  }

  function handleAddTask(phaseName) {
    const text = (newTaskInput[phaseName] || "").trim();
    if (!text) return;

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: text,
      done: false,
    };

    setChecklist((prev) => ({
      ...prev,
      [phaseName]: [...(prev[phaseName] || []), newTask],
    }));

    setNewTaskInput((prev) => ({ ...prev, [phaseName]: "" }));
  }

  function handleRemoveTask(phaseName, taskId) {
    setChecklist((prev) => ({
      ...prev,
      [phaseName]: prev[phaseName].filter((t) => t.id !== taskId),
    }));
  }

  function handleAddPhase() {
    const nome = newPhaseName.trim();
    if (!nome) return;
    if (checklist[nome]) {
      alert("Já existe uma fase com este nome.");
      return;
    }

    setChecklist((prev) => ({
      ...prev,
      [nome]: [],
    }));

    setExpandedPhases((prev) => ({ ...prev, [nome]: true }));
    setNewPhaseName("");
    setAddingPhase(false);
  }

  function handleRemovePhase(phaseName) {
    if (!window.confirm(`Remover a fase "${phaseName}" e todos os seus itens?`)) return;
    setChecklist((prev) => {
      const copy = { ...prev };
      delete copy[phaseName];
      return copy;
    });
  }

  function validateForm() {
    const newErrors = {};
    if (!selectedClientId) newErrors.clientName = "Selecione um cliente ativo na base.";
    if (responsaveis.length === 0) newErrors.assignee = "Vincule ao menos um responsável.";
    if (!startDate) newErrors.startDate = "A data de início é obrigatória.";
    if (!goLiveDate) newErrors.goLiveDate = "A data prevista para Go-Live é obrigatória.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setSubmitting(true);
      const observacaoCompleta = [
        notes.trim(),
        `\n[Metadados] Prioridade: ${priority} | Fase: ${status} | Go-Live: ${goLiveDate}`,
      ].filter(Boolean).join(" | ");

      const payload = {
        cliente_id: Number(selectedClientId),
        responsavel: responsaveis[0]?.id || null,
        status: "A",
        observacao: observacaoCompleta,
        usuario_ids: responsaveis.map((u) => u.id),
        checklist: checklist,
        dataAssContrato: signatureDate || null,
        dataIniImpl: startDate || null,
        dataFinImpl: goLiveDate || null,
      };

      const res = await fetch(`${BASE_URL}/novas-implantacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Erro ao salvar implantação.");
        return;
      }

      const novaImp = await res.json();
      setCreatedId(`IMP-${String(novaImp.id).padStart(4, "0")}`);
      setShowSuccessModal(true);
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#F4F6F9" }}>
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-20" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-[#0066CC] cursor-pointer"
          >
            ← Projetos de Implantação
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer shadow-xs disabled:opacity-50"
              style={{ background: "#F26522" }}
            >
              {submitting ? "Gravando..." : "Salvar Implantação"}
            </button>
          </div>
        </div>

        <h1 className="text-xl font-bold text-[#1E293B]">🚀 Cadastro de Nova Implantação</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Identificação do Cliente */}
        <div className="bg-white rounded-xl border p-6 shadow-2xs" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-sm font-bold text-[#1E293B] mb-4">1. Identificação do Cliente</h2>

          <div className="mb-4 relative" ref={searchContainerRef}>
            <label className="text-xs font-medium block mb-1 text-[#64748B]">
              Selecionar Cliente Cadastrado <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={loadingInitial ? "Carregando clientes..." : "Buscar por Razão Social, Fantasia ou CNPJ..."}
              value={clientSearchQuery}
              onChange={(e) => {
                setClientSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full text-sm border rounded-lg px-3 py-2 outline-none"
              style={{ borderColor: errors.clientName ? "#E11D48" : "#E2E8F0" }}
            />

            {isSearchOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border rounded-xl shadow-xl max-h-60 overflow-y-auto"
                style={{ borderColor: "#E2E8F0" }}
              >
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectExistingClient(c)}
                    className="w-full text-left px-4 py-2.5 border-b last:border-b-0 hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                    style={{ borderColor: "#F1F5F9" }}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#1E293B]">{c.nomeFantasia}</div>
                      <div className="text-[11px] text-slate-500">
                        CNPJ: {formatCNPJ(c.empresas?.[0]?.cnpj || "")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1 text-slate-500">Nome Fantasia</label>
              <input type="text" readOnly value={clientName} className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 font-semibold" style={{ borderColor: "#E2E8F0" }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1 text-slate-500">CNPJ</label>
              <input type="text" readOnly value={cnpj ? formatCNPJ(cnpj) : ""} className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 font-mono" style={{ borderColor: "#E2E8F0" }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1 text-slate-500">Domínio FG</label>
              <input type="text" readOnly value={domain} className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50" style={{ borderColor: "#E2E8F0" }} />
            </div>
          </div>
        </div>

        {/* Responsáveis e Datas Editáveis */}
        <div className="bg-white rounded-xl border p-6 shadow-2xs" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-sm font-bold text-[#1E293B] mb-4">2. Gestão do Projeto & Cronograma</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-medium block text-[#64748B]">
                Analistas Responsáveis <span className="text-red-500">*</span>
              </label>

              <div className="flex gap-2">
                <select
                  value={selectedResponsavelId}
                  onChange={(e) => setSelectedResponsavelId(e.target.value)}
                  className="flex-1 text-sm border rounded-lg px-3 py-2 outline-none bg-white cursor-pointer"
                  style={{ borderColor: "#E2E8F0" }}
                >
                  <option value="">Selecione um analista...</option>
                  {usuariosApi
                    .filter((u) => !responsaveis.some((r) => r.id === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} ({u.setor})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddResponsavel}
                  disabled={!selectedResponsavelId}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs"
                  style={{ background: "#0066CC" }}
                >
                  + Adicionar
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {responsaveis.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-blue-50 border-blue-200 text-[#0066CC] text-xs font-semibold"
                  >
                    <span>👤 {u.nome} ({u.setor})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveResponsavel(u.id)}
                      className="hover:text-red-600 font-bold ml-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5 text-[#64748B]">Prioridade</label>
              <div className="flex gap-2">
                {["Alta", "Média", "Baixa"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className="flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer"
                    style={{
                      borderColor: priority === p ? PRIORITY_COLORS[p].color : "#E2E8F0",
                      background: priority === p ? PRIORITY_COLORS[p].bg : "transparent",
                      color: priority === p ? PRIORITY_COLORS[p].color : "#64748B",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Datas Editáveis */}
            <div>
              <label className="text-xs font-medium block mb-1 text-[#64748B]">Assinatura do Contrato</label>
              <input
                type="date"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none bg-white"
                style={{ borderColor: "#E2E8F0" }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1 text-[#64748B]">Início da Implantação *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none bg-white"
                style={{ borderColor: "#E2E8F0" }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1 text-[#64748B]">Previsão de Go-Live *</label>
              <input
                type="date"
                value={goLiveDate}
                onChange={(e) => setGoLiveDate(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none font-semibold bg-white"
                style={{ borderColor: "#E2E8F0" }}
              />
            </div>
          </div>
        </div>

        {/* Checklist Dinâmico: Adicionar Fases e Itens */}
        <div className="bg-white rounded-xl border p-6 shadow-2xs" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">3. Checklist Operacional</h2>
              <p className="text-xs text-[#64748B]">Adicione novas fases ou tarefas personalizadas.</p>
            </div>

            <button
              type="button"
              onClick={() => setAddingPhase(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-300 text-[#0066CC] hover:bg-blue-50 cursor-pointer"
            >
              + Nova Fase / Checklist
            </button>
          </div>

          {/* Modal / Bloco de Adicionar Nova Fase */}
          {addingPhase && (
            <div className="mb-4 p-4 border rounded-xl bg-slate-50 flex items-center gap-2" style={{ borderColor: "#E2E8F0" }}>
              <input
                type="text"
                placeholder="Nome da nova fase (Ex: Fase 5: Integração Fiscal)..."
                value={newPhaseName}
                onChange={(e) => setNewPhaseName(e.target.value)}
                className="flex-1 text-xs border rounded-lg px-3 py-2 outline-none bg-white"
                style={{ borderColor: "#CBD5E1" }}
              />
              <button
                type="button"
                onClick={handleAddPhase}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
                style={{ background: "#0066CC" }}
              >
                Salvar Fase
              </button>
              <button
                type="button"
                onClick={() => { setAddingPhase(false); setNewPhaseName(""); }}
                className="px-3 py-2 text-xs text-slate-500 hover:underline cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(checklist).map(([phaseName, tasks], idx) => (
              <div key={phaseName} className="border rounded-xl overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
                <div className="p-3 bg-[#F8FAFC] flex items-center justify-between border-b" style={{ borderColor: "#E2E8F0" }}>
                  <div
                    onClick={() =>
                      setExpandedPhases((prev) => ({ ...prev, [phaseName]: !prev[phaseName] }))
                    }
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <span className="text-xs font-bold text-[#1E293B]">
                      #{idx + 1} {phaseName} ({tasks.length} itens)
                    </span>
                    <span className="text-xs text-slate-400">
                      {expandedPhases[phaseName] ? "▲" : "▼"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemovePhase(phaseName)}
                    className="text-xs text-red-500 hover:underline cursor-pointer px-2"
                  >
                    Excluir Fase
                  </button>
                </div>

                {expandedPhases[phaseName] && (
                  <div className="p-4 space-y-2 bg-white">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50">
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => handleToggleTask(phaseName, task.id)}
                            className="rounded accent-[#0066CC]"
                          />
                          <span className={`text-xs ${task.done ? "line-through text-slate-400" : "text-slate-700"}`}>
                            {task.label}
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveTask(phaseName, task.id)}
                          className="text-xs text-red-500 hover:underline cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Campo para Adicionar Novo Item nesta Fase */}
                    <div className="flex gap-2 pt-2 border-t mt-2" style={{ borderColor: "#F1F5F9" }}>
                      <input
                        type="text"
                        placeholder="Adicionar tarefa personalizada nesta fase..."
                        value={newTaskInput[phaseName] || ""}
                        onChange={(e) =>
                          setNewTaskInput((prev) => ({ ...prev, [phaseName]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTask(phaseName);
                          }
                        }}
                        className="flex-1 text-xs border rounded-lg px-3 py-1.5 outline-none bg-white"
                        style={{ borderColor: "#E2E8F0" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTask(phaseName)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
                        style={{ background: "#0066CC" }}
                      >
                        + Item
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-xl border p-6 shadow-2xs" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-sm font-bold text-[#1E293B] mb-2">4. Observações Iniciais</h2>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalhes adicionais sobre o escopo e alinhamento..."
            className="w-full text-xs border rounded-lg p-3 outline-none bg-white"
            style={{ borderColor: "#E2E8F0" }}
          />
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border" style={{ borderColor: "#E2E8F0" }}>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            ← Voltar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-md cursor-pointer disabled:opacity-50"
            style={{ background: "#F26522" }}
          >
            {submitting ? "Gravando..." : "Finalizar e Iniciar Implantação"}
          </button>
        </div>
      </form>

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center border shadow-2xl" style={{ borderColor: "#E2E8F0" }}>
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 text-2xl bg-emerald-50 text-emerald-600">
              🚀
            </div>
            <h3 className="text-lg font-bold text-[#1E293B]">Implantação Criada com Sucesso!</h3>
            <p className="text-xs text-[#64748B] mt-2">
              O projeto <strong className="text-[#0066CC]">{createdId}</strong> para o cliente{" "}
              <strong>{clientName}</strong> foi registrado na base de dados com seus responsáveis e checklists associados.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Voltar à Listagem
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onCreated) onCreated(createdId);
                  else onBack();
                }}
                className="flex-1 py-2 rounded-lg text-xs font-bold text-white cursor-pointer"
                style={{ background: "#0066CC" }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}