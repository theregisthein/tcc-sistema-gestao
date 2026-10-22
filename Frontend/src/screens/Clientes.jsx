import React, { useState, useRef, useEffect, Fragment } from "react"

const BASE_URL = "http://localhost:8000/api"

const PLAN_COLORS = {
  Enterprise: { bg: "#F5F3FF", color: "#7C3AED" },
  Profissional: { bg: "#EBF4FF", color: "#0066CC" },
  Starter: { bg: "#ECFDF5", color: "#10B981" },
}

function maskCNPJ(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

function formatMoneyBRL(value) {
  if (value === null || value === undefined || value === "") return "R$ 0,00"
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }
  const digits = String(value).replace(/\D/g, "")
  if (!digits) return "R$ 0,00"
  return (Number(digits) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function parseMoneyToFloat(value) {
  if (typeof value === "number") return value
  const digits = String(value).replace(/\D/g, "")
  if (!digits) return 0
  return Number(digits) / 100
}

function FormField({ label, value, onChange, placeholder, type = "text", required = false }) {
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
          e.target.style.borderColor = "#0066CC"
          e.target.style.boxShadow = "0 0 0 3px rgba(0,102,204,0.1)"
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#E2E8F0"
          e.target.style.boxShadow = "none"
        }}
      />
    </div>
  )
}

function MoneyField({ label, value, onChange, placeholder = "R$ 0,00", required = false }) {
  const displayValue = formatMoneyBRL(value)

  function handleChange(e) {
    const raw = e.target.value.replace(/\D/g, "")
    if (!raw) {
      onChange("R$ 0,00")
      return
    }
    onChange((Number(raw) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))
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
  )
}

