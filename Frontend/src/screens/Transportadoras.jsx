import { useState, useEffect } from "react";

const URL_API = "http://localhost:8000/api/transportadoras";

function ModalTransportadora({ transportadora, modo, aoFechar, aoSalvar }) {
  const [formulario, setFormulario] = useState(
    transportadora
      ? {
          id: transportadora.id,
          nome: transportadora.nome || "",
          cnpj: transportadora.cnpj || "",
          email: transportadora.email || "",
          status: transportadora.status || "A",
        }
      : { nome: "", cnpj: "", email: "", status: "A" }
  );

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,40,71,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>
            {modo === "adicionar" ? "Nova Transportadora" : "Editar Transportadora"}
          </h2>
          <button onClick={aoFechar} style={{ color: "#64748B" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Pré-visualização do ícone */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F8FAFC" }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "#0B2847" }}>
              {(formulario.nome || "??").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: "#1E293B" }}>{formulario.nome || "Nome da transportadora"}</div>
              <div className="text-xs" style={{ color: "#64748B" }}>{formulario.cnpj || "CNPJ"}</div>
            </div>
          </div>

          <CampoTexto label="Nome / Razão Social" valor={formulario.nome} aoMudar={(v) => atualizarCampo("nome", v)} placeholder="Ex: Transportadora XYZ Ltda" />
          <CampoTexto label="CNPJ" valor={formulario.cnpj} aoMudar={(v) => atualizarCampo("cnpj", v)} placeholder="00.000.000/0001-00" />
          <CampoTexto label="E-mail Operacional" valor={formulario.email} aoMudar={(v) => atualizarCampo("email", v)} placeholder="operacional@transportadora.com.br" tipo="email" />

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>Status</label>
            <div className="flex gap-2">
              {[
                { label: "Ativa", valor: "A" },
                { label: "Inativa", valor: "I" }
              ].map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => atualizarCampo("status", opcao.valor)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors"
                  style={{
                    borderColor: formulario.status === opcao.valor ? (opcao.valor === "A" ? "#10B981" : "#E11D48") : "#E2E8F0",
                    background: formulario.status === opcao.valor ? (opcao.valor === "A" ? "#ECFDF5" : "#FFF1F2") : "transparent",
                    color: formulario.status === opcao.valor ? (opcao.valor === "A" ? "#10B981" : "#E11D48") : "#64748B",
                  }}
                >
                  {opcao.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#E2E8F0" }}>
          <button onClick={aoFechar} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>
            Cancelar
          </button>
          <button
            onClick={() => aoSalvar(formulario)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#0066CC" }}
          >
            {modo === "adicionar" ? "Adicionar" : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CampoTexto({ label, valor, aoMudar, placeholder, tipo = "text" }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>{label}</label>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
        style={{ borderColor: "#E2E8F0", color: "#1E293B", background: "#fff" }}
        onFocus={(e) => { e.target.style.borderColor = "#0066CC"; }}
        onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; }}
      />
    </div>
  );
}

export default function Transportadoras() {
  const [lista, setLista] = useState([]);
  const [modal, setModal] = useState(null);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregarTransportadoras() {
    try {
      setCarregando(true);
      const resposta = await fetch(URL_API);
      if (!resposta.ok) throw new Error("Erro ao carregar dados");
      const dados = await resposta.json();
      setLista(dados);
    } catch (erro) {
      console.error("Falha ao buscar transportadoras:", erro);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTransportadoras();
  }, []);

  function abrirAdicionar() {
    setModal({ modo: "adicionar", transportadora: null });
  }

  function abrirEditar(t) {
    setModal({ modo: "editar", transportadora: { ...t } });
  }

  async function tratarSalvar(dados) {
    try {
      if (modal?.modo === "adicionar") {
        const resposta = await fetch(URL_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(dados),
        });

        if (!resposta.ok) {
          const erroServidor = await resposta.json();
          const mensagemErro = erroServidor.errors 
            ? Object.values(erroServidor.errors).flat().join('\n') 
            : (erroServidor.message || "Erro ao adicionar transportadora");
          alert(mensagemErro);
          return;
        }
      } else {
        const resposta = await fetch(`${URL_API}/${dados.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(dados),
        });

        if (!resposta.ok) {
          const erroServidor = await resposta.json();
          alert(erroServidor.message || "Erro ao atualizar transportadora");
          return;
        }
      }

      await carregarTransportadoras();
      setModal(null);
    } catch (erro) {
      console.error("Erro na comunicação com a API:", erro);
      alert("Erro ao salvar os dados da transportadora.");
    }
  }

  const filtrados = lista.filter((t) =>
    !busca ||
    (t.nome && t.nome.toLowerCase().includes(busca.toLowerCase())) ||
    (t.cnpj && t.cnpj.includes(busca))
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F4F6F9" }}>
      <div className="px-6 py-4 border-b bg-white flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>🚚 Transportadoras</h1>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Parceiras logísticas cadastradas no sistema</p>
          </div>
          <button
            onClick={abrirAdicionar}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#0066CC" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#0054a8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0066CC"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova Transportadora
          </button>
        </div>
        <div className="relative max-w-xs">
          <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#64748B" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none"
            style={{ border: "1px solid #E2E8F0", color: "#1E293B", background: "#F8FAFC" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["", "Nome da Transportadora", "CNPJ", "E-mail Operacional", "Status", "Ações"].map((cabecalho) => (
                  <th key={cabecalho} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>{cabecalho}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "#64748B" }}>
                    Carregando transportadoras...
                  </td>
                </tr>
              ) : filtrados.map((t) => (
                <tr key={t.id} className="border-t hover:bg-[#F8FAFC] transition-colors" style={{ borderColor: "#E2E8F0" }}>
                  <td className="px-4 py-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0B2847" }}>
                      {(t.nome || "TR").slice(0, 2).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: "#1E293B" }}>{t.nome}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "#1E293B" }}>{t.cnpj}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#64748B" }}>{t.email || "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={t.status === "A" ? { background: "#ECFDF5", color: "#10B981" } : { background: "#FFF1F2", color: "#E11D48" }}
                    >
                      {t.status === "A" ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => abrirEditar(t)}
                      className="text-xs font-medium transition-colors"
                      style={{ color: "#0066CC" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#0054a8"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#0066CC"; }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {!carregando && filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>
                    Nenhuma transportadora encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <ModalTransportadora
          transportadora={modal.transportadora}
          modo={modal.modo}
          aoFechar={() => setModal(null)}
          aoSalvar={tratarSalvar}
        />
      )}
    </div>
  );
}