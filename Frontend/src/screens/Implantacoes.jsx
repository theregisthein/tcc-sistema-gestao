import { useState } from "react";
import { IMPLANTACOES, CURRENT_USER } from "../data/mock";

const STATUS_STAGES = ["Coleta de Dados", "Parametrização de Tabelas", "Em Homologação", "Go-Live Agendado", "Finalizada"];

const STATUS_COLORS = {
  "Coleta de Dados": { bg: "#EBF4FF", color: "#0066CC" },
  "Parametrização de Tabelas": { bg: "#FFF1E8", color: "#F26522" },
  "Em Homologação": { bg: "#FFFBEB", color: "#D97706" },
  "Go-Live Agendado": { bg: "#ECFDF5", color: "#10B981" },
  "Finalizada": { bg: "#F1F5F9", color: "#64748B" },
};

const PRIORITY_COLORS = {
  "Alta": "#F26522",
  "Média": "#F59E0B",
  "Baixa": "#10B981",
};

const INTEGRATION_COLORS = {
  "Protheus": { bg: "#EBF4FF", color: "#0066CC" },
  "VTEX": { bg: "#F5F3FF", color: "#7C3AED" },
  "Bling": { bg: "#ECFDF5", color: "#059669" },
  "Tiny": { bg: "#FFF7ED", color: "#EA580C" },
  "WooCommerce": { bg: "#F5F3FF", color: "#9333EA" },
  "SAP": { bg: "#FFF1F2", color: "#E11D48" },
};

