import React, { useState, useEffect } from "react";
import NovoUsuarioModal from "./NovoUsuarioModal";
import EditarUsuarioModal from "./EditarUsuarioModal";

const URL_API = "http://localhost:8000/api/usuarios";

const SETOR_COLORS = {
  "Suporte": { bg: "#EBF4FF", color: "#0066CC" },
  "Implantação": { bg: "#FFF1E8", color: "#F26522" },
  "Comercial": { bg: "#ECFDF5", color: "#10B981" },
  "Diretoria": { bg: "#0B2847", color: "#fff" },
};

function maskCPF(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function calcularIniciais(nome) {
  if (!nome) return "??";
  const parts = nome.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return nome.slice(0, 2).toUpperCase();
}

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const usuarioLogado = JSON.parse(localStorage.getItem("user") || "{}");

  async function carregarUsuarios() {
    try {
      setCarregando(true);
      const resposta = await fetch(URL_API);
      if (!resposta.ok) throw new Error("Erro ao buscar usuários");
      const dados = await resposta.json();

      const dadosFormatados = (Array.isArray(dados) ? dados : []).map((u) => ({
        ...u,
        initials: calcularIniciais(u.nome),
        status: u.status === "A" || u.status === "Ativo" ? "Ativo" : "Inativo",
      }));

      setUsers(dadosFormatados);
    } catch (erro) {
      console.error("Falha ao carregar usuários:", erro);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function handleCreate(data) {
    try {
      const payload = {
        nome: data.nome,
        cpf: data.cpf.replace(/\D/g, ""),
        setor: data.setor,
        email: data.email,
        senha: data.senha,
        status: data.status === "Ativo" ? "A" : "I",
      };

      const resposta = await fetch(URL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resposta.ok) {
        const erroServidor = await resposta.json();
        const mensagem = erroServidor.errors
          ? Object.values(erroServidor.errors).flat().join("\n")
          : (erroServidor.message || "Erro ao criar usuário");
        alert(mensagem);
        return;
      }

      await carregarUsuarios();
      setShowNovoModal(false);
    } catch (erro) {
      console.error("Erro na requisição:", erro);
      alert("Erro ao comunicar com a API.");
    }
  }

  async function handleUpdate(data) {
    try {
      const payload = {
        nome: data.nome,
        cpf: data.cpf.replace(/\D/g, ""),
        setor: data.setor,
        email: data.email,
        status: data.status === "Ativo" ? "A" : "I",
      };

      if (data.senha && data.senha.trim() !== "") {
        payload.senha = data.senha;
      }

      const resposta = await fetch(`${URL_API}/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resposta.ok) {
        const erroServidor = await resposta.json();
        const mensagem = erroServidor.errors
          ? Object.values(erroServidor.errors).flat().join("\n")
          : (erroServidor.message || "Erro ao atualizar usuário");
        alert(mensagem);
        return;
      }

      if (Number(data.id) === Number(usuarioLogado.id)) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...usuarioLogado,
            nome: data.nome,
            email: data.email,
            setor: data.setor,
          })
        );
        window.dispatchEvent(new Event("user-updated")); //Faz o nome no rodape mudar sem dar F5
      }

      await carregarUsuarios();
      setUsuarioEmEdicao(null);
    } catch (erro) {
      console.error("Erro na requisição:", erro);
      alert("Erro ao comunicar com a API.");
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F4F6F9" }}>
      <div className="px-6 py-4 border-b bg-white flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>👥 Usuários do Sistema</h1>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Equipe interna da Frete Gestão</p>
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
            Novo Usuário
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-sm"
          style={{ background: "#EBF4FF", color: "#0066CC", border: "1px solid #BFDBFE" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Cada usuário pode editar apenas seu próprio cadastro. Alterações em outros perfis requerem permissão de Diretoria.
        </div>

        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["", "Nome", "Setor", "E-mail Corporativo", "CPF", "Status", "Ações"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748B" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#64748B]">
                    Carregando usuários...
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const sc = SETOR_COLORS[u.setor] || { bg: "#F1F5F9", color: "#64748B" };
                  const isCurrentUser =
                    (usuarioLogado.id && Number(u.id) === Number(usuarioLogado.id)) ||
                    (usuarioLogado.email && u.email?.toLowerCase() === usuarioLogado.email.toLowerCase());
                  const canEdit = isCurrentUser || usuarioLogado.setor === "Diretoria";

                  return (
                    <tr
                      key={u.id}
                      className="border-t hover:bg-[#F8FAFC] transition-colors"
                      style={{ borderColor: "#E2E8F0", background: isCurrentUser ? "#FAFBFF" : undefined }}
                    >
                      <td className="px-4 py-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0066CC" }}>
                          {u.initials}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: "#1E293B" }}>{u.nome}</span>
                          {isCurrentUser && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#EBF4FF", color: "#0066CC" }}>Você</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={sc}>{u.setor}</span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#64748B" }}>{u.email}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "#64748B" }}>{maskCPF(u.cpf)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={u.status === "Ativo" ? { background: "#ECFDF5", color: "#10B981" } : { background: "#FFF1F2", color: "#E11D48" }}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <button
                            onClick={() => setUsuarioEmEdicao(u)}
                            className="text-xs font-medium transition-colors cursor-pointer"
                            style={{ color: "#0066CC" }}
                          >
                            Editar
                          </button>
                        ) : (
                          <span className="text-xs" style={{ color: "#94A3B8" }}>🔒 Restrito</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}

              {!carregando && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#94A3B8]">
                    Nenhum usuário cadastrado no sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNovoModal && (
        <NovoUsuarioModal
          onClose={() => setShowNovoModal(false)}
          onSave={handleCreate}
        />
      )}

      {usuarioEmEdicao && (
        <EditarUsuarioModal
          usuario={usuarioEmEdicao}
          onClose={() => setUsuarioEmEdicao(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}