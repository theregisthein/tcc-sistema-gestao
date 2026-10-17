import { useState } from "react";
import { CURRENT_USER } from "../data/mock";

export default function Topbar() {
  const [query, setQuery] = useState("");

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

      {/* Email sync indicator */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{ background: "#ECFDF5", color: "#059669" }}
      >
        <span className="relative flex h-2 w-2">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: "#10B981" }}
          />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#10B981" }} />
        </span>
        Sync de E-mails Ativo
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-lg hover:bg-[#F4F6F9] transition-colors" title="Notificações de SLA">
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
          {CURRENT_USER.initials}
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-medium" style={{ color: "#1E293B" }}>{CURRENT_USER.name}</div>
          <div className="text-xs" style={{ color: "#64748B" }}>{CURRENT_USER.role}</div>
        </div>
      </div>
    </header>
  );
}
