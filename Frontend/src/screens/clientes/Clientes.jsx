import React, { useState, useEffect, Fragment } from "react";
import { BASE_URL, maskCNPJ } from "./ClienteFormSubcomponents";
import NovoClienteModal from "./NovoClienteModal";
import EditarClienteModal from "./EditarClienteModal";

const PLAN_COLORS = {
  Enterprise: { bg: "#F5F3FF", color: "#7C3AED" },
  Profissional: { bg: "#EBF4FF", color: "#0066CC" },
  Starter: { bg: "#ECFDF5", color: "#10B981" },
};

export default function Clientes() {
  const [clients, setClients] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [transportadoras, setTransportadoras] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const [showNovoModal, setShowNovoModal] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState(null);
  const [linhasExpandidas, setLinhasExpandidas] = useState({});

  function toggleExpandir(id) {
    setLinhasExpandidas((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resPlanos, resClientes, resTransp, resModulos] = await Promise.all([
        fetch(`${BASE_URL}/planos`),
        fetch(`${BASE_URL}/clientes`),
        fetch(`${BASE_URL}/transportadoras`),
        fetch(`${BASE_URL}/modulos`),
      ]);

      if (resPlanos.ok) setPlanos(await resPlanos.json());
      if (resClientes.ok) {
        const listaClientes = await resClientes.json();
        setClients(listaClientes);
        // Atualiza o cliente aberto no modal de edição caso uma filial tenha sido alterada
        if (clienteEmEdicao) {
          const atualizado = listaClientes.find((item) => item.id === clienteEmEdicao.id);
          if (atualizado) setClienteEmEdicao(atualizado);
        }
      }
      if (resTransp.ok) setTransportadoras(await resTransp.json());
      if (resModulos.ok) setModulos(await resModulos.json());
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  async function handleCreateCliente(formData, anexosLocais = []) {
    try {
      const matriz = formData.empresas.find((e) => e.is_matriz) || formData.empresas[0];

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
      };

      const res = await fetch(`${BASE_URL}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.errors ? Object.values(errData.errors)[0][0] : errData.message;
        alert(msg || "Erro ao cadastrar cliente.");
        return;
      }

      const novoCliente = await res.json();

      const outrasFiliais = formData.empresas.filter((e) => e.cnpj !== matriz.cnpj);
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
        });
      }

      if (anexosLocais && anexosLocais.length > 0) {
        for (const file of anexosLocais) {
          const fd = new FormData();
          fd.append("arquivo", file);
          fd.append("cliente_id", novoCliente.id);

          await fetch(`${BASE_URL}/anexos`, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: fd,
          });
        }
      }

      setShowNovoModal(false);
      carregarDados();
    } catch (err) {
      alert("Erro na requisição: " + err.message);
    }
  }

  async function handleUpdateCliente(formData) {
    try {
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
      };

      const res = await fetch(`${BASE_URL}/clientes/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Erro ao atualizar cliente.");
        return;
      }

      setClienteEmEdicao(null);
      carregarDados();
    } catch (err) {
      alert("Erro na requisição: " + err.message);
    }
  }

  async function handleDeleteCliente(id, nome) {
    if (!window.confirm(`Deseja realmente excluir o cliente "${nome}"?`)) return;

    try {
      const res = await fetch(`${BASE_URL}/clientes/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Não foi possível excluir o cliente.");
        return;
      }

      carregarDados();
    } catch (err) {
      alert("Erro ao processar exclusão: " + err.message);
    }
  }

  async function handleEmpresaAdded(empresaData) {
    const res = await fetch(`${BASE_URL}/cliente-empresas`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(empresaData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Erro ao adicionar filial");
    carregarDados();
  }

  async function handleEmpresaUpdated(empresaId, updateData) {
    const res = await fetch(`${BASE_URL}/cliente-empresas/${empresaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(updateData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Erro ao salvar alterações da filial");
    carregarDados();
  }

  async function handleEmpresaDeleted(empresaId, razaoSocial, isMatriz) {
    if (isMatriz) {
      alert("Esta empresa é a Matriz. Defina outra filial como Matriz antes de excluí-la.");
      return;
    }

    if (!window.confirm(`Deseja remover a filial "${razaoSocial}"?`)) return;

    const res = await fetch(`${BASE_URL}/cliente-empresas/${empresaId}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.message || "Erro ao remover filial.");
      return;
    }
    carregarDados();
  }

  async function handleEmpresaSetMatriz(empresaId) {
    const res = await fetch(`${BASE_URL}/cliente-empresas/${empresaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ is_matriz: true }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "Erro ao alterar matriz.");
      return;
    }
    carregarDados();
  }

  const filtered = (Array.isArray(clients) ? clients : []).filter((c) => {
    if (!c) return false;
    const searchLower = (search || "").toLowerCase();
    const searchNumbers = (search || "").replace(/\D/g, "");
    const empresas = Array.isArray(c.empresas) ? c.empresas : [];

    const matchEmpresa = empresas.some(
      (e) =>
        (searchNumbers && e.cnpj?.replace(/\D/g, "").includes(searchNumbers)) ||
        (e.cnpj && e.cnpj.includes(search)) ||
        (e.razaoSocial && e.razaoSocial.toLowerCase().includes(searchLower)) ||
        (e.nomeFantasia && e.nomeFantasia.toLowerCase().includes(searchLower))
    );

    const nomeFantasia = (c.nomeFantasia || "").toLowerCase();
    const dominio = (c.dominio || "").toLowerCase();

    if (
      search &&
      !nomeFantasia.includes(searchLower) &&
      !dominio.includes(searchLower) &&
      !matchEmpresa
    ) {
      return false;
    }

    if (planFilter !== "Todos" && String(c.plano_id) !== String(planFilter)) return false;
    if (statusFilter !== "Todos" && c.status !== (statusFilter === "Ativo" ? "A" : "I")) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F4F6F9" }}>
      <div className="px-6 py-4 border-b bg-white flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>
              🏢 Cadastro Geral de Clientes & Filiais (Multi-CNPJ)
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
              Visão consolidada das contas, contratos, documentações e controle individual por CNPJ
            </p>
          </div>
          <button
            onClick={() => setShowNovoModal(true)}
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
                const matriz = (c.empresas || []).find((e) => e.is_matriz) || (c.empresas || [])[0] || {};
                const qtdFiliais = Math.max(0, (c.empresas || []).length - 1);
                const planoObj = c.plano || planos.find((p) => p.id === c.plano_id);
                const planoNome = planoObj ? planoObj.nome : "—";
                const isExpanded = Boolean(linhasExpandidas[c.id]);

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
                          onClick={() => setClienteEmEdicao(c)}
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
                            onClick={() => setClienteEmEdicao(c)}
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
                );
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

      {showNovoModal && (
        <NovoClienteModal
          onClose={() => setShowNovoModal(false)}
          onSave={handleCreateCliente}
          planosList={planos}
          transportadorasList={transportadoras}
          modulosList={modulos}
        />
      )}

      {clienteEmEdicao && (
        <EditarClienteModal
          client={clienteEmEdicao}
          onClose={() => setClienteEmEdicao(null)}
          onSave={handleUpdateCliente}
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
  );
}