import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Login from "./screens/Login";
import Dashboard from "./screens/Dashboard";
import Tickets from "./screens/Tickets";
import TicketDetail from "./screens/TicketDetail";
import Implantacoes from "./screens/Implantacoes";
import ImplantacaoDetail from "./screens/ImplantacaoDetail";
import NovaImplantacao from "./screens/NovaImplantacao";
import Clientes from "./screens/Clientes";
import Transportadoras from "./screens/Transportadoras";
import Usuarios from "./screens/Usuarios";
import Configuracoes from "./screens/Configuracoes";
import Relatorios from "./screens/Relatorios";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.replace(/^\//, "") || window.location.hash.replace(/^#\/?/, "");
      if (["dashboard", "tickets", "implantacoes", "implantacao-detail", "nova-implantacao", "relatorios", "clientes", "transportadoras", "usuarios", "configuracoes"].includes(path)) {
        return path;
      }
    }
    return "dashboard";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState(undefined);
  const [selectedTicketId, setSelectedTicketId] = useState(0);
  const [implantacaoStatusFilter, setImplantacaoStatusFilter] = useState(undefined);
  const [selectedImplantacaoId, setSelectedImplantacaoId] = useState("");

  function handleNavigate(screen) {
    setCurrentScreen(screen);
    if (typeof window !== "undefined" && window.history?.replaceState) {
      window.history.replaceState(null, "", screen === "dashboard" ? "/" : `/${screen}`);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="h-full">
        <Login onLogin={() => setIsLoggedIn(true)} />
      </div>
    );
  }

  function handleNavigateTickets(status) {
    setTicketStatusFilter(status);
    handleNavigate("tickets");
  }

  function handleNavigateImplantacoes(status) {
    setImplantacaoStatusFilter(status);
    handleNavigate("implantacoes");
  }

  function handleViewTicket(id) {
    setSelectedTicketId(id);
    handleNavigate("ticket-detail");
  }

  function handleViewImplantacao(id) {
    setSelectedImplantacaoId(id);
    handleNavigate("implantacao-detail");
  }

  function handleNovaImplantacao() {
    handleNavigate("nova-implantacao");
  }

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onLogout={() => setIsLoggedIn(false)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 flex overflow-hidden">
          {currentScreen === "dashboard" && (
            <Dashboard onNavigateTickets={handleNavigateTickets} onNavigateImplantacoes={handleNavigateImplantacoes} />
          )}
          {currentScreen === "tickets" && (
            <Tickets initialStatus={ticketStatusFilter} onViewTicket={handleViewTicket} />
          )}
          {currentScreen === "ticket-detail" && (
            <TicketDetail ticketId={selectedTicketId} onBack={() => handleNavigate("tickets")} />
          )}
          {currentScreen === "implantacoes" && (
            <Implantacoes
              initialStatus={implantacaoStatusFilter}
              onViewImplantacao={handleViewImplantacao}
              onNovaImplantacao={handleNovaImplantacao}
            />
          )}
          {currentScreen === "nova-implantacao" && (
            <NovaImplantacao
              onBack={() => handleNavigate("implantacoes")}
              onCreated={(newId) => {
                setSelectedImplantacaoId(newId);
                handleNavigate("implantacao-detail");
              }}
            />
          )}
          {currentScreen === "implantacao-detail" && (
            <ImplantacaoDetail implantacaoId={selectedImplantacaoId} onBack={() => handleNavigate("implantacoes")} />
          )}
          {currentScreen === "relatorios" && <Relatorios />}
          {currentScreen === "clientes" && <Clientes />}
          {currentScreen === "transportadoras" && <Transportadoras />}
          {currentScreen === "usuarios" && <Usuarios />}
          {currentScreen === "configuracoes" && <Configuracoes />}
        </main>
      </div>
    </div>
  );
}
