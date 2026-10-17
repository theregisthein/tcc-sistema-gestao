import { useState, useRef, useEffect, useMemo } from "react";
import { CLIENTES, TRANSPORTADORAS } from "../data/mock";

// Cores padronizadas do sistema Frete Gestão
const PLAN_COLORS = {
  Enterprise: { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
  Profissional: { bg: "#EBF4FF", color: "#0066CC", border: "#BFDBFE" },
  Starter: { bg: "#ECFDF5", color: "#10B981", border: "#A7F3D0" },
};

// Helper de correlação e match flexível entre nomes cadastrados
function normalizeText(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchesCarrier(carrierObjOrName, clientCarrierStr) {
  if (!carrierObjOrName || !clientCarrierStr) return false;
  const nameA = normalizeText(
    typeof carrierObjOrName === "string" ? carrierObjOrName : carrierObjOrName.nome
  );
  const nameB = normalizeText(clientCarrierStr);

  if (nameA === nameB) return true;
  if (nameA.includes(nameB) || nameB.includes(nameA)) return true;

  if (nameA.includes("correios") && nameB.includes("correios")) return true;
  if (nameA.includes("sequoia") && nameB.includes("sequoia")) return true;
  if (nameA.includes("azul") && nameB.includes("azul")) return true;
  if (nameA.includes("braspress") && nameB.includes("braspress")) return true;
  if (nameA.includes("total") && nameB.includes("total")) return true;
  if (nameA.includes("tnt") && nameB.includes("tnt")) return true;
  if (nameA.includes("jadlog") && nameB.includes("jadlog")) return true;

  return false;
}

// Retorna todos os clientes que possuem vínculo com a transportadora indicada
function getClientsForCarrier(carrier, clientsList) {
  if (!carrier) return [];
  return clientsList.filter((client) => {
    if (!client.transportadoras || !Array.isArray(client.transportadoras)) return false;
    return client.transportadoras.some((cName) => matchesCarrier(carrier, cName));
  });
}

// Retorna todas as transportadoras vinculadas a um cliente
function getCarriersForClient(client, carriersList) {
  if (!client || !client.transportadoras || !Array.isArray(client.transportadoras)) return [];
  return client.transportadoras.map((cName) => {
    const found = carriersList.find((t) => matchesCarrier(t, cName));
    if (found) return found;
    return {
      id: cName,
      nome: cName,
      cnpj: "Não cadastrado",
      modalidade: "Rodoviário Geral",
      ativo: true,
      contato: "operacional@" + normalizeText(cName).replace(/[^a-z0-9]/g, "") + ".com.br",
      telefone: "(11) 3000-0000",
    };
  });
}

export default function Relatorios() {
  // Modo de consulta: "carrier" (Por Transportadora) ou "client" (Por Cliente)
  const [queryMode, setQueryMode] = useState("carrier");

  // Itens selecionados no autocomplete (antes de clicar em Filtrar)
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  // Filtro efetivamente aplicado na tabela
  const [appliedFilter, setAppliedFilter] = useState(null);

  // Busca rápida interna na tabela de resultados
  const [tableSearch, setTableSearch] = useState("");

  // Estado para toast de notificação
  const [toastMessage, setToastMessage] = useState(null);

  // Alterna modo de consulta
  function handleModeChange(mode) {
    if (mode === queryMode) return;
    setQueryMode(mode);
    setTableSearch("");
    setAppliedFilter(null);
    setSelectedCarrier(null);
    setSelectedClient(null);
  }

  // Executa o filtro
  function handleApplyFilter() {
    if (queryMode === "carrier") {
      if (!selectedCarrier) {
        showToast("Selecione uma transportadora para filtrar.", "warning");
        return;
      }
      setAppliedFilter({
        mode: "carrier",
        target: selectedCarrier,
      });
      setTableSearch("");
    } else {
      if (!selectedClient) {
        showToast("Selecione um cliente para filtrar.", "warning");
        return;
      }
      setAppliedFilter({
        mode: "client",
        target: selectedClient,
      });
      setTableSearch("");
    }
  }

  // Limpa todos os filtros
  function handleClearFilters() {
    setSelectedCarrier(null);
    setSelectedClient(null);
    setAppliedFilter(null);
    setTableSearch("");
    showToast("Filtros limpos com sucesso.", "info");
  }

  // Atalho para selecionar e já filtrar rapidamente pelos chips de exemplo
  function handleQuickSelect(type, item) {
    if (type === "carrier") {
      setQueryMode("carrier");
      setSelectedCarrier(item);
      setSelectedClient(null);
      setAppliedFilter({ mode: "carrier", target: item });
    } else {
      setQueryMode("client");
      setSelectedClient(item);
      setSelectedCarrier(null);
      setAppliedFilter({ mode: "client", target: item });
    }
    setTableSearch("");
  }

  // Feedback com Toast
  function showToast(text, type = "success") {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }

  // Resultados calculados com base no filtro aplicado
  const rawResults = useMemo(() => {
    if (!appliedFilter) return [];
    if (appliedFilter.mode === "carrier") {
      return getClientsForCarrier(appliedFilter.target, CLIENTES);
    } else {
      return getCarriersForClient(appliedFilter.target, TRANSPORTADORAS);
    }
  }, [appliedFilter]);

  // Resultados filtrados pelo campo de busca secundário da tabela
  const filteredResults = useMemo(() => {
    if (!tableSearch.trim()) return rawResults;
    const query = normalizeText(tableSearch);
    if (appliedFilter?.mode === "carrier") {
      return rawResults.filter((c) => {
        return (
          normalizeText(c.razaoSocial).includes(query) ||
          normalizeText(c.nomeFantasia).includes(query) ||
          c.cnpj.includes(query) ||
          normalizeText(c.cidade).includes(query) ||
          normalizeText(c.uf).includes(query) ||
          normalizeText(c.plano).includes(query)
        );
      });
    } else {
      return rawResults.filter((t) => {
        return (
          normalizeText(t.nome).includes(query) ||
          t.cnpj.includes(query) ||
          normalizeText(t.modalidade).includes(query) ||
          normalizeText(t.contato).includes(query)
        );
      });
    }
  }, [rawResults, tableSearch, appliedFilter]);

  // Exportação para Excel (Gera arquivo .xlsx/.csv formatado com BOM UTF-8)
  function handleExportExcel() {
    if (!appliedFilter || filteredResults.length === 0) {
      showToast("Não há registros para exportar.", "warning");
      return;
    }

    try {
      let csvContent = "";
      const isCarrierMode = appliedFilter.mode === "carrier";
      const entityName = isCarrierMode
        ? appliedFilter.target.nome
        : appliedFilter.target.nomeFantasia || appliedFilter.target.razaoSocial;

      if (isCarrierMode) {
        csvContent += `Relatório de Vínculos: Clientes por Transportadora\r\n`;
        csvContent += `Transportadora Selecionada:;${appliedFilter.target.nome}\r\n`;
        csvContent += `CNPJ Transportadora:;${appliedFilter.target.cnpj}\r\n`;
        csvContent += `Total de Clientes Vinculados:;${filteredResults.length}\r\n`;
        csvContent += `Data de Emissão:;${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}\r\n\r\n`;

        csvContent += `Cliente / Razão Social;Nome Fantasia;CNPJ;Cidade/UF;Status;Plano;Conta Frete;Contato Principal;E-mail\r\n`;
        filteredResults.forEach((c) => {
          const contato = c.contatos?.[0] || {};
          const cidadeUf = `${c.cidade || "N/D"}/${c.uf || ""}`;
          csvContent += `"${c.razaoSocial}";"${c.nomeFantasia}";"${c.cnpj}";"${cidadeUf}";"${c.status}";"${c.plano}";"${c.contaFrete || ""}";"${contato.nome || ""}";"${contato.email || c.adminEmail || ""}"\r\n`;
        });
      } else {
        csvContent += `Relatório de Vínculos: Transportadoras por Cliente\r\n`;
        csvContent += `Cliente Selecionado:;${appliedFilter.target.razaoSocial} (${appliedFilter.target.nomeFantasia})\r\n`;
        csvContent += `CNPJ Cliente:;${appliedFilter.target.cnpj}\r\n`;
        csvContent += `Plano:;${appliedFilter.target.plano}\r\n`;
        csvContent += `Total de Transportadoras Vinculadas:;${filteredResults.length}\r\n`;
        csvContent += `Data de Emissão:;${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}\r\n\r\n`;

        csvContent += `Transportadora;CNPJ;Modalidade / Tipo;Status;E-mail Operacional;Telefone\r\n`;
        filteredResults.forEach((t) => {
          csvContent += `"${t.nome}";"${t.cnpj}";"${t.modalidade || "Rodoviário"}";"${t.ativo ? "Ativa" : "Inativa"}";"${t.contato || ""}";"${t.telefone || ""}"\r\n`;
        });
      }

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const safeEntityName = normalizeText(entityName).replace(/[^a-z0-9]/g, "_");
      const filename = `relatorio_vinculos_${appliedFilter.mode}_${safeEntityName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Planilha "${filename}" exportada com sucesso!`, "success");
    } catch (err) {
      console.error("Erro ao exportar:", err);
      showToast("Falha ao gerar arquivo de exportação.", "warning");
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F4F6F9" }}>
      {/* Toast Notification Flutuante */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border transition-all bg-white"
          style={{ borderColor: "#E2E8F0" }}
        >
          {toastMessage.type === "success" && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: "#10B981" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
          {toastMessage.type === "warning" && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: "#F59E0B" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          )}
          {toastMessage.type === "info" && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: "#0066CC" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
          )}
          <div>
            <div className="text-xs font-semibold" style={{ color: "#1E293B" }}>
              {toastMessage.type === "success" ? "Exportação Concluída" : "Aviso do Sistema"}
            </div>
            <div className="text-xs" style={{ color: "#64748B" }}>
              {toastMessage.text}
            </div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Header da Tela */}
      <div className="px-6 py-4 border-b bg-white flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0"
              style={{ background: "#0066CC" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                  Relatório de Vínculos: Clientes e Transportadoras
                </h1>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ background: "#EBF4FF", color: "#0066CC" }}
                >
                  Cruzamento de Dados
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                Exibe a relação cruzada entre clientes e transportadoras cadastradas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Área com Scroll */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Card de Filtros de Pesquisa */}
        <div
          className="bg-white rounded-xl border p-5 shadow-xs transition-all"
          style={{ borderColor: "#E2E8F0" }}
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: "#F1F5F9" }}>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <h2 className="text-sm font-bold" style={{ color: "#1E293B" }}>
                Parâmetros de Consulta
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Selecione o modo e informe o registro desejado
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
            {/* Modo de Consulta (Toggle/Tabs) */}
            <div className="lg:col-span-4">
              <label className="text-xs font-semibold block mb-2" style={{ color: "#475569" }}>
                Modo de Consulta
              </label>
              <div
                className="p-1 rounded-xl flex items-center border"
                style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}
              >
                <button
                  type="button"
                  onClick={() => handleModeChange("carrier")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    queryMode === "carrier"
                      ? "bg-white text-[#0066CC] shadow-xs border border-[#E2E8F0]"
                      : "text-[#64748B] hover:text-[#1E293B]"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
                    <rect width="9" height="11" x="12" y="6" rx="1" />
                    <circle cx="17" cy="20" r="1" />
                    <circle cx="7" cy="20" r="1" />
                  </svg>
                  <span>Por Transportadora</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange("client")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    queryMode === "client"
                      ? "bg-white text-[#0066CC] shadow-xs border border-[#E2E8F0]"
                      : "text-[#64748B] hover:text-[#1E293B]"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                    <path d="M9 22v-4h6v4" />
                    <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M8 10h.01M16 10h.01" />
                  </svg>
                  <span>Por Cliente</span>
                </button>
              </div>
            </div>

            {/* Campo de Seleção com Busca (Autocomplete) */}
            <div className="lg:col-span-5">
              <label className="text-xs font-semibold block mb-2" style={{ color: "#475569" }}>
                {queryMode === "carrier"
                  ? "Selecionar Transportadora"
                  : "Selecionar Cliente"}
              </label>

              {queryMode === "carrier" ? (
                <CarrierAutocomplete
                  options={TRANSPORTADORAS}
                  selected={selectedCarrier}
                  onSelect={(item) => setSelectedCarrier(item)}
                  clientsList={CLIENTES}
                />
              ) : (
                <ClientAutocomplete
                  options={CLIENTES}
                  selected={selectedClient}
                  onSelect={(item) => setSelectedClient(item)}
                  carriersList={TRANSPORTADORAS}
                />
              )}
            </div>

            {/* Botões de Ação (Filtrar e Limpar) */}
            <div className="lg:col-span-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyFilter}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
                style={{ background: "#0066CC" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0054a8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0066CC";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span>Filtrar</span>
              </button>

              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer hover:bg-[#F8FAFC]"
                style={{ borderColor: "#E2E8F0", color: "#64748B" }}
                title="Limpar filtros aplicados"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Limpar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Banner com Detalhes do Registro Selecionado (quando filtrado) */}
        {appliedFilter && (
          <div
            className="bg-white rounded-xl border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-xs flex-shrink-0"
                style={{ background: "#0B2847" }}
              >
                {appliedFilter.mode === "carrier"
                  ? appliedFilter.target.nome.slice(0, 2).toUpperCase()
                  : appliedFilter.target.nomeFantasia?.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0066CC]">
                    {appliedFilter.mode === "carrier" ? "Transportadora em Análise:" : "Cliente em Análise:"}
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={
                      (appliedFilter.mode === "carrier" ? appliedFilter.target.ativo : appliedFilter.target.status === "Ativo")
                        ? { background: "#ECFDF5", color: "#10B981" }
                        : { background: "#FFF1F2", color: "#E11D48" }
                    }
                  >
                    {(appliedFilter.mode === "carrier" ? appliedFilter.target.ativo : appliedFilter.target.status === "Ativo")
                      ? "Ativo no Sistema"
                      : "Inativo"}
                  </span>
                  {appliedFilter.mode === "client" && appliedFilter.target.plano && (
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                      style={{
                        background: PLAN_COLORS[appliedFilter.target.plano]?.bg || "#F1F5F9",
                        color: PLAN_COLORS[appliedFilter.target.plano]?.color || "#64748B",
                        borderColor: PLAN_COLORS[appliedFilter.target.plano]?.border || "#E2E8F0",
                      }}
                    >
                      Plano {appliedFilter.target.plano}
                    </span>
                  )}
                </div>

                <div className="text-base font-bold mt-0.5" style={{ color: "#1E293B" }}>
                  {appliedFilter.mode === "carrier"
                    ? appliedFilter.target.nome
                    : `${appliedFilter.target.razaoSocial} (${appliedFilter.target.nomeFantasia})`}
                </div>

                <div className="text-xs text-[#64748B] flex items-center gap-3 mt-1 flex-wrap font-mono">
                  <span>CNPJ: {appliedFilter.target.cnpj}</span>
                  {appliedFilter.mode === "carrier" ? (
                    <>
                      <span>·</span>
                      <span className="font-sans">Modalidade: {appliedFilter.target.modalidade || "Geral"}</span>
                      <span>·</span>
                      <span className="font-sans">Contato: {appliedFilter.target.contato}</span>
                    </>
                  ) : (
                    <>
                      <span>·</span>
                      <span className="font-sans">
                        Cidade: {appliedFilter.target.cidade}/{appliedFilter.target.uf}
                      </span>
                      <span>·</span>
                      <span className="font-sans">Conta Frete: {appliedFilter.target.contaFrete}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Badge Contador Destacado */}
            <div
              className="px-4 py-3 rounded-xl border flex items-center gap-3 self-start md:self-auto"
              style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                style={{ background: "#F26522" }}
              >
                {rawResults.length}
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  Total Vinculado
                </div>
                <div className="text-xs font-bold text-[#1E293B]">
                  {appliedFilter.mode === "carrier"
                    ? `${rawResults.length} ${rawResults.length === 1 ? "cliente atendido" : "clientes vinculados"}`
                    : `${rawResults.length} ${rawResults.length === 1 ? "transportadora ativa" : "transportadoras vinculadas"}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Resultados (Grid) */}
        <div
          className="bg-white rounded-xl border overflow-hidden shadow-xs"
          style={{ borderColor: "#E2E8F0" }}
        >
          {/* Barra Superior da Tabela */}
          <div
            className="px-5 py-3.5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#F8FAFC]"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold" style={{ color: "#1E293B" }}>
                {appliedFilter?.mode === "carrier"
                  ? "Clientes Vinculados à Transportadora"
                  : appliedFilter?.mode === "client"
                  ? "Transportadoras Vinculadas ao Cliente"
                  : "Registros de Vínculo"}
              </h3>

              {appliedFilter && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                  style={{ background: "#EBF4FF", color: "#0066CC", borderColor: "#BFDBFE" }}
                >
                  {filteredResults.length}{" "}
                  {appliedFilter.mode === "carrier"
                    ? filteredResults.length === 1
                      ? "cliente"
                      : "clientes vinculados"
                    : filteredResults.length === 1
                    ? "transportadora"
                    : "transportadoras vinculadas"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Campo de busca rápida dentro dos resultados da tabela */}
              {appliedFilter && rawResults.length > 0 && (
                <div className="relative flex-1 sm:w-60">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Filtrar nesta lista..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border outline-none bg-white transition-all"
                    style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0066CC";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E2E8F0";
                    }}
                  />
                  {tableSearch && (
                    <button
                      onClick={() => setTableSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Botão de Exportação para Excel (.xlsx) */}
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={!appliedFilter || filteredResults.length === 0}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                  appliedFilter && filteredResults.length > 0
                    ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] hover:bg-[#D1FAE5] hover:border-[#6EE7B7]"
                    : "bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0] cursor-not-allowed opacity-60"
                }`}
                title={
                  appliedFilter && filteredResults.length > 0
                    ? "Exportar relatório da consulta para planilha Excel (.xlsx)"
                    : "Realize uma consulta para habilitar a exportação"
                }
              >
                {/* Ícone de Planilha / Download */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>Exportar para Excel</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ${
                    appliedFilter && filteredResults.length > 0
                      ? "bg-[#10B981] text-white"
                      : "bg-[#CBD5E1] text-[#64748B]"
                  }`}
                >
                  .xlsx
                </span>
              </button>
            </div>
          </div>

          {/* Renderização da Tabela Conforme Modo Selecionado */}
          {!appliedFilter ? (
            /* Estado Inicial: Nenhum filtro aplicado */
            <div className="p-12 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "#EBF4FF", color: "#0066CC" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <h4 className="text-base font-bold" style={{ color: "#1E293B" }}>
                Selecione os parâmetros e clique em "Filtrar"
              </h4>
              <p className="text-xs max-w-md mx-auto mt-1.5" style={{ color: "#64748B" }}>
                Escolha o modo de consulta (Por Transportadora ou Por Cliente), pesquise a entidade desejada no campo de busca acima e visualize os vínculos correspondentes.
              </p>

              {/* Atalhos rápidos para testar a tela */}
              <div className="mt-6 pt-5 border-t max-w-lg mx-auto" style={{ borderColor: "#F1F5F9" }}>
                <span className="text-[11px] font-semibold uppercase tracking-wider block mb-2.5" style={{ color: "#94A3B8" }}>
                  Ou explore consultas rápidas de exemplo:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect("carrier", TRANSPORTADORAS[0])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                    style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  >
                    🚚 Sequóia Logística
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect("carrier", TRANSPORTADORAS[2])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                    style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  >
                    🚚 Jadlog Logística
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect("client", CLIENTES[0])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                    style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  >
                    🏢 Móveis Florense
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect("client", CLIENTES[1])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                    style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                  >
                    🏢 Balaroti
                  </button>
                </div>
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            /* Estado Vazio: Nenhum registro encontrado para o filtro */
            <div className="p-12 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "#FFF1E8", color: "#F26522" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h4 className="text-sm font-bold" style={{ color: "#1E293B" }}>
                Nenhum vínculo encontrado
              </h4>
              <p className="text-xs max-w-sm mx-auto mt-1" style={{ color: "#64748B" }}>
                {tableSearch
                  ? `Nenhum resultado corresponde à busca "${tableSearch}".`
                  : `Não foram encontrados registros associados a este ${
                      appliedFilter.mode === "carrier" ? "transportador" : "cliente"
                    }.`}
              </p>
              {tableSearch ? (
                <button
                  onClick={() => setTableSearch("")}
                  className="mt-3 text-xs font-semibold text-[#0066CC] hover:underline cursor-pointer"
                >
                  Limpar busca interna
                </button>
              ) : (
                <button
                  onClick={handleClearFilters}
                  className="mt-3 text-xs font-semibold text-[#0066CC] hover:underline cursor-pointer"
                >
                  Modificar parâmetros de filtro
                </button>
              )}
            </div>
          ) : appliedFilter.mode === "carrier" ? (
            /* ============================================================ */
            /* VISÃO POR TRANSPORTADORA                                     */
            /* Colunas: Cliente, CNPJ, Cidade/UF, Status, Plano/Conta, Contato */
            /* ============================================================ */
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr
                    className="border-b text-xs font-semibold uppercase tracking-wider"
                    style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#64748B" }}
                  >
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">CNPJ</th>
                    <th className="px-5 py-3">Cidade / UF</th>
                    <th className="px-5 py-3">Status do Cliente</th>
                    <th className="px-5 py-3">Plano / Conta Frete</th>
                    <th className="px-5 py-3">Contato Principal</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#E2E8F0" }}>
                  {filteredResults.map((c) => {
                    const contato = c.contatos?.[0] || {
                      nome: "Não informado",
                      email: c.adminEmail || "contato@empresa.com.br",
                    };
                    const planStyle = PLAN_COLORS[c.plano] || {
                      bg: "#F1F5F9",
                      color: "#64748B",
                      border: "#E2E8F0",
                    };

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-[#F8FAFC] transition-colors"
                        style={{ color: "#1E293B" }}
                      >
                        {/* Cliente */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: "#0B2847" }}
                            >
                              {(c.nomeFantasia || c.razaoSocial).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-xs leading-tight" style={{ color: "#1E293B" }}>
                                {c.razaoSocial}
                              </div>
                              <div className="text-[11px] mt-0.5" style={{ color: "#64748B" }}>
                                {c.nomeFantasia} · {c.dominio || "—"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CNPJ */}
                        <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "#334155" }}>
                          {c.cnpj}
                        </td>

                        {/* Cidade / UF */}
                        <td className="px-5 py-3.5 text-xs">
                          <div className="flex items-center gap-1.5 font-medium" style={{ color: "#1E293B" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>
                              {c.cidade || "Flores da Cunha"}{c.uf ? ` / ${c.uf}` : " / RS"}
                            </span>
                          </div>
                        </td>

                        {/* Status do Cliente */}
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={
                              c.status === "Ativo"
                                ? { background: "#ECFDF5", color: "#10B981" }
                                : { background: "#F1F5F9", color: "#64748B" }
                            }
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: c.status === "Ativo" ? "#10B981" : "#94A3B8" }}
                            />
                            {c.status}
                          </span>
                        </td>

                        {/* Plano / Conta Frete */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] font-semibold px-2 py-0.5 rounded border"
                              style={{
                                background: planStyle.bg,
                                color: planStyle.color,
                                borderColor: planStyle.border,
                              }}
                            >
                              {c.plano}
                            </span>
                            <span className="text-xs font-semibold" style={{ color: "#1E293B" }}>
                              {c.contaFrete || "R$ 0,00"}
                            </span>
                          </div>
                        </td>

                        {/* Contato Principal */}
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-medium" style={{ color: "#1E293B" }}>
                            {contato.nome}
                          </div>
                          <a
                            href={`mailto:${contato.email}`}
                            className="text-[11px] text-[#0066CC] hover:underline block truncate max-w-[200px]"
                            title={`Enviar e-mail para ${contato.email}`}
                          >
                            {contato.email}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ============================================================ */
            /* VISÃO POR CLIENTE                                            */
            /* Colunas: Transportadora, CNPJ, Modalidade/Tipo, Status, Contato */
            /* ============================================================ */
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr
                    className="border-b text-xs font-semibold uppercase tracking-wider"
                    style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#64748B" }}
                  >
                    <th className="px-5 py-3">Transportadora</th>
                    <th className="px-5 py-3">CNPJ</th>
                    <th className="px-5 py-3">Modalidade / Tipo</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Contato Operacional</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#E2E8F0" }}>
                  {filteredResults.map((t, idx) => {
                    return (
                      <tr
                        key={t.id || idx}
                        className="hover:bg-[#F8FAFC] transition-colors"
                        style={{ color: "#1E293B" }}
                      >
                        {/* Transportadora */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: "#0B2847" }}
                            >
                              {(t.nome || "TR").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-xs leading-tight" style={{ color: "#1E293B" }}>
                                {t.nome}
                              </div>
                              <div className="text-[11px] mt-0.5 text-slate-400">
                                Parceiro Homologado
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CNPJ */}
                        <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "#334155" }}>
                          {t.cnpj}
                        </td>

                        {/* Modalidade / Tipo */}
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border"
                            style={{ background: "#F8FAFC", borderColor: "#E2E8F0", color: "#334155" }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2">
                              <rect width="16" height="13" x="4" y="5" rx="2" />
                              <circle cx="8" cy="18" r="2" />
                              <circle cx="16" cy="18" r="2" />
                            </svg>
                            <span>{t.modalidade || "Rodoviário Padrão"}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={
                              t.ativo
                                ? { background: "#ECFDF5", color: "#10B981" }
                                : { background: "#FFF1F2", color: "#E11D48" }
                            }
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: t.ativo ? "#10B981" : "#E11D48" }}
                            />
                            {t.ativo ? "Ativa" : "Inativa"}
                          </span>
                        </td>

                        {/* Contato Operacional */}
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-medium text-[#1E293B]">
                            {t.contato || "—"}
                          </div>
                          {t.telefone && (
                            <div className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5 font-mono">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                              {t.telefone}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé da tabela com sumário */}
          {appliedFilter && filteredResults.length > 0 && (
            <div
              className="px-5 py-3 border-t bg-[#F8FAFC] flex items-center justify-between text-xs"
              style={{ borderColor: "#E2E8F0", color: "#64748B" }}
            >
              <div>
                Exibindo <strong>{filteredResults.length}</strong> de{" "}
                <strong>{rawResults.length}</strong> vínculos encontrados.
              </div>
              <div className="text-[11px]">
                Base de dados atualizada · Frete Gestão TMS
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente Autocomplete com busca para Transportadoras
function CarrierAutocomplete({ options = [], selected, onSelect, clientsList = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((item) => {
    if (!query.trim()) return true;
    const q = normalizeText(query);
    return normalizeText(item.nome).includes(q) || item.cnpj.includes(q);
  });

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative flex items-center">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        <input
          type="text"
          value={selected ? selected.nome : query}
          onChange={(e) => {
            if (selected) onSelect(null);
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (selected) {
              setQuery("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
            if (e.key === "Enter" && filtered.length > 0) {
              e.preventDefault();
              onSelect(filtered[0]);
              setIsOpen(false);
            }
          }}
          placeholder="Pesquise por nome da transportadora ou CNPJ..."
          className="w-full text-xs pl-9 pr-14 py-2 rounded-lg border outline-none bg-white transition-all font-medium"
          style={{
            borderColor: selected ? "#0066CC" : "#E2E8F0",
            color: "#1E293B",
          }}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selected && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
                setQuery("");
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              title="Limpar seleção"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border rounded-xl shadow-xl max-h-64 overflow-y-auto"
          style={{ borderColor: "#E2E8F0" }}
        >
          <div
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b bg-[#F8FAFC] flex justify-between"
            style={{ color: "#64748B", borderColor: "#F1F5F9" }}
          >
            <span>Transportadoras Homologadas ({filtered.length})</span>
            <span>Clientes Vinculados</span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-4 text-xs text-center text-slate-400">
              Nenhuma transportadora encontrada com "{query}"
            </div>
          ) : (
            <div className="py-1 divide-y divide-slate-100">
              {filtered.map((t) => {
                const countClients = getClientsForCarrier(t, clientsList).length;
                const isCurrent = selected?.id === t.id;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onSelect(t);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                      isCurrent ? "bg-[#EBF4FF]" : "hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: "#0B2847" }}
                      >
                        {t.nome.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: "#1E293B" }}>
                          {t.nome}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {t.cnpj} · {t.modalidade || "Rodoviário"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#F1F5F9", color: "#475569" }}
                      >
                        {countClients} {countClients === 1 ? "cliente" : "clientes"}
                      </span>
                      {isCurrent && (
                        <span className="text-[#0066CC] font-bold">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Componente Autocomplete com busca para Clientes
function ClientAutocomplete({ options = [], selected, onSelect, carriersList = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((c) => {
    if (!query.trim()) return true;
    const q = normalizeText(query);
    return (
      normalizeText(c.razaoSocial).includes(q) ||
      normalizeText(c.nomeFantasia).includes(q) ||
      c.cnpj.includes(q)
    );
  });

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative flex items-center">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        <input
          type="text"
          value={selected ? `${selected.razaoSocial} (${selected.nomeFantasia})` : query}
          onChange={(e) => {
            if (selected) onSelect(null);
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (selected) {
              setQuery("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
            if (e.key === "Enter" && filtered.length > 0) {
              e.preventDefault();
              onSelect(filtered[0]);
              setIsOpen(false);
            }
          }}
          placeholder="Pesquise por razão social, nome fantasia ou CNPJ..."
          className="w-full text-xs pl-9 pr-14 py-2 rounded-lg border outline-none bg-white transition-all font-medium"
          style={{
            borderColor: selected ? "#0066CC" : "#E2E8F0",
            color: "#1E293B",
          }}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selected && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
                setQuery("");
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              title="Limpar seleção"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border rounded-xl shadow-xl max-h-64 overflow-y-auto"
          style={{ borderColor: "#E2E8F0" }}
        >
          <div
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b bg-[#F8FAFC] flex justify-between"
            style={{ color: "#64748B", borderColor: "#F1F5F9" }}
          >
            <span>Clientes Cadastrados ({filtered.length})</span>
            <span>Transportadoras</span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-4 text-xs text-center text-slate-400">
              Nenhum cliente encontrado com "{query}"
            </div>
          ) : (
            <div className="py-1 divide-y divide-slate-100">
              {filtered.map((c) => {
                const countCarriers = (c.transportadoras || []).length;
                const isCurrent = selected?.id === c.id;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                      isCurrent ? "bg-[#EBF4FF]" : "hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: "#0B2847" }}
                      >
                        {c.nomeFantasia.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: "#1E293B" }}>
                          {c.razaoSocial}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {c.nomeFantasia} · CNPJ: {c.cnpj}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#F1F5F9", color: "#475569" }}
                      >
                        {countCarriers} {countCarriers === 1 ? "transp." : "transp."}
                      </span>
                      {isCurrent && (
                        <span className="text-[#0066CC] font-bold">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