// 🏛️ Gestão de Matriz e Filiais (Funciona para cliente novo ou existente)
function EmpresasSection({
  clienteId,
  empresas = [],
  onChange,
  onPersistAdd,
  onPersistUpdate,
  onPersistDelete,
  onPersistSetMatriz,
}) {
  const [novoCnpj, setNovoCnpj] = useState("")
  const [novaRazao, setNovaRazao] = useState("")
  const [novoFantasia, setNovoFantasia] = useState("")
  const [novaIsMatriz, setNovaIsMatriz] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [empresaEmEdicao, setEmpresaEmEdicao] = useState(null)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  async function handleAdd() {
    const cnpjNumeros = novoCnpj.replace(/\D/g, "")
    const razaoSocial = novaRazao.trim()
    const nomeFantasia = novoFantasia.trim() || razaoSocial

    if (!cnpjNumeros || cnpjNumeros.length !== 14) {
      alert("O CNPJ deve conter exatamente 14 dígitos numéricos.")
      return
    }

    if (!razaoSocial) {
      alert("Informe a Razão Social da empresa.")
      return
    }

    if (empresas.some((e) => e.cnpj.replace(/\D/g, "") === cnpjNumeros)) {
      alert("Já existe uma filial com este CNPJ nesta conta.")
      return
    }

    if (clienteId && onPersistAdd) {
      try {
        setSalvando(true)
        await onPersistAdd({
          cliente_id: clienteId,
          cnpj: maskCNPJ(novoCnpj),
          razaoSocial,
          nomeFantasia,
          is_matriz: novaIsMatriz || empresas.length === 0,
          status: "A",
        })
        setNovoCnpj("")
        setNovaRazao("")
        setNovoFantasia("")
        setNovaIsMatriz(false)
      } catch (err) {
        alert(err.message || "Erro ao adicionar filial.")
      } finally {
        setSalvando(false)
      }
      return
    }

    let atualizadas = [...empresas]
    const definirMatriz = novaIsMatriz || atualizadas.length === 0
    if (definirMatriz) {
      atualizadas = atualizadas.map((e) => ({ ...e, is_matriz: false }))
    }

    atualizadas.push({
      id: Date.now() + Math.random(),
      cnpj: maskCNPJ(novoCnpj),
      razaoSocial,
      nomeFantasia,
      is_matriz: definirMatriz,
      status: "A",
    })

    onChange(atualizadas)
    setNovoCnpj("")
    setNovaRazao("")
    setNovoFantasia("")
    setNovaIsMatriz(false)
  }

  async function handleSalvarEdicao() {
    if (!empresaEmEdicao) return
    const cnpjNumeros = empresaEmEdicao.cnpj.replace(/\D/g, "")
    if (!cnpjNumeros || cnpjNumeros.length !== 14) {
      alert("O CNPJ deve conter 14 números.")
      return
    }
    if (!empresaEmEdicao.razaoSocial.trim()) {
      alert("A Razão Social é obrigatória.")
      return
    }

    if (clienteId && onPersistUpdate) {
      try {
        setSalvandoEdicao(true)
        await onPersistUpdate(empresaEmEdicao.id, {
          cnpj: maskCNPJ(empresaEmEdicao.cnpj),
          razaoSocial: empresaEmEdicao.razaoSocial,
          nomeFantasia: empresaEmEdicao.nomeFantasia,
          status: empresaEmEdicao.status,
          is_matriz: empresaEmEdicao.is_matriz,
        })
        setEmpresaEmEdicao(null)
      } catch (err) {
        alert(err.message || "Erro ao atualizar filial.")
      } finally {
        setSalvandoEdicao(false)
      }
      return
    }

    const atualizadas = empresas.map((e) => {
      if (e.id === empresaEmEdicao.id) {
        return { ...empresaEmEdicao, cnpj: maskCNPJ(empresaEmEdicao.cnpj) }
      }
      if (empresaEmEdicao.is_matriz) {
        return { ...e, is_matriz: false }
      }
      return e
    })

    onChange(atualizadas)
    setEmpresaEmEdicao(null)
  }

  async function handleTornarMatriz(emp) {
    if (clienteId && onPersistSetMatriz) {
      await onPersistSetMatriz(emp.id)
      return
    }
    const atualizadas = empresas.map((e) => ({
      ...e,
      is_matriz: e.id === emp.id,
    }))
    onChange(atualizadas)
  }

  async function handleRemover(emp) {
    if (emp.is_matriz && empresas.length > 1) {
      alert("Esta empresa é a Matriz. Defina outra filial como Matriz antes de excluí-la.")
      return
    }

    if (!window.confirm(`Deseja remover a filial "${emp.razaoSocial}"?`)) return

    if (clienteId && onPersistDelete) {
      await onPersistDelete(emp.id, emp.razaoSocial, emp.is_matriz)
      return
    }

    onChange(empresas.filter((e) => e.id !== emp.id))
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
  )
}

// 🧩 Seleção dos Módulos Contratados (Estilo igual ao de Transportadoras, no item 2)
function ModulosSelector({ disponiveis = [], selecionados = [], aoAlterar }) {
  const [selecionadoId, setSelecionadoId] = useState("")

  function handleVincular() {
    if (!selecionadoId) return
    const idNum = Number(selecionadoId)
    if (selecionados.some((m) => m.id === idNum)) return
    const modObj = disponiveis.find((m) => m.id === idNum)
    if (modObj) {
      aoAlterar([...selecionados, modObj])
      setSelecionadoId("")
    }
  }

  function handleDesvincular(id) {
    aoAlterar(selecionados.filter((m) => m.id !== id))
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
  )
}

// 🚚 Seleção das Transportadoras cadastradas da tabela `transportadora`
function TransportadorasSelector({ disponiveis = [], selecionadas = [], aoAlterar }) {
  const [selecionadaId, setSelecionadaId] = useState("")

  function handleVincular() {
    if (!selecionadaId) return
    const idNum = Number(selecionadaId)
    if (selecionadas.some((t) => t.id === idNum)) return
    const transpObj = disponiveis.find((t) => t.id === idNum)
    if (transpObj) {
      aoAlterar([...selecionadas, transpObj])
      setSelecionadaId("")
    }
  }

  function handleDesvincular(id) {
    aoAlterar(selecionadas.filter((t) => t.id !== id))
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
  )
}

