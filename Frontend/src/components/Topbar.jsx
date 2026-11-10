import { useState, useEffect } from "react";

const BASE_URL = "http://localhost:8000/api";

export default function Topbar() {
  const [query, setQuery] = useState("");
  const [syncAtivo, setSyncAtivo] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  async function carregarStatus() {
    try {
      const res = await fetch(`${BASE_URL}/configuracoes/email`);
      if (res.ok) {
        const dados = await res.json();
        setSyncAtivo(Boolean(dados.ativo));
      }
    } catch (e) {
      console.error("Erro ao verificar status do email:", e);
    }
  }

  useEffect(() => {
    carregarStatus();

    function handleSyncEvent(e) {
      if (e.detail && typeof e.detail.ativo !== "undefined") {
        setSyncAtivo(Boolean(e.detail.ativo));
      } else {
        carregarStatus();
      }
    }

    window.addEventListener("email-sync-changed", handleSyncEvent);
    return () => window.removeEventListener("email-sync-changed", handleSyncEvent);
  }, []);

  async function handleForcarSync() {
    if (sincronizando) return;
    try {
      setSincronizando(true);
      const res = await fetch(`${BASE_URL}/configuracoes/email/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ ativo: true }),
      });
      if (res.ok) {
        setSyncAtivo(true);
        window.dispatchEvent(new CustomEvent("email-sync-changed", { detail: { ativo: true } }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSincronizando(false);
    }
  }

  const usuario = JSON.parse(localStorage.getItem("user") || "{}");
  const primeiroNome = usuario.nome ? usuario.nome.split(" ")[0] : "Usuário";
  const iniciais = usuario.nome
    ? usuario.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "RR";

  return (
    <header
      className="flex items-center gap-4 px-6 py-3 border-b flex-shrink-0"
      style={{ background: "#fff", borderColor: "#E2E8F0" }}
    >
      {/* Search */}
      <div className="flex-1 max-w-xl relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Buscar por CNPJ, Cliente, Ticket (#ID), Domínio ou Transportadora..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-all"
          style={{
            background: "#F4F6F9",
            border: "1px solid #E2E8F0",
            color: "#1E293B",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#0066CC";
            e.target.style.boxShadow = "0 0 0 3px rgba(0,102,204,0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E2E8F0";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Email sync indicator dinâmico */}
      <button
        type="button"
        onClick={handleForcarSync}
        title={syncAtivo ? "Clique para forçar sincronização manual agora" : "Sincronização desativada nas configurações"}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
          syncAtivo
            ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] hover:bg-[#D1FAE5]"
            : "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0] hover:bg-slate-200"
        }`}
      >
        <span className="relative flex h-2 w-2">
          {syncAtivo && (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: "#10B981" }}
            />
          )}
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ background: syncAtivo ? "#10B981" : "#94A3B8" }}
          />
        </span>
        {sincronizando ? "Sincronizando..." : syncAtivo ? "Sync de E-mails Ativo" : "Sync Pausado"}
      </button>

      {/* Notifications */}
      <button className="relative p-2 rounded-lg hover:bg-[#F4F6F9] transition-colors cursor-pointer" title="Notificações de SLA">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span
          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
          style={{ background: "#E11D48" }}
        >
          3
        </span>
      </button>

      {/* User */}
      <div className="flex items-center gap-2.5 pl-3 border-l" style={{ borderColor: "#E2E8F0" }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
          style={{ background: "#0066CC" }}
        >
          {iniciais}
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-medium" style={{ color: "#1E293B" }}>
            {usuario.nome || "Régis Rinaldi"}
          </div>
          <div className="text-xs" style={{ color: "#64748B" }}>
            {usuario.setor || "Analista de Suporte"}
          </div>
        </div>
      </div>
    </header>
  );
}