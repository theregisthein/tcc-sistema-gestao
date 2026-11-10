import { useState, useRef, useEffect, useMemo } from "react";

const BASE_URL = "http://localhost:8000/api";

const PLAN_COLORS = {
  Enterprise: { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
  Profissional: { bg: "#EBF4FF", color: "#0066CC", border: "#BFDBFE" },
  Starter: { bg: "#ECFDF5", color: "#10B981", border: "#A7F3D0" },
};

function normalizeText(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function Relatorios() {
  const [queryMode, setQueryMode] = useState("carrier");
  const [auxiliares, setAuxiliares] = useState({ clientes: [], transportadoras: [] });
  const [carregandoAux, setCarregandoAux] = useState(true);
  const [carregandoBusca, setCarregandoBusca] = useState(false);

  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const [appliedFilter, setAppliedFilter] = useState(null);
  const [rawResults, setRawResults] = useState([]);
  const [tableSearch, setTableSearch] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    async function carregarAuxiliares() {
      try {
        setCarregandoAux(true);
        const res = await fetch(`${BASE_URL}/relatorios/auxiliares`);
        if (res.ok) {
          const dados = await res.json();
          setAuxiliares(dados);
        }
      } catch (err) {
        console.error("Erro ao carregar dados auxiliares:", err);
      } finally {
        setCarregandoAux(false);
      }
    }
    carregarAuxiliares();
  }, []);

  function handleModeChange(mode) {
    if (mode === queryMode) return;
    setQueryMode(mode);
    setTableSearch("");
    setAppliedFilter(null);
    setRawResults([]);
    setSelectedCarrier(null);
    setSelectedClient(null);
  }

  async function handleApplyFilter() {
    const isCarrier = queryMode === "carrier";
    const target = isCarrier ? selectedCarrier : selectedClient;

    if (!target) {
      showToast(`Selecione um(a) ${isCarrier ? "transportadora" : "cliente"} para filtrar.`, "warning");
      return;
    }

    try {
      setCarregandoBusca(true);
      const res = await fetch(`${BASE_URL}/relatorios/vinculos?mode=${queryMode}&id=${target.id}`);
      if (!res.ok) throw new Error("Erro ao consultar vínculos.");

      const dados = await res.json();
      setAppliedFilter({
        mode: queryMode,
        target: dados.target,
      });
      setRawResults(dados.results || []);
      setTableSearch("");
    } catch (err) {
      console.error(err);
      showToast("Falha ao buscar vínculos no servidor.", "warning");
    } finally {
      setCarregandoBusca(false);
    }
  }

  function handleClearFilters() {
    setSelectedCarrier(null);
    setSelectedClient(null);
    setAppliedFilter(null);
    setRawResults([]);
    setTableSearch("");
    showToast("Filtros limpos com sucesso.", "info");
  }

  function showToast(text, type = "success") {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }

  const filteredResults = useMemo(() => {
    if (!tableSearch.trim()) return rawResults;
    const q = normalizeText(tableSearch);
    if (appliedFilter?.mode === "carrier") {
      return rawResults.filter((c) =>
        normalizeText(c.razaoSocial).includes(q) ||
        normalizeText(c.nomeFantasia).includes(q) ||
        (c.cnpj && c.cnpj.includes(q)) ||
        normalizeText(c.cidade).includes(q)
      );
    } else {
      return rawResults.filter((t) =>
        normalizeText(t.nome).includes(q) ||
        (t.cnpj && t.cnpj.includes(q)) ||
        normalizeText(t.contato).includes(q)
      );
    }
  }, [rawResults, tableSearch, appliedFilter]);

  function handleExportExcel() {
    if (!appliedFilter || filteredResults.length === 0) {
      showToast("Não há registros para exportar.", "warning");
      return;
    }

    try {
      let csvContent = "";
      const isCarrierMode = appliedFilter.mode === "carrier";
      const entityName = isCarrierMode ? appliedFilter.target.nome : appliedFilter.target.nomeFantasia;

      if (isCarrierMode) {
        csvContent += `Relatório de Vínculos: Clientes por Transportadora\r\n`;
        csvContent += `Transportadora:;${appliedFilter.target.nome}\r\n`;
        csvContent += `CNPJ:;${appliedFilter.target.cnpj}\r\n`;
        csvContent += `Total:;${filteredResults.length}\r\n\r\n`;
        csvContent += `Razão Social;Nome Fantasia;CNPJ;Cidade/UF;Status;Plano;Conta Frete;Contato;Email\r\n`;
        filteredResults.forEach((c) => {
          const contato = c.contatos?.[0] || {};
          csvContent += `"${c.razaoSocial}";"${c.nomeFantasia}";"${c.cnpj}";"${c.cidade}/${c.uf}";"${c.status}";"${c.plano}";"${c.contaFrete}";"${contato.nome || ""}";"${contato.email || ""}"\r\n`;
        });
      } else {
        csvContent += `Relatório de Vínculos: Transportadoras por Cliente\r\n`;
        csvContent += `Cliente:;${appliedFilter.target.nomeFantasia}\r\n`;
        csvContent += `CNPJ:;${appliedFilter.target.cnpj}\r\n`;
        csvContent += `Total:;${filteredResults.length}\r\n\r\n`;
        csvContent += `Transportadora;CNPJ;Modalidade;Status;Email\r\n`;
        filteredResults.forEach((t) => {
          csvContent += `"${t.nome}";"${t.cnpj}";"${t.modalidade}";"${t.ativo ? "Ativa" : "Inativa"}";"${t.contato || ""}"\r\n`;
        });
      }

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const filename = `relatorio_${appliedFilter.mode}_${new Date().toISOString().slice(0, 10)}.csv`;

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Relatório exportado com sucesso!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Erro ao exportar planilha.", "warning");
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F4F6F9" }}>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border bg-white" style={{ borderColor: "#E2E8F0" }}>
          <div>
            <div className="text-xs font-semibold" style={{ color: "#1E293B" }}>
              {toastMessage.type === "success" ? "Sucesso" : "Aviso"}
            </div>
            <div className="text-xs" style={{ color: "#64748B" }}>{toastMessage.text}</div>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 border-b bg-white flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0" style={{ background: "#0066CC" }}>
            📊
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>Relatório de Vínculos: Clientes e Transportadoras</h1>
            <p className="text-xs" style={{ color: "#64748B" }}>Exibe a relação cruzada direta do banco de dados.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Filtros */}
        <div className="bg-white rounded-xl border p-5 shadow-xs" style={{ borderColor: "#E2E8F0" }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
            <div className="lg:col-span-4">
              <label className="text-xs font-semibold block mb-2 text-slate-700">Modo de Consulta</label>
              <div className="p-1 rounded-xl flex items-center border bg-slate-50" style={{ borderColor: "#E2E8F0" }}>
                <button
                  type="button"
                  onClick={() => handleModeChange("carrier")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    queryMode === "carrier" ? "bg-white text-[#0066CC] shadow-xs border" : "text-slate-500"
                  }`}
                  style={{ borderColor: queryMode === "carrier" ? "#E2E8F0" : "transparent" }}
                >
                  Por Transportadora
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("client")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    queryMode === "client" ? "bg-white text-[#0066CC] shadow-xs border" : "text-slate-500"
                  }`}
                  style={{ borderColor: queryMode === "client" ? "#E2E8F0" : "transparent" }}
                >
                  Por Cliente
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <label className="text-xs font-semibold block mb-2 text-slate-700">
                {queryMode === "carrier" ? "Selecionar Transportadora" : "Selecionar Cliente"}
              </label>
              {queryMode === "carrier" ? (
                <CarrierAutocomplete
                  options={auxiliares.transportadoras}
                  selected={selectedCarrier}
                  onSelect={setSelectedCarrier}
                  disabled={carregandoAux}
                />
              ) : (
                <ClientAutocomplete
                  options={auxiliares.clientes}
                  selected={selectedClient}
                  onSelect={setSelectedClient}
                  disabled={carregandoAux}
                />
              )}
            </div>

            <div className="lg:col-span-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyFilter}
                disabled={carregandoBusca}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
                style={{ background: "#0066CC" }}
              >
                {carregandoBusca ? "Buscando..." : "Filtrar"}
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3.5 py-2.5 rounded-lg text-xs font-medium border text-slate-500 hover:bg-slate-50 cursor-pointer"
                style={{ borderColor: "#E2E8F0" }}
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Banner do Registro Filtrado */}
        {appliedFilter && (
          <div className="bg-white rounded-xl border p-4 shadow-xs flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: "#0B2847" }}>
                {(appliedFilter.target.nome || appliedFilter.target.nomeFantasia).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-bold text-[#0066CC] uppercase">
                  {appliedFilter.mode === "carrier" ? "Transportadora Selecionada" : "Cliente Selecionado"}
                </span>
                <div className="text-sm font-bold text-slate-800">
                  {appliedFilter.target.nome || appliedFilter.target.nomeFantasia}
                </div>
                <div className="text-xs text-slate-400 font-mono">CNPJ: {appliedFilter.target.cnpj}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase font-bold text-slate-400">Total Vinculado</div>
              <div className="text-sm font-bold text-slate-800">{rawResults.length} registro(s)</div>
            </div>
          </div>
        )}

        {/* Tabela de Resultados */}
        <div className="bg-white rounded-xl border overflow-hidden shadow-xs" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-3 border-b flex items-center justify-between bg-slate-50" style={{ borderColor: "#E2E8F0" }}>
            <span className="text-sm font-bold text-slate-800">Registros de Vínculo</span>
            <div className="flex items-center gap-3">
              {appliedFilter && rawResults.length > 0 && (
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filtrar nesta lista..."
                  className="text-xs px-3 py-1.5 rounded-lg border bg-white outline-none"
                  style={{ borderColor: "#E2E8F0" }}
                />
              )}
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={!appliedFilter || filteredResults.length === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 disabled:opacity-40 cursor-pointer"
              >
                Exportar CSV
              </button>
            </div>
          </div>

          {!appliedFilter ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Selecione os parâmetros acima e clique em "Filtrar" para carregar os vínculos do banco de dados.
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Nenhum vínculo registrado no banco para este filtro.
            </div>
          ) : appliedFilter.mode === "carrier" ? (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
                <tr>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">CNPJ</th>
                  <th className="px-5 py-3">Cidade/UF</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Plano</th>
                  <th className="px-5 py-3">Contato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredResults.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-bold">{c.nomeFantasia}</td>
                    <td className="px-5 py-3.5 font-mono">{c.cnpj}</td>
                    <td className="px-5 py-3.5">{c.cidade} / {c.uf}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">{c.plano}</td>
                    <td className="px-5 py-3.5">{c.contatos?.[0]?.email || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
                <tr>
                  <th className="px-5 py-3">Transportadora</th>
                  <th className="px-5 py-3">CNPJ</th>
                  <th className="px-5 py-3">Modalidade</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Contato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredResults.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-bold">{t.nome}</td>
                    <td className="px-5 py-3.5 font-mono">{t.cnpj}</td>
                    <td className="px-5 py-3.5">{t.modalidade}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.ativo ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {t.ativo ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">{t.contato || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function CarrierAutocomplete({ options = [], selected, onSelect, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((item) => {
    if (!query.trim()) return true;
    const q = normalizeText(query);
    return normalizeText(item.nome).includes(q) || (item.cnpj && item.cnpj.includes(q));
  });

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        disabled={disabled}
        value={selected ? selected.nome : query}
        onChange={(e) => {
          if (selected) onSelect(null);
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={disabled ? "Carregando..." : "Pesquise por transportadora ou CNPJ..."}
        className="w-full text-xs px-3 py-2 rounded-lg border outline-none bg-white font-medium"
        style={{ borderColor: selected ? "#0066CC" : "#E2E8F0" }}
      />
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border rounded-xl shadow-xl max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-slate-400 text-center">Nenhum registro encontrado.</div>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelect(t);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between border-b last:border-b-0 cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-800">{t.nome}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{t.cnpj}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                  {t.totalClientes || 0} cliente(s)
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ClientAutocomplete({ options = [], selected, onSelect, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((c) => {
    if (!query.trim()) return true;
    const q = normalizeText(query);
    return normalizeText(c.nomeFantasia).includes(q) || (c.cnpj && c.cnpj.includes(q));
  });

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        disabled={disabled}
        value={selected ? selected.nomeFantasia : query}
        onChange={(e) => {
          if (selected) onSelect(null);
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={disabled ? "Carregando..." : "Pesquise por cliente ou CNPJ..."}
        className="w-full text-xs px-3 py-2 rounded-lg border outline-none bg-white font-medium"
        style={{ borderColor: selected ? "#0066CC" : "#E2E8F0" }}
      />
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border rounded-xl shadow-xl max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-slate-400 text-center">Nenhum registro encontrado.</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelect(c);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between border-b last:border-b-0 cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-800">{c.nomeFantasia}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{c.cnpj}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                  {c.totalTransp || 0} transp.
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}