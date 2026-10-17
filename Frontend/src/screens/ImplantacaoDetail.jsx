import { useState } from "react";
import { IMPLANTACOES } from "../data/mock";

const STATUS_COLORS = {
  "Coleta de Dados": { bg: "#EBF4FF", color: "#0066CC" },
  "Parametrização de Tabelas": { bg: "#FFF1E8", color: "#F26522" },
  "Em Homologação": { bg: "#FFFBEB", color: "#D97706" },
  "Go-Live Agendado": { bg: "#ECFDF5", color: "#10B981" },
  "Finalizada": { bg: "#F1F5F9", color: "#64748B" },
};

const INTEGRATION_COLORS = {
  "Protheus": { bg: "#EBF4FF", color: "#0066CC" },
  "VTEX": { bg: "#F5F3FF", color: "#7C3AED" },
  "Bling": { bg: "#ECFDF5", color: "#059669" },
  "Tiny": { bg: "#FFF7ED", color: "#EA580C" },
  "WooCommerce": { bg: "#F5F3FF", color: "#9333EA" },
  "SAP": { bg: "#FFF1F2", color: "#E11D48" },
};

const PHASE_COLORS = ["#0066CC", "#F26522", "#D97706", "#10B981", "#7C3AED", "#E11D48"];

function uid() {
  return Math.random().toString(36).slice(2);
}

// Convert old checklist format to dynamic phases
function toPhases(checklist) {
  return Object.entries(checklist).map(([name, tasks]) => ({
    id: uid(),
    name,
    tasks: tasks.map((t) => ({ id: t.id, label: t.label, done: t.done })),
  }));
}

