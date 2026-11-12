//Este arquivo contém as funções de formatação (maskCNPJ, formatMoneyBRL, etc.)
 //e as abas compartilhadas (EmpresasSection, ModulosSelector, TransportadorasSelector, ContatosSection, AnexosSection)
 // assim evitando duplicacao de codigo


import React, { useState, useRef, useEffect } from "react";

export const BASE_URL = "http://localhost:8000/api";

export function maskCNPJ(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function formatMoneyBRL(value) {
  if (value === null || value === undefined || value === "") return "R$ 0,00";
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "R$ 0,00";
  return (Number(digits) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function parseMoneyToFloat(value) {
  if (typeof value === "number") return value;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

export function FormField({ label, value, onChange, placeholder, type = "text", required = false }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all"
        style={{ borderColor: "#E2E8F0", color: "#1E293B", background: "#fff" }}
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
  );
}

export function MoneyField({ label, value, onChange, placeholder = "R$ 0,00", required = false }) {
  const displayValue = formatMoneyBRL(value);

  function handleChange(e) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      onChange("R$ 0,00");
      return;
    }
    onChange((Number(raw) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  }

  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full text-sm font-semibold border rounded-lg px-3 py-2 outline-none transition-all"
        style={{ borderColor: "#E2E8F0", color: "#1E293B", background: "#fff" }}
      />
    </div>
  );
}

export function EmpresasSection({
  clienteId,
  empresas = [],
  onChange,
  onPersistAdd,
  onPersistUpdate,
  onPersistDelete,
  onPersistSetMatriz,
}) {
  const [novoCnpj, setNovoCnpj] = useState("");
  const [novaRazao, setNovaRazao] = useState("");
  const [novoFantasia, setNovoFantasia] = useState("");
  const [novaIsMatriz, setNovaIsMatriz] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [empresaEmEdicao, setEmpresaEmEdicao] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  async function handleAdd() {
    const cnpjNumeros = novoCnpj.replace(/\D/g, "");
    const razaoSocial = novaRazao.trim();
    const nomeFantasia = novoFantasia.trim() || razaoSocial;

    if (!cnpjNumeros || cnpjNumeros.length !== 14) {
      alert("O CNPJ deve conter exatamente 14 dígitos numéricos.");
      return;
    }

    if (!razaoSocial) {
      alert("Informe a Razão Social da empresa.");
      return;
    }

    if (empresas.some((e) => e.cnpj.replace(/\D/g, "") === cnpjNumeros)) {
      alert("Já existe uma filial com este CNPJ nesta conta.");
      return;
    }

    if (clienteId && onPersistAdd) {
      try {
        setSalvando(true);
        await onPersistAdd({
          cliente_id: clienteId,
          cnpj: maskCNPJ(novoCnpj),
          razaoSocial,
          nomeFantasia,
          is_matriz: novaIsMatriz || empresas.length === 0,
          status: "A",
        });
        setNovoCnpj("");
        setNovaRazao("");
        setNovoFantasia("");
        setNovaIsMatriz(false);
      } catch (err) {
        alert(err.message || "Erro ao adicionar filial.");
      } finally {
        setSalvando(false);
      }
      return;
    }

    let atualizadas = [...empresas];
    const definirMatriz = novaIsMatriz || atualizadas.length === 0;
    if (definirMatriz) {
      atualizadas = atualizadas.map((e) => ({ ...e, is_matriz: false }));
    }

    atualizadas.push({
      id: Date.now() + Math.random(),
      cnpj: maskCNPJ(novoCnpj),
      razaoSocial,
      nomeFantasia,
      is_matriz: definirMatriz,
      status: "A",
    });

    onChange(atualizadas);
    setNovoCnpj("");
    setNovaRazao("");
    setNovoFantasia("");
    setNovaIsMatriz(false);
  }

  async function handleSalvarEdicao() {
    if (!empresaEmEdicao) return;
    const cnpjNumeros = empresaEmEdicao.cnpj.replace(/\D/g, "");
    if (!cnpjNumeros || cnpjNumeros.length !== 14) {
      alert("O CNPJ deve conter 14 números.");
      return;
    }
    if (!empresaEmEdicao.razaoSocial.trim()) {
      alert("A Razão Social é obrigatória.");
      return;
    }

    if (clienteId && onPersistUpdate) {
      try {
        setSalvandoEdicao(true);
        await onPersistUpdate(empresaEmEdicao.id, {
          cnpj: maskCNPJ(empresaEmEdicao.cnpj),
          razaoSocial: empresaEmEdicao.razaoSocial,
          nomeFantasia: empresaEmEdicao.nomeFantasia,
          status: empresaEmEdicao.status,
          is_matriz: empresaEmEdicao.is_matriz,
        });
        setEmpresaEmEdicao(null);
      } catch (err) {
        alert(err.message || "Erro ao atualizar filial.");
      } finally {
        setSalvandoEdicao(false);
      }
      return;
    }

    const atualizadas = empresas.map((e) => {
      if (e.id === empresaEmEdicao.id) {
        return { ...empresaEmEdicao, cnpj: maskCNPJ(empresaEmEdicao.cnpj) };
      }
      if (empresaEmEdicao.is_matriz) {
        return { ...e, is_matriz: false };
      }
      return e;
    });

    onChange(atualizadas);
    setEmpresaEmEdicao(null);
  }

  async function handleTornarMatriz(emp) {
    if (clienteId && onPersistSetMatriz) {
      await onPersistSetMatriz(emp.id);
      return;
    }
    const atualizadas = empresas.map((e) => ({
      ...e,
      is_matriz: e.id === emp.id,
    }));
    onChange(atualizadas);
  }

  async function handleRemover(emp) {
    if (emp.is_matriz && empresas.length > 1) {
      alert("Esta empresa é a Matriz. Defina outra filial como Matriz antes de excluí-la.");
      return;
    }

    if (!window.confirm(`Deseja remover a filial "${emp.razaoSocial}"?`)) return;

    if (clienteId && onPersistDelete) {
      await onPersistDelete(emp.id, emp.razaoSocial, emp.is_matriz);
      return;
    }

    onChange(empresas.filter((e) => e.id !== emp.id));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "#E2E8F0" }}>
        <div>
          <h3 className="text-sm font-bold text-[#1E293B]">Estrutura Multi-CNPJ (Matriz & Filiais)</h3>
          <p className="text-xs text-[#64748B]">
            Cadastre a matriz e todas as filiais associadas a esta conta de cliente
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {empresas.length} {empresas.length === 1 ? "CNPJ cadastrado" : "CNPJs cadastrados"}
        </span>
      </div>

      <div className="space-y-3">
        {empresas.map((emp) => (
          <div
            key={emp.id}
            className="border rounded-xl bg-white shadow-2xs overflow-hidden transition-all"
            style={{ borderColor: emp.is_matriz ? "#93C5FD" : "#E2E8F0" }}
          >
            <div className="flex items-center justify-between p-3.5 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide flex-shrink-0 ${
                    emp.is_matriz
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {emp.is_matriz ? "⭐ Matriz" : "Filial"}
                </span>

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1E293B] truncate">
                    {emp.razaoSocial}{" "}
                    {emp.nomeFantasia && emp.nomeFantasia !== emp.razaoSocial && (
                      <span className="text-xs text-[#64748B] font-normal">({emp.nomeFantasia})</span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-[#64748B] flex items-center gap-2">
                    <span>CNPJ: {maskCNPJ(emp.cnpj)}</span>
                    <span>•</span>
                    <span className={emp.status === "A" ? "text-emerald-600 font-semibold" : "text-rose-600"}>
                      {emp.status === "A" ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEmpresaEmEdicao(empresaEmEdicao?.id === emp.id ? null : { ...emp })}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  {empresaEmEdicao?.id === emp.id ? "Fechar Edição" : "Ver / Editar"}
                </button>

                {!emp.is_matriz && (
                  <button
                    type="button"
                    onClick={() => handleTornarMatriz(emp)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-blue-200 text-[#0066CC] hover:bg-blue-50 cursor-pointer"
                  >
                    Tornar Matriz
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemover(emp)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  title="Remover filial"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            {empresaEmEdicao?.id === emp.id && (
              <div className="p-4 bg-[#F8FAFC] border-t space-y-3" style={{ borderColor: "#E2E8F0" }}>
                <div className="text-xs font-bold text-[#334155] uppercase tracking-wide">
                  Editar Dados do CNPJ ({emp.is_matriz ? "Matriz" : "Filial"})
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1 text-slate-600">CNPJ</label>
                    <input
                      type="text"
                      value={empresaEmEdicao.cnpj}
                      onChange={(e) => setEmpresaEmEdicao({ ...empresaEmEdicao, cnpj: maskCNPJ(e.target.value) })}
                      className="w-full text-xs border rounded-lg px-3 py-2 bg-white font-mono"
                      style={{ borderColor: "#CBD5E1" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1 text-slate-600">Razão Social</label>
                    <input
                      type="text"
                      value={empresaEmEdicao.razaoSocial}
                      onChange={(e) => setEmpresaEmEdicao({ ...empresaEmEdicao, razaoSocial: e.target.value })}
                      className="w-full text-xs border rounded-lg px-3 py-2 bg-white"
                      style={{ borderColor: "#CBD5E1" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1 text-slate-600">Nome Fantasia</label>
                    <input
                      type="text"
                      value={empresaEmEdicao.nomeFantasia || ""}
                      onChange={(e) => setEmpresaEmEdicao({ ...empresaEmEdicao, nomeFantasia: e.target.value })}
                      className="w-full text-xs border rounded-lg px-3 py-2 bg-white"
                      style={{ borderColor: "#CBD5E1" }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      Status:
                      <select
                        value={empresaEmEdicao.status || "A"}
                        onChange={(e) => setEmpresaEmEdicao({ ...empresaEmEdicao, status: e.target.value })}
                        className="text-xs border rounded-md px-2 py-1 bg-white"
                        style={{ borderColor: "#CBD5E1" }}
                      >
                        <option value="A">Ativa</option>
                        <option value="I">Inativa</option>
                      </select>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(empresaEmEdicao.is_matriz)}
                        onChange={(e) => setEmpresaEmEdicao({ ...empresaEmEdicao, is_matriz: e.target.checked })}
                      />
                      Marcar como Matriz
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEmpresaEmEdicao(null)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSalvarEdicao}
                      disabled={salvandoEdicao}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer shadow-xs disabled:opacity-50"
                      style={{ background: "#0066CC" }}
                    >
                      {salvandoEdicao ? "Salvando..." : "Salvar Alterações"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {empresas.length === 0 && (
          <div className="p-6 rounded-xl border border-dashed text-center bg-[#F8FAFC]" style={{ borderColor: "#CBD5E1" }}>
            <p className="text-xs text-[#94A3B8]">
              Nenhum CNPJ cadastrado. Cadastre a Matriz no formulário abaixo para continuar.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#F8FAFC] rounded-xl border space-y-3" style={{ borderColor: "#E2E8F0" }}>
        <div className="text-xs font-bold text-[#475569] uppercase tracking-wide">
          + Cadastrar Novo CNPJ / Filial
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="CNPJ (apenas números)"
            value={novoCnpj}
            onChange={(e) => setNovoCnpj(maskCNPJ(e.target.value))}
            className="text-xs border rounded-lg px-3 py-2 outline-none bg-white font-mono"
            style={{ borderColor: "#CBD5E1" }}
          />
          <input
            type="text"
            placeholder="Razão Social"
            value={novaRazao}
            onChange={(e) => setNovaRazao(e.target.value)}
            className="text-xs border rounded-lg px-3 py-2 outline-none bg-white"
            style={{ borderColor: "#CBD5E1" }}
          />
          <input
            type="text"
            placeholder="Nome Fantasia (opcional)"
            value={novoFantasia}
            onChange={(e) => setNovoFantasia(e.target.value)}
            className="text-xs border rounded-lg px-3 py-2 outline-none bg-white"
            style={{ borderColor: "#CBD5E1" }}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs text-[#475569] cursor-pointer">
            <input
              type="checkbox"
              checked={novaIsMatriz}
              onChange={(e) => setNovaIsMatriz(e.target.checked)}
              className="rounded"
            />
            Marcar como Matriz da conta
          </label>

          <button
            type="button"
            onClick={handleAdd}
            disabled={salvando}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer shadow-xs disabled:opacity-50"
            style={{ background: "#0066CC" }}
          >
            {salvando ? "Salvando..." : "Adicionar CNPJ / Filial"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModulosSelector({ disponiveis = [], selecionados = [], aoAlterar }) {
  const [selecionadoId, setSelecionadoId] = useState("");

  function handleVincular() {
    if (!selecionadoId) return;
    const idNum = Number(selecionadoId);
    if (selecionados.some((m) => m.id === idNum)) return;
    const modObj = disponiveis.find((m) => m.id === idNum);
    if (modObj) {
      aoAlterar([...selecionados, modObj]);
      setSelecionadoId("");
    }
  }

  function handleDesvincular(id) {
    aoAlterar(selecionados.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-3 pt-2">
      <div>
        <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
          Módulos Adicionais Contratados ({selecionados.length})
        </label>
        <div className="flex gap-2">
          <select
            value={selecionadoId}
            onChange={(e) => setSelecionadoId(e.target.value)}
            className="flex-1 text-xs border rounded-lg px-3 py-2 outline-none bg-white font-medium"
            style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
          >
            <option value="">Selecione um módulo para adicionar...</option>
            {disponiveis
              .filter((d) => !selecionados.some((s) => s.id === d.id))
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} — {formatMoneyBRL(m.valor)}
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={handleVincular}
            disabled={!selecionadoId}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-50 shadow-xs"
            style={{ background: "#0066CC" }}
          >
            Vincular
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {selecionados.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between p-2.5 rounded-xl border bg-white shadow-2xs"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-[#1E293B] truncate">{m.nome}</div>
              <div className="text-[11px] font-semibold text-emerald-600">{formatMoneyBRL(m.valor)}</div>
            </div>
            <button
              type="button"
              onClick={() => handleDesvincular(m.id)}
              className="text-slate-400 hover:text-red-600 p-1 rounded-lg cursor-pointer flex-shrink-0"
              title="Desvincular módulo"
            >
              ✕
            </button>
          </div>
        ))}

        {selecionados.length === 0 && (
          <div className="col-span-full p-3 rounded-lg border border-dashed text-center bg-[#F8FAFC]" style={{ borderColor: "#CBD5E1" }}>
            <p className="text-xs text-[#94A3B8]">Nenhum módulo adicional contratado por este cliente.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function TransportadorasSelector({ disponiveis = [], selecionadas = [], aoAlterar }) {
  const [selecionadaId, setSelecionadaId] = useState("");

  function handleVincular() {
    if (!selecionadaId) return;
    const idNum = Number(selecionadaId);
    if (selecionadas.some((t) => t.id === idNum)) return;
    const transpObj = disponiveis.find((t) => t.id === idNum);
    if (transpObj) {
      aoAlterar([...selecionadas, transpObj]);
      setSelecionadaId("");
    }
  }

  function handleDesvincular(id) {
    aoAlterar(selecionadas.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "#E2E8F0" }}>
        <div>
          <h3 className="text-sm font-bold text-[#1E293B]">Transportadoras Homologadas</h3>
          <p className="text-xs text-[#64748B]">
            Vincule as transportadoras ativas no sistema autorizadas a operar com este cliente
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {selecionadas.length} vinculada(s)
        </span>
      </div>

      <div className="flex gap-2">
        <select
          value={selecionadaId}
          onChange={(e) => setSelecionadaId(e.target.value)}
          className="flex-1 text-xs border rounded-lg px-3 py-2 outline-none bg-white font-medium"
          style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
        >
          <option value="">Selecione uma transportadora cadastrada...</option>
          {disponiveis
            .filter((d) => !selecionadas.some((s) => s.id === d.id))
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} — CNPJ: {maskCNPJ(t.cnpj)}
              </option>
            ))}
        </select>
        <button
          type="button"
          onClick={handleVincular}
          disabled={!selecionadaId}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
          style={{ background: "#0066CC" }}
        >
          Vincular
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {selecionadas.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between p-3 rounded-xl border bg-white shadow-2xs"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div>
              <div className="text-xs font-bold text-[#1E293B]">{t.nome}</div>
              <div className="text-[11px] font-mono text-slate-500">CNPJ: {maskCNPJ(t.cnpj)}</div>
            </div>
            <button
              type="button"
              onClick={() => handleDesvincular(t.id)}
              className="text-slate-400 hover:text-red-600 p-1 rounded-lg cursor-pointer"
              title="Desvincular transportadora"
            >
              ✕
            </button>
          </div>
        ))}

        {selecionadas.length === 0 && (
          <div className="col-span-full p-6 rounded-xl border border-dashed text-center bg-[#F8FAFC]" style={{ borderColor: "#CBD5E1" }}>
            <p className="text-xs text-[#94A3B8]">Nenhuma transportadora homologada para este cliente.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ContatosSection({ contatos = [], onChange }) {
  function addContato() {
    onChange([...contatos, { id: Date.now() + Math.random(), nome: "", email: "" }]);
  }

  function updateContato(idx, field, value) {
    const updated = contatos.map((c, i) => (i === idx ? { ...c, [field]: value } : c));
    onChange(updated);
  }

  function removeContato(idx) {
    onChange(contatos.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "#E2E8F0" }}>
        <div>
          <h3 className="text-sm font-bold text-[#1E293B]">Contatos & Pessoas Autorizadas</h3>
          <p className="text-xs text-[#64748B]">Contatos habilitados para abertura e acompanhamento de chamados</p>
        </div>
        <button
          type="button"
          onClick={addContato}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white text-[#0066CC] hover:bg-blue-50 cursor-pointer"
          style={{ borderColor: "#0066CC" }}
        >
          + Adicionar Contato
        </button>
      </div>

      <div className="space-y-2.5">
        {contatos.map((c, idx) => (
          <div
            key={c.id || idx}
            className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center p-2 rounded-xl border bg-white"
            style={{ borderColor: "#E2E8F0" }}
          >
            <input
              type="text"
              value={c.nome || ""}
              onChange={(e) => updateContato(idx, "nome", e.target.value)}
              placeholder="Nome do contato (ex: João Silva)"
              className="w-full text-xs border rounded-lg px-3 py-2 outline-none bg-white"
              style={{ borderColor: "#E2E8F0" }}
            />
            <input
              type="email"
              value={c.email || ""}
              onChange={(e) => updateContato(idx, "email", e.target.value)}
              placeholder="E-mail (ex: joao@empresa.com.br)"
              className="w-full text-xs border rounded-lg px-3 py-2 outline-none bg-white"
              style={{ borderColor: "#E2E8F0" }}
            />
            <button
              type="button"
              onClick={() => removeContato(idx)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
              title="Remover contato"
            >
              ✕
            </button>
          </div>
        ))}

        {contatos.length === 0 && (
          <div className="p-6 rounded-xl border border-dashed text-center bg-[#F8FAFC]" style={{ borderColor: "#CBD5E1" }}>
            <p className="text-xs text-slate-400">Nenhum contato cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AnexosSection({ clienteId, anexosLocais = [], aoAlterarLocais }) {
  const [anexosSalvos, setAnexosSalvos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const fileInputRef = useRef(null);

  const carregarAnexosDoBanco = async () => {
    if (!clienteId) return;
    setCarregando(true);
    try {
      const res = await fetch(`${BASE_URL}/anexos?cliente_id=${clienteId}`);
      if (res.ok) {
        const dados = await res.json();
        setAnexosSalvos(dados);
      }
    } catch (err) {
      console.error("Erro ao listar anexos:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (clienteId) {
      carregarAnexosDoBanco();
    }
  }, [clienteId]);

  async function handleSelecionarArquivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (clienteId) {
      setEnviando(true);
      try {
        const formData = new FormData();
        formData.append("arquivo", file);
        formData.append("cliente_id", clienteId);

        const res = await fetch(`${BASE_URL}/anexos`, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Falha no envio do anexo.");
        }

        await carregarAnexosDoBanco();
      } catch (err) {
        alert(err.message);
      } finally {
        setEnviando(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } else {
      aoAlterarLocais([...anexosLocais, file]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoverSalvo(id) {
    if (!window.confirm("Deseja realmente excluir este anexo permanentemente?")) return;
    try {
      const res = await fetch(`${BASE_URL}/anexos/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setAnexosSalvos((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      alert("Erro ao excluir arquivo: " + err.message);
    }
  }

  function handleRemoverLocal(idx) {
    aoAlterarLocais(anexosLocais.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "#E2E8F0" }}>
        <div>
          <h3 className="text-sm font-bold text-[#1E293B]">Documentos & Arquivos do Cliente</h3>
          <p className="text-xs text-[#64748B]">
            Contratos assinados, tabelas de frete, manuais e documentações fiscais
          </p>
        </div>

        <div>
          <input type="file" ref={fileInputRef} onChange={handleSelecionarArquivo} className="hidden" />
          <button
            type="button"
            disabled={enviando}
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            style={{ background: "#0066CC" }}
          >
            <span>📎</span>
            <span>{enviando ? "Enviando arquivo..." : "+ Novo Anexo"}</span>
          </button>
        </div>
      </div>

      {carregando && (
        <div className="text-center py-6 text-xs text-slate-400">Carregando documentos...</div>
      )}

      {!clienteId && anexosLocais.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wide">
            Arquivos na fila (serão salvos ao concluir o cadastro):
          </div>
          {anexosLocais.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl border bg-amber-50/50 border-amber-200">
              <div className="flex items-center gap-2.5 truncate">
                <span className="text-base">📄</span>
                <div>
                  <div className="text-xs font-bold text-[#1E293B] truncate">{file.name}</div>
                  <div className="text-[11px] text-slate-500">{formatBytes(file.size)}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoverLocal(idx)}
                className="text-slate-400 hover:text-red-600 p-1 rounded-lg cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {anexosSalvos.map((anexo) => (
          <div
            key={anexo.id}
            className="flex items-center justify-between p-3 rounded-xl border bg-white shadow-2xs hover:border-blue-200 transition-colors"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div className="flex items-center gap-3 min-w-0 pr-3">
              <span className="text-xl">📄</span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#1E293B] truncate">{anexo.nome}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>{formatBytes(anexo.tamanho)}</span>
                  <span>•</span>
                  <span>Enviado em {new Date(anexo.dataUpload).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={`${BASE_URL}/anexos/${anexo.id}/download`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Baixar</span>
                <span>↓</span>
              </a>
              <button
                type="button"
                onClick={() => handleRemoverSalvo(anexo.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                title="Excluir arquivo"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {!carregando && anexosSalvos.length === 0 && (!anexosLocais || anexosLocais.length === 0) && (
          <div className="p-8 rounded-xl border border-dashed text-center bg-[#F8FAFC]" style={{ borderColor: "#CBD5E1" }}>
            <p className="text-xs text-[#94A3B8]">
              Nenhum documento anexado para este cliente até o momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}