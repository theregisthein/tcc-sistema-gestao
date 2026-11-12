import { useState, useEffect } from "react";
import NovaTransportadoraModal from "./NovaTransportadoraModal";
import EditarTransportadoraModal from "./EditarTransportadoraModal";

const URL_API = "http://localhost:8000/api/transportadoras";

function maskCNPJ(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export default function Transportadoras() {
  const [lista, setLista] = useState([]);
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [transportadoraEmEdicao, setTransportadoraEmEdicao] = useState(null);
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

  async function handleCreate(dados) {
    try {
      const resposta = await fetch(URL_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(dados),
      });

      if (!resposta.ok) {
        const erroServidor = await resposta.json();
        const mensagemErro = erroServidor.errors
          ? Object.values(erroServidor.errors).flat().join("\n")
          : (erroServidor.message || "Erro ao adicionar transportadora");
        alert(mensagemErro);
        return;
      }

      await carregarTransportadoras();
      setShowNovoModal(false);
    } catch (erro) {
      console.error("Erro na comunicação com a API:", erro);
      alert("Erro ao salvar os dados da transportadora.");
    }
  }

  async function handleUpdate(dados) {
    try {
      const resposta = await fetch(`${URL_API}/${dados.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(dados),
      });

      if (!resposta.ok) {
        const erroServidor = await resposta.json();
        const mensagemErro = erroServidor.errors
          ? Object.values(erroServidor.errors).flat().join("\n")
          : (erroServidor.message || "Erro ao atualizar transportadora");
        alert(mensagemErro);
        return;
      }

      await carregarTransportadoras();
      setTransportadoraEmEdicao(null);
    } catch (erro) {
      console.error("Erro na comunicação com a API:", erro);
      alert("Erro ao atualizar os dados da transportadora.");
    }
  }

  const filtrados = lista.filter((t) => {
    if (!busca) return true;
    const buscaLower = busca.toLowerCase();
    const buscaNumeros = busca.replace(/\D/g, "");

    const matchNome = t.nome && t.nome.toLowerCase().includes(buscaLower);
    const matchCnpjFormatado = t.cnpj && maskCNPJ(t.cnpj).includes(busca);
    const matchCnpjNumeros = buscaNumeros && t.cnpj && String(t.cnpj).replace(/\D/g, "").includes(buscaNumeros);

    return matchNome || matchCnpjFormatado || matchCnpjNumeros;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F4F6F9" }}>
      <div className="px-6 py-4 border-b bg-white flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>🚚 Transportadoras</h1>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Parceiras logísticas cadastradas no sistema</p>
          </div>
          <button
            onClick={() => setShowNovoModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
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
                  <th key={cabecalho} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>
                    {cabecalho}
                  </th>
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
              ) : (
                filtrados.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-[#F8FAFC] transition-colors" style={{ borderColor: "#E2E8F0" }}>
                    <td className="px-4 py-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0B2847" }}>
                        {(t.nome || "TR").slice(0, 2).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: "#1E293B" }}>{t.nome}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#1E293B" }}>{maskCNPJ(t.cnpj)}</td>
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
                        onClick={() => setTransportadoraEmEdicao({ ...t })}
                        className="text-xs font-medium transition-colors cursor-pointer"
                        style={{ color: "#0066CC" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#0054a8"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#0066CC"; }}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
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

      {showNovoModal && (
        <NovaTransportadoraModal
          aoFechar={() => setShowNovoModal(false)}
          aoSalvar={handleCreate}
        />
      )}

      {transportadoraEmEdicao && (
        <EditarTransportadoraModal
          transportadora={transportadoraEmEdicao}
          aoFechar={() => setTransportadoraEmEdicao(null)}
          aoSalvar={handleUpdate}
        />
      )}
    </div>
  );
}