export default function ImplantacaoDetail({ implantacaoId, onBack }) {
  const imp = IMPLANTACOES.find((i) => i.id === implantacaoId) || IMPLANTACOES[0];
  const [phases, setPhases] = useState(() =>
    Object.keys(imp.checklist).length > 0
      ? toPhases(imp.checklist)
      : []
  );
  const [expandedPhases, setExpandedPhases] = useState(
    Object.fromEntries((phases).map((p) => [p.id, true]))
  );
  const [notes, setNotes] = useState(imp.notes);
  const [status, setStatus] = useState(imp.status);

  // Adding phase
  const [addingPhase, setAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");

  // Adding task per phase
  const [addingTaskIn, setAddingTaskIn] = useState(null);
  const [newTaskLabel, setNewTaskLabel] = useState("");

  // Edit phase name
  const [editingPhaseId, setEditingPhaseId] = useState(null);
  const [editPhaseName, setEditPhaseName] = useState("");

  const statusStyle = STATUS_COLORS[status] || { bg: "#F1F5F9", color: "#64748B" };
  const totalTasks = phases.flatMap((p) => p.tasks).length;
  const totalDone = phases.flatMap((p) => p.tasks).filter((t) => t.done).length;
  const realProgress = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  // ── Phase mutations ──────────────────────────────────────────────────────

  function addPhase() {
    const name = newPhaseName.trim();
    if (!name) return;
    const newPhase = { id: uid(), name, tasks: [] };
    setPhases((prev) => [...prev, newPhase]);
    setExpandedPhases((prev) => ({ ...prev, [newPhase.id]: true }));
    setNewPhaseName("");
    setAddingPhase(false);
  }

  function removePhase(phaseId) {
    setPhases((prev) => prev.filter((p) => p.id !== phaseId));
  }

  function startEditPhase(phase) {
    setEditingPhaseId(phase.id);
    setEditPhaseName(phase.name);
  }

  function confirmEditPhase(phaseId) {
    const name = editPhaseName.trim();
    if (name) setPhases((prev) => prev.map((p) => p.id === phaseId ? { ...p, name } : p));
    setEditingPhaseId(null);
  }

  function togglePhaseExpand(phaseId) {
    setExpandedPhases((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }));
  }

  // ── Task mutations ───────────────────────────────────────────────────────

  function addTask(phaseId) {
    const label = newTaskLabel.trim();
    if (!label) return;
    const newTask = { id: uid(), label, done: false };
    setPhases((prev) => prev.map((p) => p.id === phaseId ? { ...p, tasks: [...p.tasks, newTask] } : p));
    setNewTaskLabel("");
    setAddingTaskIn(null);
  }

  function toggleTask(phaseId, taskId) {
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, done: !t.done } : t) }
          : p
      )
    );
  }

  function removeTask(phaseId, taskId) {
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
      )
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#F4F6F9" }}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "#64748B" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#0066CC"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            Implantações
          </button>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          <span className="text-sm font-medium" style={{ color: "#1E293B" }}>{imp.client} — {imp.id}</span>
        </div>
        <div className="flex items-start justify-between mt-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>{imp.client}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-sm font-medium px-2.5 py-0.5 rounded-full" style={statusStyle}>{status}</span>
              <span className="text-sm" style={{ color: "#64748B" }}>🌐 {imp.domain}</span>
              <span className="text-sm font-medium" style={{ color: imp.overdue ? "#E11D48" : imp.daysRemaining <= 5 ? "#D97706" : "#10B981" }}>
                {imp.overdue ? `⚠️ Atrasado há ${Math.abs(imp.daysRemaining)} dias` : `⏳ ${imp.daysRemaining} dias para Go-Live (${imp.goLiveDate})`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0066CC" }}>RR</div>
            <div className="text-sm" style={{ color: "#64748B" }}>{imp.assignee}</div>
            <select
              className="text-xs border rounded-lg px-2 py-1 ml-2 outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ borderColor: "#E2E8F0", color: "#64748B" }}
            >
              {Object.keys(STATUS_COLORS).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Block 1: Technical params */}
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: "#1E293B" }}>📋 Parâmetros Técnicos & Contratuais</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Param label="Plano" value={imp.plan} highlight />
            <Param label="Tabelas de Frete" value={`${imp.tablesCount} tabelas`} />
            <Param label="Data de Assinatura" value={imp.signatureDate} />
            <Param label="Início da Implantação" value={imp.startDate} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>Integrações Sistêmicas</div>
            <div className="flex flex-wrap gap-2">
              {imp.integrations.map((int) => {
                const ic = INTEGRATION_COLORS[int] || { bg: "#F1F5F9", color: "#64748B" };
                return (
                  <span key={int} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border" style={{ borderColor: ic.color + "40", ...ic }}>
                    🔗 {int}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Block 2: Dynamic Checklist */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#1E293B" }}>✅ Checklist Operacional</h2>
              <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
                {phases.length} fase{phases.length !== 1 ? "s" : ""} · {totalDone} de {totalTasks} tarefas concluídas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${realProgress}%`, background: realProgress === 100 ? "#10B981" : "#0066CC" }}
                />
              </div>
              <span className="text-sm font-bold" style={{ color: realProgress === 100 ? "#10B981" : "#0066CC" }}>{realProgress}%</span>
            </div>
          </div>

          <div>
            {phases.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center" style={{ color: "#94A3B8" }}>
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">Nenhuma fase cadastrada ainda.</p>
                <p className="text-xs mt-1">Clique em "Adicionar Fase" para começar.</p>
              </div>
            )}

            {phases.map((phase, phaseIdx) => {
              const phaseDone = phase.tasks.filter((t) => t.done).length;
              const isExpanded = expandedPhases[phase.id] !== false;
              const phaseColor = PHASE_COLORS[phaseIdx % PHASE_COLORS.length];

              return (
                <div key={phase.id} className="border-b last:border-b-0" style={{ borderColor: "#E2E8F0" }}>
                  {/* Phase header */}
                  <div className="flex items-center gap-2 px-6 py-3 hover:bg-[#F8FAFC] transition-colors">
                    <button onClick={() => togglePhaseExpand(phase.id)} className="flex items-center gap-3 flex-1 text-left">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ background: phaseColor }}>
                        {phaseIdx + 1}
                      </div>

                      {editingPhaseId === phase.id ? (
                        <input
                          className="flex-1 text-sm font-medium outline-none border-b"
                          value={editPhaseName}
                          onChange={(e) => setEditPhaseName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") confirmEditPhase(phase.id); if (e.key === "Escape") setEditingPhaseId(null); }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          style={{ color: "#1E293B", borderColor: phaseColor }}
                        />
                      ) : (
                        <span className="font-medium text-sm flex-1" style={{ color: "#1E293B" }}>{phase.name}</span>
                      )}

                      <span className="text-xs font-medium" style={{ color: phaseDone === phase.tasks.length && phase.tasks.length > 0 ? "#10B981" : "#64748B" }}>
                        {phaseDone}/{phase.tasks.length}
                      </span>
                      {phaseDone === phase.tasks.length && phase.tasks.length > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#10B981" }}>✓ Concluída</span>
                      )}
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"
                        className="transition-transform flex-shrink-0"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>

                    {/* Phase actions */}
                    <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                      {editingPhaseId === phase.id ? (
                        <button
                          onClick={() => confirmEditPhase(phase.id)}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded"
                          style={{ background: "#ECFDF5", color: "#10B981" }}
                        >
                          ✓ OK
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditPhase(phase); }}
                          className="p-1 rounded hover:bg-[#F1F5F9] transition-colors"
                          title="Renomear fase"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); if (window.confirm(`Remover a fase "${phase.name}"?`)) removePhase(phase.id); }}
                        className="p-1 rounded hover:bg-[#FFF1F2] transition-colors"
                        title="Remover fase"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Tasks */}
                  {isExpanded && (
                    <div className="pb-2" style={{ background: "#F8FAFC" }}>
                      {phase.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 py-2 px-6 hover:bg-white transition-colors group/task"
                        >
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => toggleTask(phase.id, task.id)}
                            className="rounded w-4 h-4 flex-shrink-0"
                            style={{ accentColor: phaseColor }}
                          />
                          <span
                            className="text-sm flex-1"
                            style={{
                              color: task.done ? "#94A3B8" : "#1E293B",
                              textDecoration: task.done ? "line-through" : "none",
                            }}
                          >
                            {task.label}
                          </span>
                          {task.done && <span className="text-xs" style={{ color: "#10B981" }}>✓</span>}
                          <button
                            onClick={() => removeTask(phase.id, task.id)}
                            className="opacity-0 group-hover/task:opacity-100 transition-opacity p-0.5 rounded hover:bg-[#FFF1F2]"
                            title="Remover tarefa"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* Add task */}
                      {addingTaskIn === phase.id ? (
                        <div className="flex items-center gap-2 px-6 py-2">
                          <div className="w-4 h-4 flex-shrink-0" />
                          <input
                            type="text"
                            value={newTaskLabel}
                            onChange={(e) => setNewTaskLabel(e.target.value)}
                            placeholder="Descrição da tarefa..."
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addTask(phase.id);
                              if (e.key === "Escape") { setAddingTaskIn(null); setNewTaskLabel(""); }
                            }}
                            className="flex-1 text-sm border-b outline-none bg-transparent"
                            style={{ borderColor: phaseColor, color: "#1E293B" }}
                          />
                          <button
                            onClick={() => addTask(phase.id)}
                            className="text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ background: phaseColor + "20", color: phaseColor }}
                          >
                            Adicionar
                          </button>
                          <button
                            onClick={() => { setAddingTaskIn(null); setNewTaskLabel(""); }}
                            className="text-xs"
                            style={{ color: "#94A3B8" }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingTaskIn(phase.id); setNewTaskLabel(""); }}
                          className="flex items-center gap-2 text-xs font-medium px-6 py-2 w-full text-left hover:bg-white transition-colors"
                          style={{ color: "#64748B" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Adicionar tarefa
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add phase */}
            <div className="px-6 py-3 border-t" style={{ borderColor: "#E2E8F0" }}>
              {addingPhase ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                    style={{ background: PHASE_COLORS[phases.length % PHASE_COLORS.length] }}
                  >
                    {phases.length + 1}
                  </div>
                  <input
                    type="text"
                    value={newPhaseName}
                    onChange={(e) => setNewPhaseName(e.target.value)}
                    placeholder="Nome da nova fase..."
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") addPhase(); if (e.key === "Escape") { setAddingPhase(false); setNewPhaseName(""); } }}
                    className="flex-1 text-sm border-b outline-none bg-transparent"
                    style={{ borderColor: "#0066CC", color: "#1E293B" }}
                  />
                  <button
                    onClick={addPhase}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: "#0066CC" }}
                  >
                    Criar Fase
                  </button>
                  <button
                    onClick={() => { setAddingPhase(false); setNewPhaseName(""); }}
                    className="text-xs"
                    style={{ color: "#94A3B8" }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingPhase(true)}
                  className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: "#0066CC" }}
                >
                  <div className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: "#0066CC" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  Adicionar nova fase
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Block 3: Documents */}
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: "#1E293B" }}>📎 Documentação e Anexos</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {imp.attachments.map((att) => (
              <div key={att} className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer hover:bg-[#F8FAFC] transition-colors" style={{ borderColor: "#E2E8F0" }}>
                <span className="text-lg">{att.endsWith(".pdf") ? "📄" : "📊"}</span>
                <div>
                  <div className="text-xs font-medium" style={{ color: "#1E293B" }}>{att}</div>
                  <div className="text-[10px]" style={{ color: "#64748B" }}>{att.endsWith(".pdf") ? "PDF" : "Planilha"}</div>
                </div>
              </div>
            ))}
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed text-xs font-medium transition-colors hover:bg-[#F8FAFC]"
              style={{ borderColor: "#CBD5E1", color: "#64748B" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Upload (JPG, JPEG, PDF)
            </button>
          </div>
        </div>

        {/* Block 4: Notes */}
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 className="text-base font-semibold mb-3" style={{ color: "#1E293B" }}>📝 Observações Gerais da Equipe</h2>
          <textarea
            rows={5} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Registre observações da equipe de implantação..."
            className="w-full text-sm resize-none outline-none rounded-lg p-4 transition-all"
            style={{ border: "1.5px solid #E2E8F0", color: "#1E293B", background: "#F8FAFC" }}
            onFocus={(e) => { e.target.style.borderColor = "#0066CC"; e.target.style.background = "#fff"; }}
            onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.background = "#F8FAFC"; }}
          />
          <div className="flex justify-end mt-2">
            <button
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: "#0066CC" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#0054a8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#0066CC"; }}
            >
              Salvar Observações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Param({ label, value, highlight }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: "#F8FAFC" }}>
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#64748B" }}>{label}</div>
      <div className="text-sm font-semibold" style={{ color: highlight ? "#0066CC" : "#1E293B" }}>{value}</div>
    </div>
  );
}
