import { useState } from "react";

function maskCNPJ(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export default function EditarTransportadoraModal({ transportadora, aoFechar, aoSalvar }) {
  const [formulario, setFormulario] = useState({
    id: transportadora.id,
    nome: transportadora.nome || "",
    cnpj: maskCNPJ(transportadora.cnpj) || "",
    email: transportadora.email || "",
    status: transportadora.status || "A",
  });

  function atualizarCampo(campo, valor) {
    const valorTratado = campo === "cnpj" ? maskCNPJ(valor) : valor;
    setFormulario((anterior) => ({ ...anterior, [campo]: valorTratado }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!formulario.nome.trim()) {
      alert("Informe o nome ou razão social da transportadora.");
      return;
    }
    if (formulario.cnpj.replace(/\D/g, "").length !== 14) {
      alert("O CNPJ deve conter exatamente 14 dígitos numéricos.");
      return;
    }
    aoSalvar(formulario);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(11,40,71,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>
            Editar Transportadora
          </h2>
          <button onClick={aoFechar} className="cursor-pointer" style={{ color: "#64748B" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Pré-visualização do ícone */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F8FAFC" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "#0B2847" }}>
                {(formulario.nome || "??").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: "#1E293B" }}>
                  {formulario.nome || "Nome da transportadora"}
                </div>
                <div className="text-xs font-mono" style={{ color: "#64748B" }}>
                  {formulario.cnpj || "00.000.000/0000-00"}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                Nome / Razão Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formulario.nome}
                onChange={(e) => atualizarCampo("nome", e.target.value)}
                placeholder="Ex: Transportadora XYZ Ltda"
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#1E293B", background: "#fff" }}
                onFocus={(e) => { e.target.style.borderColor = "#0066CC"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                CNPJ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formulario.cnpj}
                onChange={(e) => atualizarCampo("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all font-mono"
                style={{ borderColor: "#E2E8F0", color: "#1E293B", background: "#fff" }}
                onFocus={(e) => { e.target.style.borderColor = "#0066CC"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                E-mail Operacional
              </label>
              <input
                type="email"
                value={formulario.email}
                onChange={(e) => atualizarCampo("email", e.target.value)}
                placeholder="operacional@transportadora.com.br"
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#1E293B", background: "#fff" }}
                onFocus={(e) => { e.target.style.borderColor = "#0066CC"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; }}
              />
            </div>

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
                    className="flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer"
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
            <button
              type="button"
              onClick={aoFechar}
              className="px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer"
              style={{ borderColor: "#E2E8F0", color: "#64748B" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
              style={{ background: "#0066CC" }}
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}