export default function Implantacoes({ initialStatus, onViewImplantacao, onNovaImplantacao }) {
  const [statusFilter, setStatusFilter] = useState(
    initialStatus === "Finalizada" ? "Finalizada" : "Todos"
  );
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [clientSearch, setClientSearch] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  const filtered = IMPLANTACOES.filter((i) => {
    if (statusFilter !== "Todos" && statusFilter !== "Em Andamento") {
      if (i.status !== statusFilter) return false;
    }
    if (statusFilter === "Em Andamento" && i.status === "Finalizada") return false;
    if (priorityFilter !== "Todas" && i.priority !== priorityFilter) return false;
    if (clientSearch && !i.client.toLowerCase().includes(clientSearch.toLowerCase())) return false;
    return true;
  });

  const emAndamento = IMPLANTACOES.filter((i) => i.status !== "Finalizada").length;
  const finalizadasMes = IMPLANTACOES.filter((i) => i.status === "Finalizada").length;

  return (
    <div className="flex flex-1 overflow-hidden" style={{ background: "#F4F6F9" }}>
      {/* Main feed */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-white flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                🚀 Projetos de Implantação
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-sm font-bold" style={{ background: "#0B2847", color: "#fff" }}>
                {emAndamento}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: "#ECFDF5", color: "#10B981" }}>
                Finalizadas no Mês: {finalizadasMes}
              </span>
            </div>
            <button
              onClick={onNovaImplantacao}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer"
              style={{ background: "#F26522" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#d4541a"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#F26522"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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
                Status: {statusFilter}
                <button onClick={() => setStatusFilter("Todos")}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            )}
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "#EBF4FF", color: "#0066CC" }}>
              Responsável: {CURRENT_USER.name}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <select className="text-xs border rounded-lg px-2 py-1.5 outline-none" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>
                <option>Ordenar por: Prazo para Go-Live ▾</option>
                <option>Ordenar por: Progresso</option>
                <option>Ordenar por: Criação</option>
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-3">🚀</div>
              <p className="font-medium" style={{ color: "#1E293B" }}>Nenhuma implantação encontrada</p>
            </div>
          )}

          {filtered.map((imp) => {
            const progress = Math.round((imp.tasksDone / imp.tasksTotal) * 100);
            const statusStyle = STATUS_COLORS[imp.status] || { bg: "#F1F5F9", color: "#64748B" };

            return (
              <div
                key={imp.id}
                className="bg-white rounded-xl border flex items-stretch overflow-hidden cursor-pointer transition-all duration-150 group"
                style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                  e.currentTarget.style.borderColor = "#0066CC";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                }}
                onClick={() => onViewImplantacao(imp.id)}
              >
                {/* Left priority bar */}
                <div className="w-1 flex-shrink-0" style={{ background: PRIORITY_COLORS[imp.priority] }} />

                {/* Checkbox */}
                <div className="flex items-center px-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="rounded" />
                </div>

                {/* Avatar */}
                <div className="flex items-center px-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: "#0B2847" }}
                  >
                    {imp.clientInitials}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 py-3.5 px-2 min-w-0">
                  {/* Line 1 */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>{imp.client}</span>
                    <span className="text-xs" style={{ color: "#64748B" }}>{imp.id}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#EBF4FF", color: "#0066CC" }}>
                      {imp.plan}
                    </span>
                    <span className="text-xs" style={{ color: "#64748B" }}>🌐 {imp.domain}</span>
                  </div>

                  {/* Line 2 */}
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-xs" style={{ color: "#64748B" }}>Início: {imp.startDate}</span>
                    <span className="text-xs" style={{ color: "#64748B" }}>Assinatura: {imp.signatureDate}</span>
                    {imp.integrations.map((int) => {
                      const ic = INTEGRATION_COLORS[int] || { bg: "#F1F5F9", color: "#64748B" };
                      return (
                        <span key={int} className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={ic}>
                          {int}
                        </span>
                      );
                    })}
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#F1F5F9", color: "#64748B" }}>
                      📦 {imp.tablesCount} Tabelas
                    </span>
                  </div>

                  {/* Line 3: Progress */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-48">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px]" style={{ color: "#64748B" }}>
                          {imp.tasksDone} de {imp.tasksTotal} tarefas
                        </span>
                        <span className="text-[11px] font-semibold" style={{ color: "#1E293B" }}>{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress}%`,
                            background: progress === 100 ? "#10B981" : "#0066CC",
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={
                        imp.overdue
                          ? { background: "#FFF1F2", color: "#E11D48" }
                          : imp.daysRemaining <= 5
                          ? { background: "#FFFBEB", color: "#D97706" }
                          : { background: "#ECFDF5", color: "#10B981" }
                      }
                    >
                      {imp.overdue
                        ? `⚠️ Atrasado há ${Math.abs(imp.daysRemaining)} dias`
                        : imp.daysRemaining === 0
                        ? "🎯 Go-Live hoje!"
                        : `⏳ ${imp.daysRemaining} dias para Go-Live`}
                    </span>
                  </div>
                </div>

                {/* Right inline selectors */}
                <div className="flex items-center gap-3 px-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Priority */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLORS[imp.priority] }} />
                    <select
                      className="text-xs border-none bg-transparent outline-none cursor-pointer font-medium"
                      style={{ color: PRIORITY_COLORS[imp.priority] }}
                      defaultValue={imp.priority}
                    >
                      <option>Alta</option><option>Média</option><option>Baixa</option>
                    </select>
                  </div>

                  <div className="h-6 w-px" style={{ background: "#E2E8F0" }} />

                  {/* Assignee */}
                  <select
                    className="text-xs border-none bg-transparent outline-none cursor-pointer max-w-[120px]"
                    style={{ color: "#64748B" }}
                    defaultValue={imp.assignee}
                  >
                    <option>Régis Rinaldi</option>
                    <option>Ana Paula Costa</option>
                    <option>Carlos Mendes</option>
                  </select>

                  <div className="h-6 w-px" style={{ background: "#E2E8F0" }} />

                  {/* Status */}
                  <select
                    className="text-xs font-medium border-none bg-transparent outline-none cursor-pointer"
                    style={{ color: statusStyle.color }}
                    defaultValue={imp.status}
                  >
                    {STATUS_STAGES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="w-72 flex-shrink-0 flex flex-col border-l overflow-y-auto" style={{ background: "#fff", borderColor: "#E2E8F0" }}>
          <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>Filtros de Implantação</span>
            <button
              className="text-xs font-medium"
              style={{ color: "#0066CC" }}
              onClick={() => { setStatusFilter("Todos"); setPriorityFilter("Todas"); setClientSearch(""); }}
            >
              Limpar Filtros
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            <FilterSection label="Responsável">
              <select className="w-full text-xs border rounded-lg px-3 py-2 outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }} defaultValue={CURRENT_USER.name}>
                <option>Régis Rinaldi</option>
                <option>Ana Paula Costa</option>
                <option>Carlos Mendes</option>
                <option>Todos</option>
              </select>
            </FilterSection>

            <FilterSection label="Status do Onboarding">
              <div className="space-y-1.5">
                {["Todos", ...STATUS_STAGES].map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="imp-status"
                      value={s}
                      checked={statusFilter === s}
                      onChange={() => setStatusFilter(s)}
                      className="accent-[#0066CC]"
                    />
                    <span className="text-xs" style={{ color: "#1E293B" }}>{s}</span>
                    {s !== "Todos" && STATUS_COLORS[s] && (
                      <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={STATUS_COLORS[s]}>
                        {IMPLANTACOES.filter((i) => i.status === s).length}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection label="Nome do Cliente">
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
              <div className="flex gap-2">
                {["Todas", "Alta", "Média", "Baixa"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className="flex-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors"
                    style={{
                      borderColor: priorityFilter === p ? (PRIORITY_COLORS[p] || "#0066CC") : "#E2E8F0",
                      background: priorityFilter === p ? `${PRIORITY_COLORS[p] || "#0066CC"}18` : "transparent",
                      color: priorityFilter === p ? (PRIORITY_COLORS[p] || "#0066CC") : "#64748B",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </FilterSection>

            <FilterSection label="Sistemas Integrados">
              <div className="flex flex-wrap gap-1.5">
                {["Bling", "Tiny", "Protheus", "VTEX", "WooCommerce", "SAP"].map((s) => {
                  const ic = INTEGRATION_COLORS[s] || { bg: "#F1F5F9", color: "#64748B" };
                  return (
                    <button key={s} className="px-2 py-0.5 rounded text-[11px] font-medium" style={ic}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </FilterSection>

            <FilterSection label="Prazo para Go-Live (SLA)">
              <select className="w-full text-xs border rounded-lg px-3 py-2 outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }}>
                <option>Qualquer período</option>
                <option>No prazo</option>
                <option>Próximo do limite (5 dias)</option>
                <option>Vencido / Atrasado</option>
              </select>
            </FilterSection>

            <FilterSection label="Data Inicial">
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="text-xs border rounded-lg px-2 py-1.5 outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }} />
                <input type="date" className="text-xs border rounded-lg px-2 py-1.5 outline-none" style={{ borderColor: "#E2E8F0", color: "#1E293B" }} />
              </div>
            </FilterSection>
          </div>

          <div className="p-4 border-t" style={{ borderColor: "#E2E8F0" }}>
            <button
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: "#0066CC" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#0054a8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#0066CC"; }}
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({ label, children }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>{label}</div>
      {children}
    </div>
  );
}
