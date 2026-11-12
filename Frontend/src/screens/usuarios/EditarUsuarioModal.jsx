import React, { useState } from "react";

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

export default function EditarUsuarioModal({ usuario, onClose, onSave }) {
  const [form, setForm] = useState({
    id: usuario.id,
    nome: usuario.nome || "",
    setor: usuario.setor || "Suporte",
    cpf: maskCPF(usuario.cpf || ""),
    email: usuario.email || "",
    senha: "",
    status: usuario.status === "A" || usuario.status === "Ativo" ? "Ativo" : "Inativo",
    initials: calcularIniciais(usuario.nome),
  });

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

    if (form.cpf.replace(/\D/g, "").length !== 11) {
      alert("O CPF precisa conter 11 dígitos numéricos.");
      return;
    }
    if (!form.nome.trim() || !form.email.trim()) {
      alert("Preencha o nome e o e-mail corporativo.");
      return;
    }
    if (form.senha && form.senha.length < 6) {
      alert("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,40,71,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>Editar Usuário</h2>
          <button onClick={onClose} className="cursor-pointer" style={{ color: "#64748B" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F8FAFC" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "#0066CC" }}>
              {form.initials}
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: "#1E293B" }}>{form.nome}</div>
              <div className="text-xs" style={{ color: "#64748B" }}>{form.setor}</div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>Nome Completo *</label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
              className="w-full text-sm border rounded-lg px-3 py-2 outline-none"
              style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
            />
          </div>

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

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>CPF *</label>
            <input
              type="text"
              required
              value={form.cpf}
              onChange={(e) => update("cpf", maskCPF(e.target.value))}
              className="w-full text-sm border rounded-lg px-3 py-2 outline-none"
              style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>E-mail Corporativo *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full text-sm border rounded-lg px-3 py-2 outline-none"
              style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
              Nova Senha (deixe em branco para manter)
            </label>
            <input
              type="password"
              value={form.senha}
              onChange={(e) => update("senha", e.target.value)}
              placeholder="Deixe em branco para manter"
              className="w-full text-sm border rounded-lg px-3 py-2 outline-none"
              style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
            />
          </div>

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
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer" style={{ background: "#0066CC" }}>
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}