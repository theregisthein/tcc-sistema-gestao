import { useState, useEffect, useMemo } from "react";

const BASE_URL = "http://localhost:8000/api";

const STATUS_STAGES = [
  "Coleta de Dados",
  "Parametrização de Tabelas",
  "Em Homologação",
  "Go-Live Agendado",
  "Finalizada",
];

const STATUS_COLORS = {
  "Coleta de Dados": { bg: "#EBF4FF", color: "#0066CC" },
  "Parametrização de Tabelas": { bg: "#FFF1E8", color: "#F26522" },
  "Em Homologação": { bg: "#FFFBEB", color: "#D97706" },
  "Go-Live Agendado": { bg: "#ECFDF5", color: "#10B981" },
  "Finalizada": { bg: "#F1F5F9", color: "#64748B" },
};

const PRIORITY_COLORS = {
  Alta: "#F26522",
  Média: "#F59E0B",
  Baixa: "#10B981",
};

function extrairMetadado(observacao, chave, padrao = "") {
  if (!observacao) return padrao;
  const match = observacao.match(new RegExp(`${chave}:\\s*([^|\\n]+)`));
  return match ? match[1].trim() : padrao;
}

function calcularDiasRestantes(dataAlvo) {
  if (!dataAlvo) return null;
  const target = new Date(dataAlvo);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatarDataBR(dataStr) {
  if (!dataStr) return "—";
  const d = new Date(dataStr + (dataStr.includes("T") ? "" : "T00:00:00"));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export default function Implantacoes({ initialStatus, onViewImplantacao, onNovaImplantacao }) {
  const [implantacoes, setImplantacoes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [statusFilter, setStatusFilter] = useState(
    initialStatus === "Finalizada" ? "Finalizada" : "Todos"
  );
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [assigneeFilter, setAssigneeFilter] = useState("Todos");
  const [clientSearch, setClientSearch] = useState("");
  const [ordenacao, setOrdenacao] = useState("prazo");
  const [showFilters, setShowFilters] = useState(true);

  async function carregarDados() {
    try {
      setCarregando(true);
      const [resImp, resUsers] = await Promise.all([
        fetch(`${BASE_URL}/novas-implantacoes`),
        fetch(`${BASE_URL}/usuarios`),
      ]);

      if (resImp.ok) {
        const dadosImp = await resImp.json();
        setImplantacoes(Array.isArray(dadosImp) ? dadosImp : []);
      }

      if (resUsers.ok) {
        const dadosUsers = await resUsers.json();
        setUsuarios(Array.isArray(dadosUsers) ? dadosUsers : []);
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

  async function atualizarCampoInline(id, campo, valor) {
    try {
      const res = await fetch(`${BASE_URL}/novas-implantacoes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ [campo]: valor }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Erro ao atualizar implantação");
        return;
      }

      await carregarDados();
    } catch (err) {
      console.error(err);
      alert("Erro de comunicação com o servidor.");
    }
  }

  const listaNormalizada = useMemo(() => {
    return implantacoes.map((imp) => {
      const cliente = imp.cliente || {};
      const matriz = (cliente.empresas || []).find((e) => e.is_matriz) || (cliente.empresas || [])[0] || {};
      const responsavel = imp.usuario_responsavel || imp.usuarioResponsavel || {};

      const nomeCliente = cliente.nomeFantasia || matriz.razaoSocial || `Cliente #${imp.cliente_id}`;
      const iniciais = nomeCliente.slice(0, 2).toUpperCase();

      const faseAtual = extrairMetadado(imp.observacao, "Fase", imp.status === "F" ? "Finalizada" : "Coleta de Dados");
      const prioridade = extrairMetadado(imp.observacao, "Prioridade", "Alta");
      const dataGoLive = extrairMetadado(imp.observacao, "Go-Live", cliente.dataFinImpl || "");
      const dataInicio = cliente.dataIniImpl || imp.created_at?.slice(0, 10) || "";
      const dataAssinatura = cliente.dataAssContrato || dataInicio;

      const diasRestantes = calcularDiasRestantes(dataGoLive);

      let totalTarefas = 0;
      let tarefasConcluidas = 0;
      if (Array.isArray(imp.checklists)) {
        imp.checklists.forEach((chk) => {
          if (Array.isArray(chk.itens)) {
            totalTarefas += chk.itens.length;
            tarefasConcluidas += chk.itens.filter((item) => item.concluido).length;
          }
        });
      }

      const progresso = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;

      return {
        idRaw: imp.id,
        idFormatado: `IMP-${String(imp.id).padStart(4, "0")}`,
        clienteNome: nomeCliente,
        clienteIniciais: iniciais,
        dominio: cliente.dominio || "—",
        plano: cliente.plano?.nome || "Starter",
        responsavelId: imp.responsavel,
        responsavelNome: responsavel.nome || "Não atribuído",
        fase: faseAtual,
        prioridade,
        dataInicio,
        dataAssinatura,
        dataGoLive,
        diasRestantes,
        atrasado: diasRestantes !== null && diasRestantes < 0,
        totalTarefas,
        tarefasConcluidas,
        progresso,
        createdAt: imp.created_at,
        integracoes: extrairMetadado(imp.observacao, "Integrações", ""),
      };
    });
  }, [implantacoes]);

  const filtrados = useMemo(() => {
    return listaNormalizada
      .filter((i) => {
        if (statusFilter !== "Todos" && statusFilter !== "Em Andamento") {
          if (i.fase !== statusFilter) return false;
        }
        if (statusFilter === "Em Andamento" && i.fase === "Finalizada") return false;
        if (priorityFilter !== "Todas" && i.prioridade !== priorityFilter) return false;
        if (assigneeFilter !== "Todos" && String(i.responsavelId) !== String(assigneeFilter)) return false;
        if (clientSearch && !i.clienteNome.toLowerCase().includes(clientSearch.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (ordenacao === "prazo") {
          if (a.diasRestantes === null) return 1;
          if (b.diasRestantes === null) return -1;
          return a.diasRestantes - b.diasRestantes;
        }
        if (ordenacao === "progresso") {
          return b.progresso - a.progresso;
        }
        return b.idRaw - a.idRaw;
      });
  }, [listaNormalizada, statusFilter, priorityFilter, assigneeFilter, clientSearch, ordenacao]);

  const totalEmAndamento = listaNormalizada.filter((i) => i.fase !== "Finalizada").length;
  const totalFinalizadas = listaNormalizada.filter((i) => i.fase === "Finalizada").length;

  return (
    <div className="flex flex-1 overflow-hidden" style={{ background: "#F4F6F9" }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-white flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                🚀 Projetos de Implantação
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-sm font-bold" style={{ background: "#0B2847", color: "#fff" }}>
                {totalEmAndamento}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: "#ECFDF5", color: "#10B981" }}>
                Finalizadas: {totalFinalizadas}
              </span>
            </div>
            <button
              onClick={onNovaImplantacao}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer shadow-xs"
              style={{ background: "#F26522" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#d4541a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#F26522"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nova Implantação
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {statusFilter !== "Todos" && (
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: "#EBF4FF", color: "#0066CC" }}
              >
                Fase: {statusFilter}
                <button onClick={() => setStatusFilter("Todos")} className="cursor-pointer">
                  ✕
                </button>
              </span>
            )}

            {assigneeFilter !== "Todos" && (
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: "#EBF4FF", color: "#0066CC" }}
              >
                Responsável: {usuarios.find((u) => String(u.id) === String(assigneeFilter))?.nome || assigneeFilter}
                <button onClick={() => setAssigneeFilter("Todos")} className="cursor-pointer">
                  ✕
                </button>
              </span>
            )}

            <div className="ml-auto flex items-center gap-2">
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                className="text-xs border rounded-lg px-2.5 py-1.5 outline-none bg-white cursor-pointer"
                style={{ borderColor: "#E2E8F0", color: "#64748B" }}
              >
                <option value="prazo">Ordenar por: Prazo de Go-Live</option>
                <option value="progresso">Ordenar por: Progresso</option>
                <option value="criacao">Ordenar por: Recentes</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer"
                style={{
                  borderColor: showFilters ? "#0066CC" : "#E2E8F0",
                  color: showFilters ? "#0066CC" : "#64748B",
                  background: showFilters ? "#EBF4FF" : "transparent",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {carregando && (
            <div className="text-center py-16 text-sm text-[#64748B]">
              Carregando projetos de implantação...
            </div>
          )}

          {!carregando && filtrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-3">🚀</div>
              <p className="font-semibold text-base" style={{ color: "#1E293B" }}>
                Nenhuma implantação cadastrada no sistema.
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Clique no botão "Nova Implantação" acima para cadastrar o primeiro onboarding.
              </p>
            </div>
          )}

          {!carregando &&
            filtrados.map((imp) => {
              const statusStyle = STATUS_COLORS[imp.fase] || { bg: "#F1F5F9", color: "#64748B" };

              return (
                <div
                  key={imp.idRaw}
                  className="bg-white rounded-xl border flex items-stretch overflow-hidden cursor-pointer transition-all duration-150 group shadow-2xs hover:shadow-md"
                  style={{ borderColor: "#E2E8F0" }}
                  onClick={() => onViewImplantacao && onViewImplantacao(imp.idRaw)}
                >
                  <div
                    className="w-1.5 flex-shrink-0"
                    style={{ background: PRIORITY_COLORS[imp.prioridade] || "#0066CC" }}
                  />

                  <div className="flex items-center pl-4 pr-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: "#0B2847" }}
                    >
                      {imp.clienteIniciais}
                    </div>
                  </div>

                  <div className="flex-1 py-3.5 px-3 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: "#1E293B" }}>
                        {imp.clienteNome}
                      </span>
                      <span className="text-xs font-mono text-slate-500">{imp.idFormatado}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {imp.plano}
                      </span>
                      {imp.dominio && imp.dominio !== "—" && (
                        <span className="text-xs text-[#64748B]">🌐 {imp.dominio}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-2.5 flex-wrap text-xs text-[#64748B]">
                      <span>Início: <strong>{formatarDataBR(imp.dataInicio)}</strong></span>
                      <span>Assinatura: <strong>{formatarDataBR(imp.dataAssinatura)}</strong></span>
                      {imp.integracoes && (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-medium">
                          🔗 {imp.integracoes}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex-1 max-w-xs">
                        <div className="flex items-center justify-between mb-1 text-[11px]">
                          <span style={{ color: "#64748B" }}>
                            {imp.totalTarefas > 0
                              ? `${imp.tarefasConcluidas} de ${imp.totalTarefas} tarefas concluídas`
                              : "Checklist pendente"}
                          </span>
                          <span className="font-bold" style={{ color: "#1E293B" }}>
                            {imp.progresso}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${imp.progresso}%`,
                              background: imp.progresso === 100 ? "#10B981" : "#0066CC",
                            }}
                          />
                        </div>
                      </div>

                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={
                          imp.atrasado
                            ? { background: "#FFF1F2", color: "#E11D48" }
                            : imp.diasRestantes !== null && imp.diasRestantes <= 5
                            ? { background: "#FFFBEB", color: "#D97706" }
                            : { background: "#ECFDF5", color: "#10B981" }
                        }
                      >
                        {imp.diasRestantes === null
                          ? "Sem data de Go-Live"
                          : imp.atrasado
                          ? `⚠️ Atrasado há ${Math.abs(imp.diasRestantes)} dias`
                          : imp.diasRestantes === 0
                          ? "🎯 Go-Live hoje!"
                          : `⏳ ${imp.diasRestantes} dias para Go-Live`}
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3 px-4 flex-shrink-0 bg-[#FAFBFC] border-l"
                    style={{ borderColor: "#E2E8F0" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <label className="text-[10px] uppercase font-bold block text-slate-400 mb-0.5">
                        Responsável
                      </label>
                      <select
                        value={imp.responsavelId || ""}
                        onChange={(e) =>
                          atualizarCampoInline(imp.idRaw, "responsavel", e.target.value ? Number(e.target.value) : null)
                        }
                        className="text-xs border rounded-md px-2 py-1 bg-white outline-none cursor-pointer font-medium max-w-[130px]"
                        style={{ borderColor: "#CBD5E1", color: "#1E293B" }}
                      >
                        <option value="">Não atribuído</option>
                        {usuarios.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold block text-slate-400 mb-0.5">
                        Fase Atual
                      </label>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-md block text-center"
                        style={statusStyle}
                      >
                        {imp.fase}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Painel lateral de filtros */}
      {showFilters && (
        <div
          className="w-72 flex-shrink-0 flex flex-col border-l bg-white overflow-y-auto"
          style={{ borderColor: "#E2E8F0" }}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <span className="font-bold text-sm text-[#1E293B]">Filtros de Implantação</span>
            <button
              className="text-xs font-semibold text-[#0066CC] hover:underline cursor-pointer"
              onClick={() => {
                setStatusFilter("Todos");
                setPriorityFilter("Todas");
                setAssigneeFilter("Todos");
                setClientSearch("");
              }}
            >
              Limpar Tudo
            </button>
          </div>

          <div className="p-4 space-y-5">
            <FilterSection label="Responsável da Equipe">
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full text-xs border rounded-lg px-3 py-2 outline-none bg-white cursor-pointer"
                style={{ borderColor: "#CBD5E1", color: "#1E293B" }}
              >
                <option value="Todos">Todos os analistas</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.setor})
                  </option>
                ))}
              </select>
            </FilterSection>

            <FilterSection label="Fase do Onboarding">
              <div className="space-y-1.5">
                {["Todos", ...STATUS_STAGES].map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer text-xs text-[#1E293B]">
                    <input
                      type="radio"
                      name="imp-status"
                      value={s}
                      checked={statusFilter === s}
                      onChange={() => setStatusFilter(s)}
                      className="accent-[#0066CC]"
                    />
                    <span>{s}</span>
                    {s !== "Todos" && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {listaNormalizada.filter((i) => i.fase === s).length}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection label="Buscar por Cliente">
              <input
                type="text"
                placeholder="Nome do cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full text-xs border rounded-lg px-3 py-2 outline-none bg-white"
                style={{ borderColor: "#CBD5E1", color: "#1E293B" }}
              />
            </FilterSection>

            <FilterSection label="Nível de Prioridade">
              <div className="grid grid-cols-2 gap-1.5">
                {["Todas", "Alta", "Média", "Baixa"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriorityFilter(p)}
                    className="py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer"
                    style={{
                      borderColor: priorityFilter === p ? (PRIORITY_COLORS[p] || "#0066CC") : "#E2E8F0",
                      background: priorityFilter === p ? `${PRIORITY_COLORS[p] || "#0066CC"}15` : "transparent",
                      color: priorityFilter === p ? (PRIORITY_COLORS[p] || "#0066CC") : "#64748B",
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