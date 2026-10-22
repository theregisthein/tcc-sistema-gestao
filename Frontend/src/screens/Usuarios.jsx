import React, { useState, useEffect } from "react";

const URL_API = "http://localhost:8000/api/usuarios";

const SETOR_COLORS = {
  "Suporte": { bg: "#EBF4FF", color: "#0066CC" },
  "Implantação": { bg: "#FFF1E8", color: "#F26522" },
  "Comercial": { bg: "#ECFDF5", color: "#10B981" },
  "Diretoria": { bg: "#0B2847", color: "#fff" },
};

function maskCPF(value) {
  return String(value || "")
    .replace(/\D/g, "")           // 1. Remove tudo que não for dígito
    .slice(0, 11)                 // 2. Limita rigorosamente a 11 números
    .replace(/(\d{3})(\d)/, "$1.$2")          // Coloca o primeiro ponto: 000.0
    .replace(/(\d{3})(\d)/, "$1.$2")          // Coloca o segundo ponto:  000.000.0
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");   // Coloca o traço final:    000.000.000-00
}

function calcularIniciais(nome) {
  if (!nome) return "??";
  const parts = nome.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return nome.slice(0, 2).toUpperCase();
}

function UsuarioModal({ usuario, mode, onClose, onSave }) {
  const [form, setForm] = useState(
    usuario
      ? {
          id: usuario.id,
          nome: usuario.nome || "",
          setor: usuario.setor || "Suporte",
          cpf: maskCPF(usuario.cpf || ""),
          email: usuario.email || "",
          senha: "",
          status: usuario.status === "A" || usuario.status === "Ativo" ? "Ativo" : "Inativo",
          initials: calcularIniciais(usuario.nome),
        }
      : {
          nome: "",
          setor: "Suporte",
          cpf: "",
          email: "",
          senha: "",
          status: "Ativo",
          initials: "??",
        }
  );

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "nome") {
        next.initials = calcularIniciais(value);
      }
      return next;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    const cpfNumeros = form.cpf.replace(/\D/g, "");
    if (cpfNumeros.length !== 11) {
      alert("O CPF precisa conter 11 dígitos numéricos.");
      return;
    }

    if (!form.nome.trim()) {
      alert("Informe o nome do usuário.");
      return;
    }

    if (!form.email.trim()) {
      alert("Informe o e-mail do usuário.");
      return;
    }

    if (mode === "add" && (!form.senha || form.senha.length < 6)) {
      alert("A senha inicial é obrigatória e deve ter pelo menos 6 caracteres.");
      return;
    }

    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,40,71,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>
            {mode === "add" ? "Novo Usuário" : "Editar Usuário"}
          </h2>
          <button onClick={onClose} style={{ color: "#64748B" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F8FAFC" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "#0066CC" }}>
              {form.initials || "??"}
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: "#1E293B" }}>{form.nome || "Nome do usuário"}</div>
              <div className="text-xs" style={{ color: "#64748B" }}>{form.setor}</div>
            </div>
          </div>

          <Field label="Nome Completo" value={form.nome || ""} onChange={(v) => update("nome", v)} placeholder="Ex: João Silva" required />

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>Setor</label>
            <select
              className="w-full text-sm border rounded-lg px-3 py-2 outline-none bg-white font-medium"
              value={form.setor}
              onChange={(e) => update("setor", e.target.value)}
              style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
            >
              {Object.keys(SETOR_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <Field label="CPF" value={form.cpf || ""} onChange={(v) => update("cpf", maskCPF(v))} placeholder="000.000.000-00" required />
          <Field label="E-mail Corporativo" value={form.email || ""} onChange={(v) => update("email", v)} placeholder="nome@fretegestao.com.br" type="email" required />

          <Field
            label={mode === "add" ? "Senha Inicial" : "Nova Senha (deixe em branco para manter)"}
            value={form.senha || ""}
            onChange={(v) => update("senha", v)}
            placeholder={mode === "add" ? "•••••••• (mínimo 6 caracteres)" : "Deixe em branco para manter"}
            type="password"
            required={mode === "add"}
          />

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>Status de Acesso</label>
            <div className="flex gap-2">
              {["Ativo", "Inativo"].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => update("status", s)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer"
                  style={{
                    borderColor: form.status === s ? (s === "Ativo" ? "#10B981" : "#E11D48") : "#E2E8F0",
                    background: form.status === s ? (s === "Ativo" ? "#ECFDF5" : "#FFF1F2") : "transparent",
                    color: form.status === s ? (s === "Ativo" ? "#10B981" : "#E11D48") : "#64748B",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium border bg-white cursor-pointer" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
              style={{ background: "#0066CC" }}
            >
              {mode === "add" ? "Criar Usuário" : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required = false }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
        style={{ borderColor: "#E2E8F0", color: "#1E293B", background: "#fff" }}
        onFocus={(e) => { e.target.style.borderColor = "#0066CC"; }}
        onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; }}
      />
    </div>
  );
}

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [carregando, setCarregando] = useState(true);

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

  function openAdd() {
    setModal({ mode: "add", usuario: null });
  }

  function openEdit(u) {
    setModal({ mode: "edit", usuario: { ...u } });
  }

  async function handleSave(data) {
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

      if (modal?.mode === "add") {
        const resposta = await fetch(URL_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
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
      } else {
        const resposta = await fetch(`${URL_API}/${data.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
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
      }

      await carregarUsuarios();
      setModal(null);
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
            onClick={openAdd}
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
                  const isCurrentUser = u.nome === "Régis Rinaldi";

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
                        {isCurrentUser ? (
                          <button
                            onClick={() => openEdit(u)}
                            className="text-xs font-medium transition-colors cursor-pointer"
                            style={{ color: "#0066CC" }}
                          >
                            Editar
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: "#94A3B8" }}>🔒 Restrito</span>
                          </div>
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

      {modal && (
        <UsuarioModal
          usuario={modal.usuario}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}