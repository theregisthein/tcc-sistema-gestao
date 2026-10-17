import { CURRENT_USER } from "../data/mock";

const navItems = [
  { id: "dashboard",       label: "Dashboard Geral",         icon: ChartIcon,    group: null },
  { id: "tickets",         label: "Tickets de Suporte",      icon: TicketIcon,   group: "MÓDULO SUPORTE" },
  { id: "implantacoes",    label: "Projetos de Implantação", icon: RocketIcon,   group: "MÓDULO IMPLANTAÇÃO" },
  { id: "relatorios",      label: "Relatórios",              icon: BarChart3Icon, group: "RELATÓRIOS & CONSULTAS" },
  { id: "clientes",        label: "Clientes",                icon: BuildingIcon, group: "CADASTROS BASE" },
  { id: "transportadoras", label: "Transportadoras",         icon: TruckIcon,    group: null },
  { id: "usuarios",        label: "Usuários do Sistema",     icon: UsersIcon,    group: null },
];

function BarChart3Icon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function TicketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    </svg>
  );
}
function RocketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M8 10h.01M16 10h.01M12 14h.01M8 14h.01M16 14h.01" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
      <rect width="9" height="11" x="12" y="6" rx="1" />
      <circle cx="17" cy="20" r="1" /><circle cx="7" cy="20" r="1" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Sidebar({ currentScreen, onNavigate, onLogout, collapsed, onToggle }) {
  let lastGroup = "__init__";

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300 flex-shrink-0"
      style={{ background: "#0B2847", width: collapsed ? "64px" : "240px", minWidth: collapsed ? "64px" : "240px" }}
    >
      {/* Logo / expand toggle */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        {/* Clicking the FG badge also expands when collapsed */}
        <button
          onClick={collapsed ? onToggle : undefined}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
          style={{ background: "#F26522", color: "#fff", cursor: collapsed ? "pointer" : "default" }}
          title={collapsed ? "Expandir menu" : undefined}
        >
          FG
        </button>
        {!collapsed && (
          <div className="overflow-hidden flex-1">
            <div className="text-white font-semibold text-sm leading-tight whitespace-nowrap">Frete Gestão</div>
            <div className="text-white/50 text-xs whitespace-nowrap">Plataforma Unificada</div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="ml-auto text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
            title="Recolher menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const showDivider = item.group && item.group !== lastGroup;
          if (item.group) lastGroup = item.group;

          const isActive =
            currentScreen === item.id ||
            (item.id === "tickets" && currentScreen === "ticket-detail") ||
            (item.id === "implantacoes" && (currentScreen === "implantacao-detail" || currentScreen === "nova-implantacao"));

          return (
            <div key={item.id}>
              {showDivider && !collapsed && (
                <div className="px-4 pt-4 pb-1">
                  <div className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "#64748B" }}>
                    {item.group}
                  </div>
                </div>
              )}
              {showDivider && collapsed && <div className="mx-3 my-2 border-t border-white/10" />}
              <button
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150 relative group
                  ${isActive ? "text-white font-medium" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                style={isActive ? { background: "rgba(0,102,204,0.25)" } : {}}
              >
                {isActive && <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r" style={{ background: "#0066CC" }} />}
                <span className={isActive ? "text-white" : "text-white/50 group-hover:text-white/80"}>
                  <item.icon />
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10">
        <button
          onClick={() => onNavigate("configuracoes")}
          title={collapsed ? "Configurações" : undefined}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors
            ${currentScreen === "configuracoes" ? "text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`}
        >
          <GearIcon />
          {!collapsed && <span>Configurações</span>}
        </button>

        {/* Avatar footer — clicking it expands when collapsed */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-t border-white/10"
          style={{ cursor: collapsed ? "pointer" : "default" }}
          onClick={collapsed ? onToggle : undefined}
          title={collapsed ? "Expandir menu" : undefined}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white transition-all"
            style={{
              background: "#0066CC",
              boxShadow: collapsed ? "0 0 0 2px rgba(255,255,255,0.2)" : "none",
            }}
          >
            {CURRENT_USER.initials}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-white text-xs font-medium truncate">{CURRENT_USER.name}</div>
              <div className="text-white/40 text-[11px] truncate">{CURRENT_USER.role}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={(e) => { e.stopPropagation(); onLogout(); }}
              className="text-white/40 hover:text-red-400 transition-colors flex-shrink-0"
              title="Sair"
            >
              <LogoutIcon />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
