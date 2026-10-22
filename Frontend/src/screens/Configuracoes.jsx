import { useState, useEffect } from "react";

// Export mantido para compatibilidade com Tickets.jsx e outras telas
export const configStore = {
  statusOptions: ["Aberto", "A fazer", "Pendente", "Resolvido", "Vencido"],
  priorityOptions: ["Alta", "Média", "Baixa"],
  categoryOptions: ["Tabela de Frete", "Integração API", "Dúvidas de Cotação", "Erro Operacional", "Configuração de Sistema"],
  channelOptions: ["E-mail", "WhatsApp", "Telefone", "Chat"],
  planOptions: ["Starter", "Profissional", "Enterprise"],
};

const BASE_URL = "http://localhost:8000/api";

// Componente CRUD Genérico para Status, Canal e Categoria
function CrudListApi({ title, endpoint, lockedNames = [] }) {
  const [items, setItems] = useState([]);
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}${endpoint}`);
      if (!res.ok) throw new Error("Erro ao carregar dados");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(`Erro ao carregar ${title}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [endpoint]);

  async function handleAdd() {
    const v = newValue.trim();
    if (!v || items.some((i) => i.nome.toLowerCase() === v.toLowerCase())) return;

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ nome: v }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || `Erro ao adicionar em ${title}`);
        return;
      }

      setNewValue("");
      fetchItems();
    } catch (err) {
      console.error(err);
      alert(`Erro de conexão ao adicionar em ${title}`);
    }
  }

  function startEdit(item) {
    if (lockedNames.includes(item.nome)) return;
    setEditingId(item.id);
    setEditValue(item.nome);
  }

  async function confirmEdit(id) {
    const v = editValue.trim();
    if (v) {
      try {
        const res = await fetch(`${BASE_URL}${endpoint}/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ nome: v }),
        });

        if (!res.ok) throw new Error("Erro ao editar");
        fetchItems();
      } catch (err) {
        console.error(err);
        alert(`Erro ao atualizar item em ${title}`);
      }
    }
    setEditingId(null);
  }

  async function handleRemove(id, nome) {
    if (lockedNames.includes(nome)) return;
    if (!window.confirm("Pretende realmente remover este registo?")) return;
    try {
      const res = await fetch(`${BASE_URL}${endpoint}/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Erro ao eliminar");
      fetchItems();
    } catch (err) {
      console.error(err);
      alert("Erro ao remover registo. Verifique se não está vinculado a tickets.");
    }
  }

  return (
    <div>
      <div
        className="text-xs font-semibold uppercase tracking-wider mb-3 pb-2 border-b"
        style={{ color: "#64748B", borderColor: "#E2E8F0" }}
      >
        {title}
      </div>

      {loading && items.length === 0 ? (
        <div className="text-xs py-2 text-slate-400">A carregar dados...</div>
      ) : (
        <div className="space-y-1.5 mb-3">
          {items.map((item) => {
            const isLocked = lockedNames.includes(item.nome);

            return (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white"
                style={{ borderColor: "#E2E8F0" }}
              >
                {editingId === item.id ? (
                  <input
                    className="flex-1 text-sm outline-none bg-transparent"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmEdit(item.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    style={{ color: "#1E293B" }}
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium" style={{ color: "#1E293B" }}>
                    {item.nome}
                  </span>
                )}

                {editingId === item.id ? (
                  <button
                    onClick={() => confirmEdit(item.id)}
                    className="text-xs font-semibold px-2 py-0.5 rounded cursor-pointer"
                    style={{ background: "#ECFDF5", color: "#10B981" }}
                  >
                    ✓ Guardar
                  </button>
                ) : (
                  !isLocked && (
                    <button
                      onClick={() => startEdit(item)}
                      className="text-xs font-medium cursor-pointer"
                      style={{ color: "#0066CC" }}
                    >
                      Editar
                    </button>
                  )
                )}

                {!isLocked && editingId !== item.id && (
                  <button
                    onClick={() => handleRemove(item.id, item.nome)}
                    className="text-xs font-medium cursor-pointer"
                    style={{ color: "#E11D48" }}
                  >
                    Remover
                  </button>
                )}

                {isLocked && (
                  <span
                    className="text-[10px]"
                    style={{ color: "#94A3B8" }}
                    title="Opção padrão do sistema (bloqueada para edição e remoção)"
                  >
                    🔒
                  </span>
                )}
              </div>
            );
          })}
          {!loading && items.length === 0 && (
            <div className="text-xs py-2 text-slate-400">Nenhum registo cadastrado.</div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder={`Nova opção de ${title.toLowerCase()}...`}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          className="flex-1 text-sm border rounded-xl px-3 py-2 outline-none"
          style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
          style={{ background: "#0066CC" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#0054a8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#0066CC"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar
        </button>
      </div>
    </div>
  );
}

// Componente CRUD específico para Prioridades (com Nome + Prazo)
function CrudPrioridadeApi({ prioridades, onReload, lockedNames = ["Alta", "Média", "Baixa"] }) {
  const [novoNome, setNovoNome] = useState("");
  const [novoPrazo, setNovoPrazo] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editPrazo, setEditPrazo] = useState("");

  async function handleAdd() {
    const nome = novoNome.trim();
    const prazo = novoPrazo.trim();

    if (!nome || !prazo) {
      alert("Preencha o nome e o prazo da prioridade.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/prioridades-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ nome, prazo }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Erro ao adicionar prioridade");
        return;
      }

      setNovoNome("");
      setNovoPrazo("");
      onReload();
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao adicionar prioridade");
    }
  }

  function startEdit(item) {
    if (lockedNames.includes(item.nome)) return;
    setEditingId(item.id);
    setEditNome(item.nome);
    setEditPrazo(item.prazo || "");
  }

  async function confirmEdit(id) {
    const nome = editNome.trim();
    const prazo = editPrazo.trim();

    if (nome && prazo) {
      try {
        const res = await fetch(`${BASE_URL}/prioridades-config/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ nome, prazo }),
        });

        if (!res.ok) throw new Error("Erro ao atualizar");
        onReload();
      } catch (err) {
        console.error(err);
        alert("Erro ao atualizar prioridade");
      }
    }
    setEditingId(null);
  }

  async function handleRemove(id, nome) {
    if (lockedNames.includes(nome)) return;
    if (!window.confirm("Pretende realmente remover esta prioridade?")) return;
    try {
      const res = await fetch(`${BASE_URL}/prioridades-config/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Erro ao eliminar");
      onReload();
    } catch (err) {
      console.error(err);
      alert("Erro ao remover prioridade. Verifique se não está vinculada a tickets.");
    }
  }

  return (
    <div>
      <div
        className="text-xs font-semibold uppercase tracking-wider mb-3 pb-2 border-b"
        style={{ color: "#64748B", borderColor: "#E2E8F0" }}
      >
        Adicionar / Gerir Opções de Prioridade
      </div>

      <div className="space-y-1.5 mb-3">
        {prioridades.map((item) => {
          const isLocked = lockedNames.includes(item.nome);

          return (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white"
              style={{ borderColor: "#E2E8F0" }}
            >
              {editingId === item.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    className="flex-1 text-sm border rounded-lg px-2 py-1 outline-none"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    placeholder="Nome"
                    style={{ borderColor: "#0066CC", color: "#1E293B" }}
                  />
                  <input
                    className="w-28 text-sm border rounded-lg px-2 py-1 outline-none"
                    value={editPrazo}
                    onChange={(e) => setEditPrazo(e.target.value)}
                    placeholder="Prazo"
                    style={{ borderColor: "#0066CC", color: "#1E293B" }}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: "#1E293B" }}>
                    {item.nome}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                    SLA: {item.prazo || "Sem prazo"}
                  </span>
                </div>
              )}

              {editingId === item.id ? (
                <button
                  onClick={() => confirmEdit(item.id)}
                  className="text-xs font-semibold px-2 py-0.5 rounded cursor-pointer"
                  style={{ background: "#ECFDF5", color: "#10B981" }}
                >
                  ✓ Guardar
                </button>
              ) : (
                !isLocked && (
                  <button
                    onClick={() => startEdit(item)}
                    className="text-xs font-medium cursor-pointer"
                    style={{ color: "#0066CC" }}
                  >
                    Editar
                  </button>
                )
              )}

              {!isLocked && editingId !== item.id && (
                <button
                  onClick={() => handleRemove(item.id, item.nome)}
                  className="text-xs font-medium cursor-pointer"
                  style={{ color: "#E11D48" }}
                >
                  Remover
                </button>
              )}

              {isLocked && (
                <span
                  className="text-[10px]"
                  style={{ color: "#94A3B8" }}
                  title="Prioridade padrão (bloqueada para edição e remoção)"
                >
                  🔒
                </span>
              )}
            </div>
          );
        })}
        {prioridades.length === 0 && (
          <div className="text-xs py-2 text-slate-400">Nenhum registo cadastrado.</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nome da prioridade (ex: Urgente, Bloqueante)..."
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          className="flex-1 text-sm border rounded-xl px-3 py-2 outline-none"
          style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
        />
        <input
          type="text"
          placeholder="Prazo (ex: 2h, 24h, 3 dias)..."
          value={novoPrazo}
          onChange={(e) => setNovoPrazo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          className="w-48 text-sm border rounded-xl px-3 py-2 outline-none"
          style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
          style={{ background: "#0066CC" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#0054a8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#0066CC"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar
        </button>
      </div>
    </div>
  );
}

// Componente CRUD para Planos de Clientes
function CrudPlanosApi() {
  const [planos, setPlanos] = useState([]);
  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editValor, setEditValor] = useState("");
  const [carregando, setCarregando] = useState(false);

  const carregarPlanos = async () => {
    try {
      setCarregando(true);
      const res = await fetch(`${BASE_URL}/planos`);
      if (!res.ok) throw new Error("Erro ao carregar planos");
      const dados = await res.json();
      setPlanos(dados);
    } catch (err) {
      console.error("Erro ao buscar planos:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPlanos();
  }, []);

  async function handleAdd() {
    const nome = novoNome.trim();
    const valor = parseFloat(novoValor.replace(",", "."));

    if (!nome || isNaN(valor)) {
      alert("Informe o nome do plano e um valor numérico válido.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/planos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ nome, valor }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Erro ao adicionar plano");
        return;
      }

      setNovoNome("");
      setNovoValor("");
      carregarPlanos();
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com a API de planos");
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditNome(item.nome);
    setEditValor(item.valor);
  }

  async function confirmEdit(id) {
    const nome = editNome.trim();
    const valor = parseFloat(String(editValor).replace(",", "."));

    if (nome && !isNaN(valor)) {
      try {
        const res = await fetch(`${BASE_URL}/planos/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ nome, valor }),
        });

        if (!res.ok) throw new Error("Erro ao atualizar plano");
        carregarPlanos();
      } catch (err) {
        console.error(err);
        alert("Erro ao atualizar plano");
      }
    }
    setEditingId(null);
  }

  async function handleRemove(id) {
    if (!window.confirm("Pretende realmente remover este plano?")) return;
    try {
      const res = await fetch(`${BASE_URL}/planos/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Erro ao excluir plano");
      carregarPlanos();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir plano. Verifique se não está vinculado a clientes.");
    }
  }

  return (
    <div>
      <div className="space-y-1.5 mb-3">
        {planos.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white"
            style={{ borderColor: "#E2E8F0" }}
          >
            {editingId === item.id ? (
              <div className="flex-1 flex gap-2">
                <input
                  className="flex-1 text-sm border rounded-lg px-2 py-1 outline-none"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Nome do plano"
                  style={{ borderColor: "#0066CC", color: "#1E293B" }}
                />
                <input
                  type="number"
                  step="0.01"
                  className="w-32 text-sm border rounded-lg px-2 py-1 outline-none"
                  value={editValor}
                  onChange={(e) => setEditValor(e.target.value)}
                  placeholder="Valor (R$)"
                  style={{ borderColor: "#0066CC", color: "#1E293B" }}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "#1E293B" }}>
                  {item.nome}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  {Number(item.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            )}

            {editingId === item.id ? (
              <button
                onClick={() => confirmEdit(item.id)}
                className="text-xs font-semibold px-2 py-0.5 rounded cursor-pointer"
                style={{ background: "#ECFDF5", color: "#10B981" }}
              >
                ✓ Guardar
              </button>
            ) : (
              <button
                onClick={() => startEdit(item)}
                className="text-xs font-medium cursor-pointer"
                style={{ color: "#0066CC" }}
              >
                Editar
              </button>
            )}

            {editingId !== item.id && (
              <button
                onClick={() => handleRemove(item.id)}
                className="text-xs font-medium cursor-pointer"
                style={{ color: "#E11D48" }}
              >
                Remover
              </button>
            )}
          </div>
        ))}

        {!carregando && planos.length === 0 && (
          <div className="text-xs py-2 text-slate-400">Nenhum plano registado.</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nome do plano (ex: Starter, Pro, Enterprise)..."
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          className="flex-1 text-sm border rounded-xl px-3 py-2 outline-none"
          style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Valor (ex: 299.90)..."
          value={novoValor}
          onChange={(e) => setNovoValor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          className="w-44 text-sm border rounded-xl px-3 py-2 outline-none"
          style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
          style={{ background: "#0066CC" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#0054a8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#0066CC"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar
        </button>
      </div>
    </div>
  );
}

// Componente CRUD para Módulos Adicionais do Sistema
function CrudModulosApi() {
  const [modulos, setModulos] = useState([]);
  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editValor, setEditValor] = useState("");
  const [carregando, setCarregando] = useState(false);

  const carregarModulos = async () => {
    try {
      setCarregando(true);
      const res = await fetch(`${BASE_URL}/modulos`);
      if (!res.ok) throw new Error("Erro ao carregar módulos");
      const dados = await res.json();
      setModulos(dados);
    } catch (err) {
      console.error("Erro ao carregar módulos:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarModulos();
  }, []);

  async function handleAdd() {
    const nome = novoNome.trim();
    const valor = parseFloat(novoValor.replace(",", "."));

    if (!nome || isNaN(valor)) {
      alert("Informe o nome do módulo e um valor adicional válido.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/modulos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ nome, valor }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Erro ao adicionar módulo");
        return;
      }

      setNovoNome("");
      setNovoValor("");
      carregarModulos();
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com a API de módulos");
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditNome(item.nome);
    setEditValor(item.valor);
  }

  async function confirmEdit(id) {
    const nome = editNome.trim();
    const valor = parseFloat(String(editValor).replace(",", "."));

    if (nome && !isNaN(valor)) {
      try {
        const res = await fetch(`${BASE_URL}/modulos/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ nome, valor }),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.message || "Erro ao atualizar módulo");
          return;
        }

        carregarModulos();
      } catch (err) {
        console.error(err);
        alert("Erro ao atualizar módulo");
      }
    }
    setEditingId(null);
  }

  async function handleRemove(id, nome) {
    if (!window.confirm(`Pretende realmente remover o módulo "${nome}"?`)) return;
    try {
      const res = await fetch(`${BASE_URL}/modulos/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Não foi possível excluir o módulo.");
        return;
      }

      carregarModulos();
    } catch (err) {
      console.error(err);
      alert("Erro ao comunicar com o servidor.");
    }
  }

  return (
    <div>
      <div className="space-y-1.5 mb-3">
        {modulos.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white"
            style={{ borderColor: "#E2E8F0" }}
          >
            {editingId === item.id ? (
              <div className="flex-1 flex gap-2">
                <input
                  className="flex-1 text-sm border rounded-lg px-2 py-1 outline-none"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Nome do módulo"
                  style={{ borderColor: "#0066CC", color: "#1E293B" }}
                />
                <input
                  type="number"
                  step="0.01"
                  className="w-32 text-sm border rounded-lg px-2 py-1 outline-none"
                  value={editValor}
                  onChange={(e) => setEditValor(e.target.value)}
                  placeholder="Valor (R$)"
                  style={{ borderColor: "#0066CC", color: "#1E293B" }}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium" style={{ color: "#1E293B" }}>
                    {item.nome}
                  </span>
                  {item.clientes_count !== undefined && item.clientes_count > 0 && (
                    <span className="ml-2 text-[11px] text-slate-500 font-medium">
                      ({item.clientes_count} {item.clientes_count === 1 ? "cliente ativo" : "clientes ativos"})
                    </span>
                  )}
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  {Number(item.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            )}

            {editingId === item.id ? (
              <button
                onClick={() => confirmEdit(item.id)}
                className="text-xs font-semibold px-2 py-0.5 rounded cursor-pointer"
                style={{ background: "#ECFDF5", color: "#10B981" }}
              >
                ✓ Guardar
              </button>
            ) : (
              <button
                onClick={() => startEdit(item)}
                className="text-xs font-medium cursor-pointer"
                style={{ color: "#0066CC" }}
              >
                Editar
              </button>
            )}

            {editingId !== item.id && (
              <button
                onClick={() => handleRemove(item.id, item.nome)}
                className="text-xs font-medium cursor-pointer"
                style={{ color: "#E11D48" }}
              >
                Remover
              </button>
            )}
          </div>
        ))}

        {!carregando && modulos.length === 0 && (
          <div className="text-xs py-2 text-slate-400">Nenhum módulo registado.</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nome do módulo (ex: Auditoria de Fretes, Torre de Controle)..."
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          className="flex-1 text-sm border rounded-xl px-3 py-2 outline-none"
          style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Valor mensal (ex: 150.00)..."
          value={novoValor}
          onChange={(e) => setNovoValor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          className="w-44 text-sm border rounded-xl px-3 py-2 outline-none"
          style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
        />
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
          style={{ background: "#0066CC" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#0054a8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#0066CC"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar
        </button>
      </div>
    </div>
  );
}

// Linha de Prioridade com atribuição dinâmica de cores
function SlaRowApi({ prioridade, onUpdate }) {
  const [prazo, setPrazo] = useState(prioridade.prazo || "");
  const [salvando, setSalvando] = useState(false);

  const paletaCores = [
    { color: "#2563EB", bg: "#EFF6FF" },
    { color: "#7C3AED", bg: "#F5F3FF" },
    { color: "#DB2777", bg: "#FDF2F8" },
    { color: "#0D9488", bg: "#F0FDFA" },
  ];

  const configCores = {
    Alta: { color: "#F26522", bg: "#FFF1E8" },
    Média: { color: "#F59E0B", bg: "#FFFBEB" },
    Baixa: { color: "#10B981", bg: "#ECFDF5" },
  };

  const estilo =
    configCores[prioridade.nome] ||
    paletaCores[prioridade.id % paletaCores.length];

  const handleBlur = async () => {
    if (prazo !== prioridade.prazo) {
      try {
        setSalvando(true);
        await fetch(`${BASE_URL}/prioridades-config/${prioridade.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ prazo }),
        });
        onUpdate();
      } catch (err) {
        console.error("Erro ao atualizar prazo de SLA:", err);
      } finally {
        setSalvando(false);
      }
    }
  };

  return (
    <tr className="border-t" style={{ borderColor: "#E2E8F0" }}>
      <td className="px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-medium" style={{ color: estilo.color }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: estilo.color }} />
          {prioridade.nome}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            onBlur={handleBlur}
            placeholder="Ex: 24h"
            className="w-32 text-sm border rounded-lg px-3 py-1.5 outline-none font-medium"
            style={{ borderColor: estilo.color + "50", background: estilo.bg, color: estilo.color }}
          />
          {salvando && <span className="text-[11px] text-slate-400">A guardar...</span>}
        </div>
      </td>
    </tr>
  );
}

function Section({ title, children }) {
  return (
    <div
      className="bg-white rounded-xl border p-6"
      style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <h2 className="text-base font-semibold mb-4" style={{ color: "#1E293B" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function Configuracoes() {
  const [emailSync, setEmailSync] = useState(true);
  const [emailAddress, setEmailAddress] = useState("suporte@fretegestao.com.br");
  const [prioridades, setPrioridades] = useState([]);

  const carregarPrioridades = async () => {
    try {
      const res = await fetch(`${BASE_URL}/prioridades-config`);
      if (!res.ok) throw new Error("Erro ao carregar prioridades");
      const dados = await res.json();
      setPrioridades(dados);
    } catch (err) {
      console.error("Erro ao carregar PrioridadeConfig:", err);
    }
  };

  useEffect(() => {
    carregarPrioridades();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#F4F6F9" }}>
      <div className="px-6 py-4 border-b bg-white" style={{ borderColor: "#E2E8F0" }}>
        <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>
          ⚙️ Configurações do Sistema
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
          Integrações, SLAs, opções de campos e parâmetros globais da plataforma
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Email integration */}
        <Section title="📧 Ingestão Automática de E-mails Corporativos">
          <div className="space-y-4">
            <div
              className="flex items-center justify-between p-4 rounded-xl border"
              style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}
            >
              <div>
                <div className="font-medium text-sm" style={{ color: "#1E293B" }}>
                  Sincronização Automática de E-mails
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                  E-mails recebidos são convertidos automaticamente em tickets de suporte
                </div>
              </div>
              <button
                onClick={() => setEmailSync(!emailSync)}
                className="relative w-11 h-6 rounded-full transition-all flex-shrink-0 cursor-pointer"
                style={{ background: emailSync ? "#10B981" : "#CBD5E1" }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                  style={{ left: emailSync ? "22px" : "2px" }}
                />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Conta de E-mail Monitorada
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none"
                style={{ borderColor: "#E2E8F0", color: "#1E293B", background: "#fff" }}
              />
            </div>
          </div>
        </Section>

        {/* SLAs e Prazos com PrioridadeConfig */}
        <Section title="⏱️ Gestão de SLAs e Prazos por Prioridade">
          <p className="text-xs mb-3" style={{ color: "#64748B" }}>
            Configure o prazo máximo de resolução para cada prioridade registrada na base de dados.
          </p>
          <div className="overflow-hidden rounded-xl border mb-4" style={{ borderColor: "#E2E8F0" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                    Prioridade
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                    Prazo / SLA
                  </th>
                </tr>
              </thead>
              <tbody>
                {prioridades.map((p) => (
                  <SlaRowApi key={p.id} prioridade={p} onUpdate={carregarPrioridades} />
                ))}
                {prioridades.length === 0 && (
                  <tr>
                    <td colSpan="2" className="px-4 py-3 text-xs text-slate-400">
                      Nenhuma prioridade cadastrada no banco de dados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <CrudPrioridadeApi
            prioridades={prioridades}
            onReload={carregarPrioridades}
            lockedNames={["Alta", "Média", "Baixa"]}
          />
        </Section>

        {/* Opções de Campos dos Tickets */}
        <Section title="🏷️ Opções de Campos dos Tickets">
          <p className="text-xs mb-4" style={{ color: "#64748B" }}>
            Gerencie as opções guardadas nas tabelas de configuração do sistema.
          </p>
          <div className="grid grid-cols-1 gap-6">
            <CrudListApi
              title="Status"
              endpoint="/status-config"
              lockedNames={["Aberto", "Resolvido", "Fechado", "A fazer", "Pendente", "Vencido"]}
            />
            <CrudListApi
              title="Categoria / Tipo de Ticket"
              endpoint="/categorias-config"
              lockedNames={["Atualização de Tabela", "Nova Tabela", "Dúvidas do Sistema"]}
            />
            <CrudListApi
              title="Canal de Atendimento"
              endpoint="/canais-config"
              lockedNames={["E-mail", "WhatsApp"]}
            />
          </div>
        </Section>

        {/* Plan options ligadas à tabela plano */}
        <Section title="📦 Planos de Clientes">
          <p className="text-xs mb-4" style={{ color: "#64748B" }}>
            Gerencie os planos e seus respectivos valores comerciais para associação no cadastro de clientes.
          </p>
          <CrudPlanosApi />
        </Section>

        {/* Módulos do Sistema vinculados à tabela modulo */}
        <Section title="🧩 Módulos Adicionais do Sistema">
          <p className="text-xs mb-4" style={{ color: "#64748B" }}>
            Gerencie os módulos e serviços opcionais que podem ser contratados por cada cliente.
          </p>
          <CrudModulosApi />
        </Section>
      </div>
    </div>
  );
}