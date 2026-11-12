import React, { useState } from "react";
import {
  maskCNPJ,
  formatMoneyBRL,
  parseMoneyToFloat,
  FormField,
  MoneyField,
  EmpresasSection,
  ModulosSelector,
  TransportadorasSelector,
  ContatosSection,
  AnexosSection,
} from "./ClienteFormSubcomponents";

export default function NovoClienteModal({
  onClose,
  onSave,
  planosList = [],
  transportadorasList = [],
  modulosList = [],
}) {
  const [activeTab, setActiveTab] = useState("dados");
  const [anexosLocais, setAnexosLocais] = useState([]);
  const [form, setForm] = useState({
    nomeFantasia: "",
    emailAdm: "",
    dominio: "",
    integracao: "",
    valorContaFrete: "R$ 0,00",
    status: "A",
    plano_id: planosList[0]?.id ?? "",
    dataAssContrato: new Date().toISOString().slice(0, 10),
    dataFimContrato: "",
    dataIniImpl: new Date().toISOString().slice(0, 10),
    dataFinImpl: "",
    modulos: [],
    transportadoras: [],
    contatos: [],
    empresas: [],
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const matriz = form.empresas.find((e) => e.is_matriz) || form.empresas[0] || {};

  function handleConcluirCadastro() {
    if (!form.nomeFantasia.trim()) {
      alert("Informe o Nome Fantasia / Identificador do cliente.");
      setActiveTab("dados");
      return;
    }

    if (form.empresas.length === 0) {
      alert("É obrigatório cadastrar ao menos uma empresa (Matriz) na aba 'Multi-CNPJ & Filiais'.");
      setActiveTab("empresas");
      return;
    }

    onSave(
      {
        ...form,
        valorContaFrete: parseMoneyToFloat(form.valorContaFrete),
      },
      anexosLocais
    );
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
              <h2 className="text-base font-bold text-[#1E293B]">Cadastrar Novo Cliente</h2>
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

        <div className="flex items-center gap-1 px-6 border-b bg-[#F8FAFC] flex-shrink-0 overflow-x-auto" style={{ borderColor: "#E2E8F0" }}>
          {[
            { id: "dados", label: "🏢 Cadastro Geral & Contrato" },
            { id: "empresas", label: `🏛️ Multi-CNPJ & Filiais (${form.empresas.length})` },
            { id: "transportadoras", label: `🚚 Transportadoras (${form.transportadoras.length})` },
            { id: "contatos", label: `👥 Contatos (${form.contatos.length})` },
            { id: "anexos", label: "📎 Documentos & Anexos" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#0066CC] text-[#0066CC] bg-white"
                  : "border-transparent text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
                    placeholder="Ex: Integração nativa SAP via REST API. Endpoint: https://api.erp.empresa.com.br/v1."
                    className="w-full text-xs border rounded-lg p-3 outline-none transition-all resize-none"
                    style={{ borderColor: "#E2E8F0", color: "#1E293B", background: "#fff" }}
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
              clienteId={null}
              empresas={form.empresas}
              onChange={(novas) => update("empresas", novas)}
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

          {activeTab === "anexos" && (
            <AnexosSection
              clienteId={null}
              anexosLocais={anexosLocais}
              aoAlterarLocais={setAnexosLocais}
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-[#F8FAFC] flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border bg-white cursor-pointer"
            style={{ borderColor: "#CBD5E1", color: "#64748B" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConcluirCadastro}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer shadow-xs"
            style={{ background: "#0066CC" }}
          >
            Concluir Cadastro do Cliente
          </button>
        </div>
      </div>
    </div>
  );
}