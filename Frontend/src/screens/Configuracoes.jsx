import { useState } from "react";

// Shared state exported via a simple module-level store (lifted to avoid prop drilling)
// In a real app this would be context/zustand; here we use exported mutable arrays
export const configStore = {
  statusOptions: ["Aberto", "A fazer", "Pendente", "Resolvido", "Vencido"],
  priorityOptions: ["Alta", "Média", "Baixa"],
  categoryOptions: ["Tabela de Frete", "Integração API", "Dúvidas de Cotação", "Erro Operacional", "Configuração de Sistema"],
  channelOptions: ["E-mail", "WhatsApp", "Telefone", "Chat"],
  planOptions: ["Starter", "Profissional", "Enterprise"],
};

function CrudList({ title, items, onAdd, onRemove, onEdit, locked = [] }) {
  const [newValue, setNewValue] = useState("");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState("");

  function handleAdd() {
    const v = newValue.trim();
    if (!v || items.includes(v)) return;
    onAdd(v);
    setNewValue("");
  }

  function startEdit(idx) {
    setEditingIdx(idx);
    setEditValue(items[idx]);
  }

  function confirmEdit(idx) {
    const v = editValue.trim();
    if (v && v !== items[idx] && !items.includes(v)) {
      onEdit(items[idx], v);
    }
    setEditingIdx(null);
  }

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider mb-3 pb-2 border-b" style={{ color: "#64748B", borderColor: "#E2E8F0" }}>
        {title}
      </div>
      <div className="space-y-1.5 mb-3">
        {items.map((item, idx) => (
          <div
            key={item}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white"
            style={{ borderColor: "#E2E8F0" }}
          >
            {editingIdx === idx ? (
              <input
                className="flex-1 text-sm outline-none bg-transparent"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(idx); if (e.key === "Escape") setEditingIdx(null); }}
                autoFocus
                style={{ color: "#1E293B" }}
              />
            ) : (
              <span className="flex-1 text-sm font-medium" style={{ color: "#1E293B" }}>{item}</span>
            )}

            {editingIdx === idx ? (
              <button
                onClick={() => confirmEdit(idx)}
                className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ background: "#ECFDF5", color: "#10B981" }}
              >
                ✓ Salvar
              </button>
            ) : (
              <button
                onClick={() => startEdit(idx)}
                className="text-xs font-medium"
                style={{ color: "#0066CC" }}
              >
                Editar
              </button>
            )}

            {!locked.includes(item) && editingIdx !== idx && (
              <button
                onClick={() => onRemove(item)}
                className="text-xs font-medium"
                style={{ color: "#E11D48" }}
              >
                Remover
              </button>
            )}
            {locked.includes(item) && (
              <span className="text-[10px]" style={{ color: "#94A3B8" }}>🔒</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={`Nova opção de ${title.toLowerCase()}...`}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          className="flex-1 text-sm border rounded-xl px-3 py-2 outline-none"
          style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#0066CC" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#0054a8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#0066CC"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar
        </button>
      </div>
    </div>
  );
}