// 👥 Gestão de Contatos Autorizados
function ContatosSection({ contatos = [], onChange }) {
  function addContato() {
    onChange([...contatos, { id: Date.now() + Math.random(), nome: "", email: "" }])
  }

  function updateContato(idx, field, value) {
    const updated = contatos.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    onChange(updated)
  }

  function removeContato(idx) {
    onChange(contatos.filter((_, i) => i !== idx))
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
  )
}

// 🗂️ Modal Unificado (Usado tanto para NOVO CLIENTE quanto para EDITAR / VER FICHA)
function FichaClienteModal({
  client,
  isNovo = false,
  onClose,
  onSave,
  planosList = [],
  transportadorasList = [],
  modulosList = [],
  onEmpresaAdded,
  onEmpresaUpdated,
  onEmpresaDeleted,
  onEmpresaSetMatriz,
}) {
  const [activeTab, setActiveTab] = useState("dados")
  const [form, setForm] = useState({
    id: client?.id || null,
    nomeFantasia: client?.nomeFantasia || "",
    emailAdm: client?.emailAdm || "",
    dominio: client?.dominio || "",
    integracao: client?.integracao || "",
    dataAssContrato: client?.dataAssContrato || "",
    dataFimContrato: client?.dataFimContrato || "",
    dataIniImpl: client?.dataIniImpl || "",
    dataFinImpl: client?.dataFinImpl || "",
    valorContaFrete: client?.valorContaFrete ? formatMoneyBRL(client.valorContaFrete) : "R$ 0,00",
    status: client?.status || "A",
    plano_id: client?.plano_id || (planosList[0]?.id ?? ""),
    modulos: Array.isArray(client?.modulos) ? client.modulos : [],
    transportadoras: Array.isArray(client?.transportadoras) ? client.transportadoras : [],
    contatos: Array.isArray(client?.contatos) ? client.contatos : [],
    empresas: Array.isArray(client?.empresas) ? client.empresas : [],
  })

  useEffect(() => {
    if (client) {
      setForm({
        id: client.id || null,
        nomeFantasia: client.nomeFantasia || "",
        emailAdm: client.emailAdm || "",
        dominio: client.dominio || "",
        integracao: client.integracao || "",
        dataAssContrato: client.dataAssContrato || "",
        dataFimContrato: client.dataFimContrato || "",
        dataIniImpl: client.dataIniImpl || "",
        dataFinImpl: client.dataFinImpl || "",
        valorContaFrete: client.valorContaFrete ? formatMoneyBRL(client.valorContaFrete) : "R$ 0,00",
        status: client.status || "A",
        plano_id: client.plano_id || (planosList[0]?.id ?? ""),
        modulos: Array.isArray(client.modulos) ? client.modulos : [],
        transportadoras: Array.isArray(client.transportadoras) ? client.transportadoras : [],
        contatos: Array.isArray(client.contatos) ? client.contatos : [],
        empresas: Array.isArray(client.empresas) ? client.empresas : [],
      })
    }
  }, [client, planosList])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const matriz = form.empresas.find((e) => e.is_matriz) || form.empresas[0] || {}

  function handleSalvarGeral() {
    if (!form.nomeFantasia.trim()) {
      alert("Informe o Nome Fantasia / Identificador do cliente.")
      setActiveTab("dados")
      return
    }

    if (form.empresas.length === 0) {
      alert("É obrigatório cadastrar ao menos uma empresa (Matriz) na aba 'Multi-CNPJ & Filiais'.")
      setActiveTab("empresas")
      return
    }

    onSave({
      ...form,
      valorContaFrete: parseMoneyToFloat(form.valorContaFrete),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(11,40,71,0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border hover:bg-slate-50 cursor-pointer"
              style={{ borderColor: "#CBD5E1", color: "#64748B" }}
            >
              ← Voltar
            </button>
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">
                {isNovo ? "Cadastrar Novo Cliente" : form.nomeFantasia || matriz.razaoSocial || "Ficha do Cliente"}
              </h2>
              <div className="text-xs text-[#64748B]">
                Matriz: <strong>{matriz.razaoSocial || "Não configurada"}</strong> (
                {matriz.cnpj ? maskCNPJ(matriz.cnpj) : "Sem CNPJ"})
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer text-sm">
            ✕
          </button>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-1 px-6 border-b bg-[#F8FAFC] flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          {[
            { id: "dados", label: "🏢 Cadastro Geral & Contrato" },
            { id: "empresas", label: `🏛️ Multi-CNPJ & Filiais (${form.empresas.length})` },
            { id: "transportadoras", label: `🚚 Transportadoras (${form.transportadoras.length})` },
            { id: "contatos", label: `👥 Contatos (${form.contatos.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-[#0066CC] text-[#0066CC] bg-white"
                  : "border-transparent text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "dados" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold mb-3 text-[#1E293B]">1. Informações Globais da Conta</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField
                    label="Nome Fantasia / Identificador"
                    value={form.nomeFantasia}
                    onChange={(v) => update("nomeFantasia", v)}
                    placeholder="Ex: Florense"
                    required
                  />
                  <FormField
                    label="Domínio Web"
                    value={form.dominio}
                    onChange={(v) => update("dominio", v)}
                    placeholder="florense.fretegestao.com.br"
                  />
                  <FormField
                    label="E-mail Administrador"
                    value={form.emailAdm}
                    onChange={(v) => update("emailAdm", v)}
                    placeholder="admin@empresa.com.br"
                    type="email"
                  />
                </div>
              </div>

              {/* Item 2 com Seleção de Plano, Faturamento e Módulos */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#1E293B]">2. Plano & Faturamento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                      Plano Contratado
                    </label>
                    <select
                      className="w-full text-sm border rounded-lg px-3 py-2 outline-none bg-white font-medium cursor-pointer"
                      style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                      value={form.plano_id}
                      onChange={(e) => update("plano_id", e.target.value)}
                    >
                      <option value="">Selecione um plano...</option>
                      {planosList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} — {formatMoneyBRL(p.valor)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                      Status da Conta
                    </label>
                    <select
                      className="w-full text-sm border rounded-lg px-3 py-2 outline-none bg-white font-medium cursor-pointer"
                      style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
                      value={form.status}
                      onChange={(e) => update("status", e.target.value)}
                    >
                      <option value="A">Ativo</option>
                      <option value="I">Inativo</option>
                    </select>
                  </div>
                  <MoneyField
                    label="Conta Frete Mensal"
                    value={form.valorContaFrete}
                    onChange={(v) => update("valorContaFrete", v)}
                  />
                </div>

                {/* Módulos contratados inseridos no item 2 */}
                <ModulosSelector
                  disponiveis={modulosList}
                  selecionados={form.modulos}
                  aoAlterar={(novos) => update("modulos", novos)}
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-3 text-[#1E293B]">3. Prazos e Cronograma</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <FormField
                    label="Assinatura Contrato"
                    type="date"
                    value={form.dataAssContrato}
                    onChange={(v) => update("dataAssContrato", v)}
                  />
                  <FormField
                    label="Término Contrato"
                    type="date"
                    value={form.dataFimContrato}
                    onChange={(v) => update("dataFimContrato", v)}
                  />
                  <FormField
                    label="Início Implantação"
                    type="date"
                    value={form.dataIniImpl}
                    onChange={(v) => update("dataIniImpl", v)}
                  />
                  <FormField
                    label="Término Implantação"
                    type="date"
                    value={form.dataFinImpl}
                    onChange={(v) => update("dataFinImpl", v)}
                  />
                </div>
              </div>

              {/* Campo de Integração do DER (VARCHAR 500) */}
              <div>
                <h3 className="text-sm font-bold mb-3 text-[#1E293B]">4. Integrações Técnicas & ERPs</h3>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748B" }}>
                    Parâmetros de Integração / Sistemas (ERP, WMS, TMS, Webhook, API Externa)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={form.integracao || ""}
                    onChange={(e) => update("integracao", e.target.value)}
                    placeholder="Ex: Integração nativa SAP via REST API. Endpoint: https://api.erp.empresa.com.br/v1. Chave de acesso e webhook de status ativo."
                    className="w-full text-xs border rounded-lg p-3 outline-none transition-all resize-none"
                    style={{ borderColor: "#E2E8F0", color: "#1E293B", background: "#fff" }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0066CC"
                      e.target.style.boxShadow = "0 0 0 3px rgba(0,102,204,0.1)"
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E2E8F0"
                      e.target.style.boxShadow = "none"
                    }}
                  />
                  <div className="text-[11px] text-right text-slate-400 mt-1">
                    {(form.integracao || "").length}/500 caracteres
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "empresas" && (
            <EmpresasSection
              clienteId={form.id}
              empresas={form.empresas}
              onChange={(novas) => update("empresas", novas)}
              onPersistAdd={onEmpresaAdded}
              onPersistUpdate={onEmpresaUpdated}
              onPersistDelete={onEmpresaDeleted}
              onPersistSetMatriz={onEmpresaSetMatriz}
            />
          )}

          {activeTab === "transportadoras" && (
            <TransportadorasSelector
              disponiveis={transportadorasList}
              selecionadas={form.transportadoras}
              aoAlterar={(novas) => update("transportadoras", novas)}
            />
          )}

          {activeTab === "contatos" && (
            <ContatosSection
              contatos={form.contatos}
              onChange={(novos) => update("contatos", novos)}
            />
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-[#F8FAFC] flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border bg-white cursor-pointer"
            style={{ borderColor: "#CBD5E1", color: "#64748B" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvarGeral}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer shadow-xs"
            style={{ background: "#0066CC" }}
          >
            {isNovo ? "Concluir Cadastro do Cliente" : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  )
}

// 🚀 Tela Principal de Clientes
export default function Clientes() {
  const [clients, setClients] = useState([])
  const [planos, setPlanos] = useState([])
  const [transportadoras, setTransportadoras] = useState([])
  const [modulos, setModulos] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState("Todos")
  const [statusFilter, setStatusFilter] = useState("Todos")

  const [clienteModal, setClienteModal] = useState(null)
  const [modoModal, setModoModal] = useState("adicionar")
  const [linhasExpandidas, setLinhasExpandidas] = useState({})

  function toggleExpandir(id) {
    setLinhasExpandidas((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const carregarDados = async () => {
    setLoading(true)
    try {
      const [resPlanos, resClientes, resTransp, resModulos] = await Promise.all([
        fetch(`${BASE_URL}/planos`),
        fetch(`${BASE_URL}/clientes`),
        fetch(`${BASE_URL}/transportadoras`),
        fetch(`${BASE_URL}/modulos`),
      ])

      if (resPlanos.ok) setPlanos(await resPlanos.json())
      if (resClientes.ok) setClients(await resClientes.json())
      if (resTransp.ok) setTransportadoras(await resTransp.json())
      if (resModulos.ok) setModulos(await resModulos.json())
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  function abrirAdicionar() {
    setModoModal("adicionar")
    setClienteModal({
      nomeFantasia: "",
      emailAdm: "",
      dominio: "",
      integracao: "",
      valorContaFrete: 0,
      plano_id: planos[0]?.id || "",
      status: "A",
      dataAssContrato: new Date().toISOString().slice(0, 10),
      dataFimContrato: "",
      dataIniImpl: new Date().toISOString().slice(0, 10),
      dataFinImpl: "",
      empresas: [],
      modulos: [],
      transportadoras: [],
      contatos: [],
    })
  }

  function abrirEditar(c) {
    setModoModal("editar")
    setClienteModal(c)
  }

  async function handleSalvarModal(formData) {
    try {
      if (modoModal === "adicionar") {
        const matriz = formData.empresas.find((e) => e.is_matriz) || formData.empresas[0]

        const payload = {
          nomeFantasia: formData.nomeFantasia,
          emailAdm: formData.emailAdm || null,
          dominio: formData.dominio || null,
          integracao: formData.integracao || null,
          valorContaFrete: formData.valorContaFrete,
          plano_id: formData.plano_id || null,
          status: formData.status || "A",
          dataAssContrato: formData.dataAssContrato || null,
          dataFimContrato: formData.dataFimContrato || null,
          dataIniImpl: formData.dataIniImpl || null,
          dataFinImpl: formData.dataFinImpl || null,
          matrizCnpj: matriz.cnpj,
          matrizRazao: matriz.razaoSocial,
          transportadora_ids: (formData.transportadoras || []).map((t) => t.id),
          modulo_ids: (formData.modulos || []).map((m) => m.id),
          contatos: formData.contatos,
        }

        const res = await fetch(`${BASE_URL}/clientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const msg = errData.errors ? Object.values(errData.errors)[0][0] : errData.message
          alert(msg || "Erro ao cadastrar cliente.")
          return
        }

        const novoCliente = await res.json()

        const outrasFiliais = formData.empresas.filter((e) => e.cnpj !== matriz.cnpj)
        for (const f of outrasFiliais) {
          await fetch(`${BASE_URL}/cliente-empresas`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              cliente_id: novoCliente.id,
              cnpj: f.cnpj,
              razaoSocial: f.razaoSocial,
              nomeFantasia: f.nomeFantasia,
              is_matriz: false,
              status: f.status || "A",
            }),
          })
        }
      } else {
        const payload = {
          nomeFantasia: formData.nomeFantasia,
          emailAdm: formData.emailAdm,
          dominio: formData.dominio,
          integracao: formData.integracao || null,
          valorContaFrete: formData.valorContaFrete,
          plano_id: formData.plano_id,
          status: formData.status,
          dataAssContrato: formData.dataAssContrato || null,
          dataFimContrato: formData.dataFimContrato || null,
          dataIniImpl: formData.dataIniImpl || null,
          dataFinImpl: formData.dataFinImpl || null,
          transportadora_ids: (formData.transportadoras || []).map((t) => t.id),
          modulo_ids: (formData.modulos || []).map((m) => m.id),
          contatos: formData.contatos,
        }

        const res = await fetch(`${BASE_URL}/clientes/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          alert(errData.message || "Erro ao atualizar cliente.")
          return
        }
      }

      setClienteModal(null)
      carregarDados()
    } catch (err) {
      alert("Erro na requisição: " + err.message)
    }
  }

  async function handleDeleteCliente(id, nome) {
    if (!window.confirm(`Deseja realmente excluir o cliente "${nome}"?`)) return

    try {
      const res = await fetch(`${BASE_URL}/clientes/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        alert(data.message || "Não foi possível excluir o cliente.")
        return
      }

      carregarDados()
    } catch (err) {
      alert("Erro ao processar exclusão: " + err.message)
    }
  }

  async function handleEmpresaAdded(empresaData) {
    const res = await fetch(`${BASE_URL}/cliente-empresas`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(empresaData),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || "Erro ao adicionar filial")
    carregarDados()
  }

  async function handleEmpresaUpdated(empresaId, updateData) {
    const res = await fetch(`${BASE_URL}/cliente-empresas/${empresaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(updateData),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || "Erro ao salvar alterações da filial")
    carregarDados()
  }

  async function handleEmpresaDeleted(empresaId, razaoSocial, isMatriz) {
    if (isMatriz) {
      alert("Esta empresa é a Matriz. Defina outra filial como Matriz antes de excluí-la.")
      return
    }

    if (!window.confirm(`Deseja remover a filial "${razaoSocial}"?`)) return

    const res = await fetch(`${BASE_URL}/cliente-empresas/${empresaId}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data.message || "Erro ao remover filial.")
      return
    }
    carregarDados()
  }

  async function handleEmpresaSetMatriz(empresaId) {
    const res = await fetch(`${BASE_URL}/cliente-empresas/${empresaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ is_matriz: true }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.message || "Erro ao alterar matriz.")
      return
    }
    carregarDados()
  }

  const filtered = (Array.isArray(clients) ? clients : []).filter((c) => {
    if (!c) return false
    const searchLower = (search || "").toLowerCase()
    const searchNumbers = (search || "").replace(/\D/g, "")
    const empresas = Array.isArray(c.empresas) ? c.empresas : []

    const matchEmpresa = empresas.some(
      (e) =>
        (searchNumbers && e.cnpj?.replace(/\D/g, "").includes(searchNumbers)) ||
        (e.cnpj && e.cnpj.includes(search)) ||
        (e.razaoSocial && e.razaoSocial.toLowerCase().includes(searchLower)) ||
        (e.nomeFantasia && e.nomeFantasia.toLowerCase().includes(searchLower))
    )

    const nomeFantasia = (c.nomeFantasia || "").toLowerCase()
    const dominio = (c.dominio || "").toLowerCase()

    if (
      search &&
      !nomeFantasia.includes(searchLower) &&
      !dominio.includes(searchLower) &&
      !matchEmpresa
    ) {
      return false
    }

    if (planFilter !== "Todos" && String(c.plano_id) !== String(planFilter)) return false
    if (statusFilter !== "Todos" && c.status !== (statusFilter === "Ativo" ? "A" : "I")) return false
    return true
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F4F6F9" }}>
      <div className="px-6 py-4 border-b bg-white flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>
              🏢 Cadastro Geral de Clientes & Filiais (Multi-CNPJ)
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
              Visão consolidada das contas, contratos e controle individual por CNPJ
            </p>
          </div>
          <button
            onClick={abrirAdicionar}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer shadow-xs"
            style={{ background: "#0066CC" }}
          >
            + Novo Cliente
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Buscar por Razão, Fantasia, CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80 px-3 py-2 text-sm rounded-lg outline-none border bg-[#F8FAFC]"
            style={{ borderColor: "#E2E8F0", color: "#1E293B" }}
          />

          <select
            className="text-sm border rounded-lg px-3 py-2 outline-none bg-white cursor-pointer"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
          >
            <option value="Todos">Todos os Planos</option>
            {planos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          <select
            className="text-sm border rounded-lg px-3 py-2 outline-none bg-white cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
          >
            <option value="Todos">Todos os Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>

          <div className="ml-auto text-xs" style={{ color: "#64748B" }}>
            Total: <strong>{filtered.length}</strong> {filtered.length === 1 ? "cliente" : "clientes"}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-3">
        <div className="bg-white rounded-xl border overflow-hidden shadow-2xs" style={{ borderColor: "#E2E8F0" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ width: "40px" }} />
                {["Cliente / Matriz", "CNPJ Matriz", "Plano", "Estrutura", "Status", "Ações"].map((h, i) => (
                  <th
                    key={i}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#64748B" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const matriz = (c.empresas || []).find((e) => e.is_matriz) || (c.empresas || [])[0] || {}
                const qtdFiliais = Math.max(0, (c.empresas || []).length - 1)
                const planoObj = c.plano || planos.find((p) => p.id === c.plano_id)
                const planoNome = planoObj ? planoObj.nome : "—"
                const isExpanded = Boolean(linhasExpandidas[c.id])

                return (
                  <Fragment key={c.id}>
                    <tr className="border-t hover:bg-[#FAFBFC] transition-colors" style={{ borderColor: "#E2E8F0" }}>
                      <td className="pl-4 pr-1 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleExpandir(c.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title="Ver todas as filiais e CNPJs"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className={`transform transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => abrirEditar(c)}
                          className="font-semibold text-left hover:underline cursor-pointer block text-sm"
                          style={{ color: "#1E293B" }}
                        >
                          {c.nomeFantasia}
                        </button>
                        <div className="text-xs text-[#64748B] truncate max-w-xs">
                          {matriz.razaoSocial || "Sem razão social"} {c.dominio ? `· ${c.dominio}` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs font-mono text-[#1E293B]">
                        {matriz.cnpj ? maskCNPJ(matriz.cnpj) : "—"}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={PLAN_COLORS[planoNome] || { background: "#F1F5F9", color: "#64748B" }}
                        >
                          {planoNome}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <button
                          type="button"
                          onClick={() => toggleExpandir(c.id)}
                          className="font-medium text-[#0066CC] hover:underline cursor-pointer"
                        >
                          {qtdFiliais === 0 ? "1 Matriz" : `Matriz + ${qtdFiliais} filial(is)`}
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={
                            c.status === "A"
                              ? { background: "#ECFDF5", color: "#10B981" }
                              : { background: "#F1F5F9", color: "#64748B" }
                          }
                        >
                          {c.status === "A" ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => abrirEditar(c)}
                            className="font-semibold text-[#0066CC] hover:underline cursor-pointer"
                          >
                            Ver Ficha →
                          </button>
                          <button
                            onClick={() => handleDeleteCliente(c.id, c.nomeFantasia)}
                            className="text-slate-400 hover:text-red-600 cursor-pointer"
                            title="Excluir cliente"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-[#F8FAFC]">
                        <td colSpan={7} className="p-4 pl-12 border-t" style={{ borderColor: "#E2E8F0" }}>
                          <div className="text-xs font-bold text-slate-700 uppercase mb-2">
                            Empresas e Filiais Vinculadas ({c.empresas?.length || 0}):
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {(c.empresas || []).map((emp) => (
                              <div
                                key={emp.id}
                                className="bg-white border p-2.5 rounded-lg text-xs space-y-1 shadow-2xs"
                                style={{ borderColor: emp.is_matriz ? "#93C5FD" : "#E2E8F0" }}
                              >
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      emp.is_matriz ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {emp.is_matriz ? "Matriz" : "Filial"}
                                  </span>
                                  <span className="font-mono text-slate-500">{maskCNPJ(emp.cnpj)}</span>
                                </div>
                                <div className="font-semibold text-slate-800 truncate" title={emp.razaoSocial}>
                                  {emp.razaoSocial}
                                </div>
                                {emp.nomeFantasia && emp.nomeFantasia !== emp.razaoSocial && (
                                  <div className="text-slate-500 truncate">Fantasia: {emp.nomeFantasia}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#94A3B8]">
                    Nenhum cliente registrado no banco de dados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {clienteModal && (
        <FichaClienteModal
          client={clienteModal}
          isNovo={modoModal === "adicionar"}
          onClose={() => setClienteModal(null)}
          onSave={handleSalvarModal}
          planosList={planos}
          transportadorasList={transportadoras}
          modulosList={modulos}
          onEmpresaAdded={handleEmpresaAdded}
          onEmpresaUpdated={handleEmpresaUpdated}
          onEmpresaDeleted={handleEmpresaDeleted}
          onEmpresaSetMatriz={handleEmpresaSetMatriz}
        />
      )}
    </div>
  )
}