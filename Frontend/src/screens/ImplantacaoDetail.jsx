import { useState, useEffect } from "react";

const BASE_URL = "http://localhost:8000/api";

const STATUS_COLORS = {
  "Coleta de Dados": { bg: "#EBF4FF", color: "#0066CC" },
  "Parametrização de Tabelas": { bg: "#FFF1E8", color: "#F26522" },
  "Em Homologação": { bg: "#FFFBEB", color: "#D97706" },
  "Go-Live Agendado": { bg: "#ECFDF5", color: "#10B981" },
  "Finalizada": { bg: "#F1F5F9", color: "#64748B" },
};

const PHASE_COLORS = ["#0066CC", "#F26522", "#D97706", "#10B981", "#7C3AED", "#E11D48"];

// Converte AAAA-MM-DD para DD/MM/AAAA
function isoParaBr(isoStr) {
  if (!isoStr) return "";
  const limpo = isoStr.split("T")[0];
  const partes = limpo.split("-");
  if (partes.length !== 3) return isoStr;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Converte DD/MM/AAAA para AAAA-MM-DD
function brParaIso(brStr) {
  if (!brStr) return "";
  const partes = brStr.split("/");
  if (partes.length !== 3) return "";
  return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

// Aplica máscara automática DD/MM/AAAA durante a digitação
function aplicarMascaraData(valor) {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

function extrairMetadado(observacao, chave, padrao = "") {
  if (!observacao) return padrao;
  const match = observacao.match(new RegExp(`${chave}:\\s*([^|\\n]+)`));
  return match ? match[1].trim() : padrao;
}

export default function ImplantacaoDetail({ implantacaoId, onBack }) {
  const [impData, setImpData] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estados editáveis
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Coleta de Dados");
  const [dataAssinatura, setDataAssinatura] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataGoLive, setDataGoLive] = useState("");

  // Checklists Dinâmicos
  const [phases, setPhases] = useState([]);
  const [expandedPhases, setExpandedPhases] = useState({});
  const [addingPhase, setAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newTaskInput, setNewTaskInput] = useState({});

  async function carregarDetalhes() {
    try {
      setCarregando(true);
      const res = await fetch(`${BASE_URL}/novas-implantacoes/${implantacaoId}`);
      if (!res.ok) throw new Error("Erro ao carregar detalhes da implantação");
      const dados = await res.json();
      setImpData(dados);
      setNotes(dados.observacao || "");

      const cliente = dados.cliente || {};
      setDataAssinatura(isoParaBr(cliente.dataAssContrato || ""));
      setDataInicio(isoParaBr(cliente.dataIniImpl || ""));
      setDataGoLive(isoParaBr(cliente.dataFinImpl || extrairMetadado(dados.observacao, "Go-Live", "")));

      const faseAtual = extrairMetadado(dados.observacao, "Fase", dados.status === "F" ? "Finalizada" : "Coleta de Dados");
      setStatus(faseAtual);

      if (Array.isArray(dados.checklists)) {
        const fasesFormatadas = dados.checklists.map((chk) => ({
          id: chk.id,
          name: chk.nome,
          tasks: (chk.itens || []).map((item) => ({
            id: item.id,
            label: item.descricao,
            done: Boolean(item.concluido),
          })),
        }));
        setPhases(fasesFormatadas);
        setExpandedPhases(Object.fromEntries(fasesFormatadas.map((p) => [p.id, true])));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (implantacaoId) carregarDetalhes();
  }, [implantacaoId]);

  // Manipulação de tarefas
  function toggleTask(phaseId, taskId) {
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
          : p
      )
    );
  }

  function handleAddTask(phaseId) {
    const label = (newTaskInput[phaseId] || "").trim();
    if (!label) return;

    const newTask = {
      id: `temp_${Date.now()}`,
      label,
      done: false,
    };

    setPhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, tasks: [...p.tasks, newTask] } : p))
    );

    setNewTaskInput((prev) => ({ ...prev, [phaseId]: "" }));
  }

  function handleRemoveTask(phaseId, taskId) {
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
      )
    );
  }

  function handleAddPhase() {
    const name = newPhaseName.trim();
    if (!name) return;

    const newPhase = {
      id: `phase_${Date.now()}`,
      name,
      tasks: [],
    };

    setPhases((prev) => [...prev, newPhase]);
    setExpandedPhases((prev) => ({ ...prev, [newPhase.id]: true }));
    setNewPhaseName("");
    setAddingPhase(false);
  }

  function handleRemovePhase(phaseId) {
    if (!window.confirm("Pretende remover esta fase e todos os seus itens?")) return;
    setPhases((prev) => prev.filter((p) => p.id !== phaseId));
  }

  async function salvarTodasAlteracoes() {
    try {
      setSalvando(true);
      const res = await fetch(`${BASE_URL}/novas-implantacoes/${implantacaoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          observacao: notes,
          dataAssContrato: brParaIso(dataAssinatura) || null,
          dataIniImpl: brParaIso(dataInicio) || null,
          dataFinImpl: brParaIso(dataGoLive) || null,
          phases: phases,
        }),
      });

      if (!res.ok) throw new Error("Erro ao guardar alterações");
      alert("Implantação, datas e checklists atualizados com sucesso!");
      await carregarDetalhes();
    } catch (err) {
      alert("Erro ao guardar alterações.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-sm text-[#64748B]">
        A carregar detalhes da implantação...
      </div>
    );
  }

  if (!impData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-sm text-[#64748B]">
        Implantação não encontrada.
        <button onClick={onBack} className="mt-4 text-[#0066CC] font-semibold hover:underline">
          Voltar para a listagem
        </button>
      </div>
    );
  }

  const cliente = impData.cliente || {};
  const nomeCliente = cliente.nomeFantasia || `Cliente #${impData.cliente_id}`;
  const totalTasks = phases.flatMap((p) => p.tasks).length;
  const totalDone = phases.flatMap((p) => p.tasks).filter((t) => t.done).length;
  const realProgress = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  const statusStyle = STATUS_COLORS[status] || { bg: "#F1F5F9", color: "#64748B" };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#F4F6F9" }}>
      {/* Topo com Ações */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-10" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-[#0066CC] cursor-pointer"
          >
            ← Voltar para Implantações
          </button>

          <button
            onClick={salvarTodasAlteracoes}
            disabled={salvando}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer disabled:opacity-50"
            style={{ background: "#0066CC" }}
          >
            {salvando ? "A guardar..." : "Salvar Alterações"}
          </button>
        </div>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1E293B]">{nomeCliente}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="font-semibold px-2.5 py-0.5 rounded-full" style={statusStyle}>
                {status}
              </span>
              <span className="text-[#64748B]">🌐 {cliente.dominio || "Sem domínio"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Responsável Principal:</span>
            <span className="text-xs font-bold text-slate-800">
              {impData.usuario_responsavel?.nome || impData.usuarioResponsavel?.nome || "Não atribuído"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Parâmetros e Datas no Formato Brasileiro DD/MM/AAAA */}
        <div className="bg-white rounded-xl border p-6 shadow-2xs" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-sm font-bold text-[#1E293B] mb-4">📋 Datas e Cronograma Editáveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium block mb-1 text-slate-600">Assinatura do Contrato</label>
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                maxLength={10}
                value={dataAssinatura}
                onChange={(e) => setDataAssinatura(aplicarMascaraData(e.target.value))}
                className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-500 font-mono"
                style={{ borderColor: "#E2E8F0" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1 text-slate-600">Início da Implantação</label>
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                maxLength={10}
                value={dataInicio}
                onChange={(e) => setDataInicio(aplicarMascaraData(e.target.value))}
                className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-500 font-mono"
                style={{ borderColor: "#E2E8F0" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1 text-slate-600">Previsão de Go-Live</label>
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                maxLength={10}
                value={dataGoLive}
                onChange={(e) => setDataGoLive(aplicarMascaraData(e.target.value))}
                className="w-full text-xs border rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-500 font-semibold font-mono"
                style={{ borderColor: "#E2E8F0" }}
              />
            </div>
          </div>
        </div>

        {/* Checklist Operacional Editável */}
        <div className="bg-white rounded-xl border overflow-hidden shadow-2xs" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">✅ Checklist Operacional</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                {phases.length} fase{phases.length !== 1 ? "s" : ""} · {totalDone} de {totalTasks} tarefas concluídas
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-2 rounded-full overflow-hidden bg-slate-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${realProgress}%`,
                    background: realProgress === 100 ? "#10B981" : "#0066CC",
                  }}
                />
              </div>
              <span className="text-xs font-bold text-[#1E293B]">{realProgress}%</span>
              <button
                type="button"
                onClick={() => setAddingPhase(true)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-blue-300 text-[#0066CC] hover:bg-blue-50 cursor-pointer"
              >
                + Nova Fase
              </button>
            </div>
          </div>

          {/* Bloco de Adicionar Nova Fase */}
          {addingPhase && (
            <div className="p-4 border-b bg-slate-50 flex items-center gap-2" style={{ borderColor: "#E2E8F0" }}>
              <input
                type="text"
                placeholder="Nome da nova fase..."
                value={newPhaseName}
                onChange={(e) => setNewPhaseName(e.target.value)}
                className="flex-1 text-xs border rounded-lg px-3 py-1.5 outline-none bg-white"
                style={{ borderColor: "#CBD5E1" }}
              />
              <button
                type="button"
                onClick={handleAddPhase}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
                style={{ background: "#0066CC" }}
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => { setAddingPhase(false); setNewPhaseName(""); }}
                className="text-xs text-slate-500 hover:underline cursor-pointer px-2"
              >
                Cancelar
              </button>
            </div>
          )}

          <div>
            {phases.map((phase, phaseIdx) => {
              const phaseDone = phase.tasks.filter((t) => t.done).length;
              const isExpanded = expandedPhases[phase.id] !== false;
              const phaseColor = PHASE_COLORS[phaseIdx % PHASE_COLORS.length];

              return (
                <div key={phase.id} className="border-b last:border-b-0" style={{ borderColor: "#E2E8F0" }}>
                  <div className="flex items-center justify-between px-6 py-3 hover:bg-[#F8FAFC] transition-colors">
                    <div
                      onClick={() =>
                        setExpandedPhases((prev) => ({ ...prev, [phase.id]: !prev[phase.id] }))
                      }
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                        style={{ background: phaseColor }}
                      >
                        {phaseIdx + 1}
                      </div>
                      <span className="font-semibold text-sm text-[#1E293B]">{phase.name}</span>
                      <span className="text-xs text-[#64748B]">
                        ({phaseDone}/{phase.tasks.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleRemovePhase(phase.id)}
                        className="text-xs text-red-500 hover:underline cursor-pointer"
                      >
                        Excluir Fase
                      </button>
                      <span className="text-xs text-slate-400">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-[#F8FAFC] px-6 py-3 space-y-2">
                      {phase.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-white">
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => toggleTask(phase.id, task.id)}
                              className="rounded w-4 h-4 accent-[#0066CC]"
                            />
                            <span
                              className={`text-xs ${
                                task.done ? "line-through text-slate-400" : "text-slate-700"
                              }`}
                            >
                              {task.label}
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveTask(phase.id, task.id)}
                            className="text-xs text-red-500 hover:underline cursor-pointer px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {/* Inserção de tarefa na fase */}
                      <div className="flex gap-2 pt-2 border-t mt-2" style={{ borderColor: "#E2E8F0" }}>
                        <input
                          type="text"
                          placeholder="Adicionar nova tarefa nesta fase..."
                          value={newTaskInput[phase.id] || ""}
                          onChange={(e) =>
                            setNewTaskInput((prev) => ({ ...prev, [phase.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTask(phase.id);
                            }
                          }}
                          className="flex-1 text-xs border rounded-lg px-3 py-1.5 outline-none bg-white"
                          style={{ borderColor: "#CBD5E1" }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTask(phase.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
                          style={{ background: "#0066CC" }}
                        >
                          + Item
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-xl border p-6 shadow-2xs" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-sm font-bold text-[#1E293B] mb-3">📝 Observações Gerais da Equipe</h2>
          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Registe notas e acordos operacionais..."
            className="w-full text-xs border rounded-lg p-3 outline-none transition-all leading-relaxed bg-[#F8FAFC]"
            style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
          />
        </div>
      </div>
    </div>
  );
}