export default function Configuracoes() {
  const [emailSync, setEmailSync] = useState(true);
  const [emailAddress, setEmailAddress] = useState("suporte@fretegestao.com.br");
  const [slaAlta, setSlaAlta] = useState({ resposta: "2", resolucao: "24" });
  const [slaMedia, setSlaMedia] = useState({ resposta: "8", resolucao: "72" });
  const [slaBaixa, setSlaBaixa] = useState({ resposta: "24", resolucao: "168" });

  // Ticket field options (editable)
  const [statusOptions, setStatusOptions] = useState([...configStore.statusOptions]);
  const [priorityOptions, setPriorityOptions] = useState([...configStore.priorityOptions]);
  const [categoryOptions, setCategoryOptions] = useState([...configStore.categoryOptions]);
  const [channelOptions, setChannelOptions] = useState([...configStore.channelOptions]);
  const [planOptions, setPlanOptions] = useState([...configStore.planOptions]);

  function makeCrud(list, setList, storeKey) {
    return {
      onAdd: (item) => {
        const next = [...list, item];
        setList(next);
        configStore[storeKey].length = 0;
        configStore[storeKey].push(...next);
      },
      onRemove: (item) => {
        const next = list.filter((x) => x !== item);
        setList(next);
        configStore[storeKey].length = 0;
        configStore[storeKey].push(...next);
      },
      onEdit: (oldItem, newItem) => {
        const next = list.map((x) => (x === oldItem ? newItem : x));
        setList(next);
        configStore[storeKey].length = 0;
        configStore[storeKey].push(...next);
      },
    };
  }

  const statusCrud = makeCrud(statusOptions, setStatusOptions, "statusOptions");
  const priorityCrud = makeCrud(priorityOptions, setPriorityOptions, "priorityOptions");
  const categoryCrud = makeCrud(categoryOptions, setCategoryOptions, "categoryOptions");
  const channelCrud = makeCrud(channelOptions, setChannelOptions, "channelOptions");
  const planCrud = makeCrud(planOptions, setPlanOptions, "planOptions");

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#F4F6F9" }}>
      <div className="px-6 py-4 border-b bg-white" style={{ borderColor: "#E2E8F0" }}>
        <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>⚙️ Configurações do Sistema</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Integrações, SLAs, opções de campos e parâmetros globais da plataforma</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Email integration */}
        <Section title="📧 Ingestão Automática de E-mails Corporativos">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}>
              <div>
                <div className="font-medium text-sm" style={{ color: "#1E293B" }}>Sincronização Automática de E-mails</div>
                <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                  E-mails recebidos são convertidos automaticamente em tickets de suporte
                </div>
              </div>
              <button
                onClick={() => setEmailSync(!emailSync)}
                className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
                style={{ background: emailSync ? "#10B981" : "#CBD5E1" }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                  style={{ left: emailSync ? "22px" : "2px" }}
                />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>Conta de E-mail Monitorada</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none"
                style={{ borderColor: "#E2E8F0", color: "#1E293B", background: "#fff" }}
              />
            </div>
            <div className="rounded-xl p-4 border" style={{ background: "#ECFDF5", borderColor: "#A7F3D0" }}>
              <div className="flex items-start gap-3">
                <span className="text-lg">🔄</span>
                <div>
                  <div className="font-semibold text-sm mb-1" style={{ color: "#065F46" }}>Regras de Conversão Automática</div>
                  <ul className="space-y-1">
                    {["Assunto do e-mail → Título do Ticket", "Corpo da mensagem → Descrição inicial do Ticket", "Remetente → Identificação do solicitante (validado na base)", "Respostas no mesmo thread → Adicionadas ao ticket original"].map((r) => (
                      <li key={r} className="text-xs flex items-center gap-2" style={{ color: "#047857" }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#10B981" }} />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* SLA */}
        <Section title="⏱️ Gestão de SLAs e Prazos">
          <p className="text-xs mb-3" style={{ color: "#64748B" }}>
            Configure os prazos máximos (em horas) para primeira resposta e resolução por prioridade.
          </p>
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "#E2E8F0" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["Prioridade", "Primeira Resposta (horas)", "Resolução (horas)"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <SlaRow priority="Alta" color="#F26522" bg="#FFF1E8" sla={slaAlta} onChange={setSlaAlta} />
                <SlaRow priority="Média" color="#F59E0B" bg="#FFFBEB" sla={slaMedia} onChange={setSlaMedia} />
                <SlaRow priority="Baixa" color="#10B981" bg="#ECFDF5" sla={slaBaixa} onChange={setSlaBaixa} />
              </tbody>
            </table>
          </div>
        </Section>

        {/* Ticket field options */}
        <Section title="🏷️ Opções de Campos dos Tickets">
          <p className="text-xs mb-4" style={{ color: "#64748B" }}>
            Gerencie as opções disponíveis nos campos de Status, Prioridade, Categoria e Canal dos tickets. Estas opções aparecem como seleção na tela de atendimento.
          </p>
          <div className="grid grid-cols-1 gap-6">
            <CrudList title="Status" items={statusOptions} {...statusCrud} locked={["Aberto", "Resolvido"]} />
            <CrudList title="Prioridade" items={priorityOptions} {...priorityCrud} locked={["Alta", "Média", "Baixa"]} />
            <CrudList title="Categoria / Tipo de Ticket" items={categoryOptions} {...categoryCrud} />
            <CrudList title="Canal de Atendimento" items={channelOptions} {...channelCrud} locked={["E-mail", "WhatsApp"]} />
          </div>
        </Section>

        {/* Plan options */}
        <Section title="📦 Planos de Clientes">
          <p className="text-xs mb-4" style={{ color: "#64748B" }}>
            Gerencie os planos disponíveis para cadastro de clientes. Estas opções aparecem no campo Plano da tela de Clientes.
          </p>
          <CrudList title="Planos Disponíveis" items={planOptions} {...planCrud} locked={["Starter", "Profissional", "Enterprise"]} />
        </Section>

        <div className="flex justify-end">
          <button
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#0066CC" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#0054a8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0066CC"; }}
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}

function SlaRow({ priority, color, bg, sla, onChange }) {
  return (
    <tr className="border-t" style={{ borderColor: "#E2E8F0" }}>
      <td className="px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-medium" style={{ color }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />{priority}
        </span>
      </td>
      <td className="px-4 py-3">
        <input type="number" value={sla.resposta} onChange={(e) => onChange({ ...sla, resposta: e.target.value })}
          className="w-24 text-sm border rounded-lg px-3 py-1.5 outline-none font-medium"
          style={{ borderColor: color + "50", background: bg, color }} />
      </td>
      <td className="px-4 py-3">
        <input type="number" value={sla.resolucao} onChange={(e) => onChange({ ...sla, resolucao: e.target.value })}
          className="w-24 text-sm border rounded-lg px-3 py-1.5 outline-none font-medium"
          style={{ borderColor: color + "50", background: bg, color }} />
      </td>
    </tr>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <h2 className="text-base font-semibold mb-4" style={{ color: "#1E293B" }}>{title}</h2>
      {children}
    </div>
  );
}
