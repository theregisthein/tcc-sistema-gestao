import { useState, useEffect } from "react";

const BASE_URL = "http://localhost:8000/api";

function KpiCard({
  label,
  value,
  color,
  bg,
  icon,
  trend,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl p-5 border transition-all duration-150 group cursor-pointer"
      style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = "#E2E8F0";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: bg }}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
            {trend}
          </span>
        )}
      </div>
      <div className="font-bold text-3xl mb-0.5" style={{ color }}>{value}</div>
      <div className="text-sm font-medium" style={{ color: "#64748B" }}>{label}</div>
      {onClick && (
        <div className="flex items-center gap-1 mt-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }}>
          Ver lista filtrada
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      )}
    </button>
  );
}

export default function Dashboard({ onNavigateTickets, onNavigateImplantacoes }) {
  const [period, setPeriod] = useState("mes");
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState({
    kpis: {
      total: 0,
      abertos: 0,
      afazer: 0,
      pendentes: 0,
      vencidos: 0,
      emAndamento: 0,
      finalizadas: 0,
    },
    chartData: [],
    topClients: [],
    proximosGoLive: [],
  });

  async function carregarDashboard(periodoSelecionado) {
    try {
      setCarregando(true);
      const res = await fetch(`${BASE_URL}/dashboard/stats?periodo=${periodoSelecionado}`);
      if (res.ok) {
        const json = await res.json();
        setDados(json);
      }
    } catch (err) {
      console.error("Erro ao carregar métricas do dashboard:", err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDashboard(period);
  }, [period]);

  const maxChart = Math.max(...(dados.chartData.map((d) => d.value) || [1]), 1);

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ background: "#F4F6F9" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>Dashboard Geral</h1>
          <p className="text-sm" style={{ color: "#64748B" }}>Régis — visão consolidada do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "#E2E8F0" }}>
            {[
              { key: "hoje", label: "Hoje" },
              { key: "semana", label: "7 dias" },
              { key: "mes", label: "Mês Atual" },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className="px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                style={{
                  background: period === p.key ? "#0B2847" : "#fff",
                  color: period === p.key ? "#fff" : "#64748B",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="text-center py-20 text-slate-400 text-sm">Carregando métricas em tempo real...</div>
      ) : (
        <>
          {/* Support KPIs */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
                🎫 Módulo de Suporte
              </span>
              <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
              <KpiCard
                label="Total de Tickets"
                value={dados.kpis.total}
                color="#0B2847"
                bg="#EBF4FF"
                icon="📊"
                onClick={() => onNavigateTickets && onNavigateTickets("Todos")}
              />
              <KpiCard
                label="Tickets Abertos"
                value={dados.kpis.abertos}
                color="#0066CC"
                bg="#EBF4FF"
                icon="📂"
                onClick={() => onNavigateTickets && onNavigateTickets("Aberto")}
              />
              <KpiCard
                label="A Fazer / Triagem"
                value={dados.kpis.afazer}
                color="#F26522"
                bg="#FFF1E8"
                icon="⏳"
                onClick={() => onNavigateTickets && onNavigateTickets("A fazer")}
              />
              <KpiCard
                label="Pendentes"
                value={dados.kpis.pendentes}
                color="#64748B"
                bg="#F1F5F9"
                icon="🔄"
                onClick={() => onNavigateTickets && onNavigateTickets("Pendente")}
              />
              <KpiCard
                label="Vencidos / Fora de SLA"
                value={dados.kpis.vencidos}
                color="#E11D48"
                bg="#FFF1F2"
                icon="🚨"
                trend={dados.kpis.vencidos > 0 ? "⚠️ Atenção" : null}
                onClick={() => onNavigateTickets && onNavigateTickets("Vencido")}
              />
            </div>
          </div>

          {/* Implantação KPIs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
                🚀 Módulo de Implantação
              </span>
              <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard
                label="Implantações em Andamento"
                value={dados.kpis.emAndamento}
                color="#0066CC"
                bg="#EBF4FF"
                icon="🏗️"
                onClick={() => onNavigateImplantacoes && onNavigateImplantacoes("Em Andamento")}
              />
              <KpiCard
                label="Implantações Finalizadas"
                value={dados.kpis.finalizadas}
                color="#10B981"
                bg="#ECFDF5"
                icon="✅"
                onClick={() => onNavigateImplantacoes && onNavigateImplantacoes("Finalizada")}
              />
            </div>
          </div>

          {/* Charts & Tables row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Bar chart */}
            <div
              className="lg:col-span-2 bg-white rounded-xl p-5 border"
              style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <h3 className="font-semibold text-sm mb-4" style={{ color: "#1E293B" }}>
                Volumetria por Categoria de Chamado
              </h3>
              {dados.chartData.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">Nenhum chamado categorizado no período.</div>
              ) : (
                <div className="space-y-3">
                  {dados.chartData.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: "#64748B" }}>{item.label}</span>
                        <span className="text-xs font-semibold" style={{ color: "#1E293B" }}>{item.value}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(item.value / maxChart) * 100}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top clients */}
            <div
              className="bg-white rounded-xl p-5 border"
              style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <h3 className="font-semibold text-sm mb-4" style={{ color: "#1E293B" }}>
                Top 5 Clientes — Volume de Chamados
              </h3>
              {dados.topClients.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">Nenhum chamado vinculado a clientes.</div>
              ) : (
                <div className="space-y-3">
                  {dados.topClients.map((client, i) => (
                    <div key={client.name} className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: i === 0 ? "#F26522" : i === 1 ? "#0066CC" : "#64748B" }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm flex-1 font-medium truncate" style={{ color: "#1E293B" }}>{client.name}</span>
                      <span className="text-xs font-semibold" style={{ color: "#1E293B" }}>{client.tickets} chamados</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Go-Live table */}
          <div
            className="mt-4 bg-white rounded-xl border overflow-hidden"
            style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-semibold text-sm" style={{ color: "#1E293B" }}>
                Implantações Próximas do Go-Live
                <span
                  className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "#FFF1E8", color: "#F26522" }}
                >
                  Próximos dias
                </span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["Cliente", "Plano", "Responsável", "Go-Live", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "#64748B" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dados.proximosGoLive.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                        Nenhuma implantação com Go-Live previsto para os próximos dias.
                      </td>
                    </tr>
                  ) : (
                    dados.proximosGoLive.map((imp) => (
                      <tr key={imp.id} className="border-t hover:bg-[#F8FAFC]" style={{ borderColor: "#E2E8F0" }}>
                        <td className="px-4 py-3">
                          <div className="font-medium" style={{ color: "#1E293B" }}>{imp.client}</div>
                          <div className="text-xs" style={{ color: "#64748B" }}>{imp.id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: "#EBF4FF", color: "#0066CC" }}
                          >
                            {imp.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#64748B" }}>{imp.assignee}</td>
                        <td className="px-4 py-3 text-xs font-medium" style={{ color: "#1E293B" }}>{imp.goLiveDate}</td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={
                              imp.daysRemaining <= 2
                                ? { background: "#FFF1F2", color: "#E11D48" }
                                : { background: "#FFFBEB", color: "#F59E0B" }
                            }
                          >
                            {imp.daysRemaining <= 2 ? `⚠️ ${imp.daysRemaining}d restantes` : `⏳ ${imp.daysRemaining}d restantes`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}