import { useState, useEffect, useRef } from "react";

function ClientAutocomplete({ clients, selected, onSelect, error }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
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

  const filtered = (clients || []).filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return c.nomeFantasia && c.nomeFantasia.toLowerCase().includes(q);
  });

  if (selected) {
    return (
      <div>
        <label className="text-xs font-semibold block mb-1.5" style={{ color: "#475569" }}>
          Cliente <span className="text-red-500">*</span>
        </label>
        <div
          className="flex items-center justify-between p-3 rounded-xl border bg-white transition-all shadow-xs"
          style={{ borderColor: "#0066CC", background: "#F0F7FF" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "#0B2847" }}
            >
              {(selected.nomeFantasia || "FG").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm truncate block" style={{ color: "#1E293B" }}>
                {selected.nomeFantasia}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setQuery("");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white transition-colors hover:bg-[#F1F5F9] cursor-pointer"
            style={{ borderColor: "#CBD5E1", color: "#0066CC" }}
          >
            Trocar cliente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs font-semibold block mb-1.5" style={{ color: "#475569" }}>
        Cliente <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Digite para buscar o cliente..."
          className="w-full text-sm border rounded-lg px-3 py-2.5 outline-none transition-all"
          style={{
            borderColor: error ? "#EF4444" : "#CBD5E1",
            color: "#1E293B",
            background: "#fff",
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {error && <p className="text-xs mt-1 font-medium text-red-500">{error}</p>}

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto"
          style={{ borderColor: "#E2E8F0" }}
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-center text-slate-400">Nenhum cliente encontrado</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelect(c);
                  setIsOpen(false);
                  setQuery("");
                }}
                className="w-full text-left px-3 py-2.5 flex items-center gap-3 border-b last:border-b-0 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                style={{ borderColor: "#F1F5F9" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "#0B2847" }}
                >
                  {(c.nomeFantasia || "FG").slice(0, 2).toUpperCase()}
                </div>
                <div className="font-semibold text-xs text-slate-800 truncate">{c.nomeFantasia}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function NovoTicketModal({ isOpen, onClose, onCreateTicket, auxiliares }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [prioridadeId, setPrioridadeId] = useState("");
  const [canalId, setCanalId] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (auxiliares) {
      if (auxiliares.categorias?.length > 0) setCategoriaId(auxiliares.categorias[0].id);
      if (auxiliares.prioridades?.length > 0) setPrioridadeId(auxiliares.prioridades[0].id);
      if (auxiliares.canais?.length > 0) setCanalId(auxiliares.canais[0].id);
      if (auxiliares.usuarios?.length > 0) setUsuarioId(auxiliares.usuarios[0].id);
    }
  }, [auxiliares]);

  if (!isOpen) return null;

  function resetForm() {
    setSelectedClient(null);
    setAssunto("");
    setDescricao("");
    setFiles([]);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleCloseModal() {
    resetForm();
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!selectedClient) errs.cliente = "Selecione um cliente.";
    if (!assunto.trim()) errs.assunto = "Título obrigatório.";
    if (!descricao.trim()) errs.descricao = "Descrição obrigatória.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const formData = new FormData();
    formData.append("cliente_id", selectedClient.id);
    formData.append("titulo", assunto.trim());
    formData.append("mensagem", descricao.trim());
    
    // Envia o status padrão existente (evita foreign key violation)
    if (auxiliares?.status?.length > 0) {
      const statusAberto = auxiliares.status.find((s) => s.nome.toLowerCase().includes("aberto")) || auxiliares.status[0];
      formData.append("status_id", statusAberto.id);
    }

    if (categoriaId) formData.append("categoria_id", categoriaId);
    if (prioridadeId) formData.append("prioridade_id", prioridadeId);
    if (canalId) formData.append("canal_id", canalId);
    if (usuarioId) {
      formData.append("usuarios[]", usuarioId);
      formData.append("usuario_id", usuarioId);
    }

    files.forEach((file) => {
      formData.append("anexos[]", file);
    });

    onCreateTicket(formData);
    resetForm();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(11,40,71,0.6)", backdropFilter: "blur(3px)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden border"
        style={{ borderColor: "#E2E8F0" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-base font-bold text-slate-800">Criar Novo Ticket de Suporte</h2>
          <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <ClientAutocomplete
            clients={auxiliares?.clientes || []}
            selected={selectedClient}
            onSelect={setSelectedClient}
            error={errors.cliente}
          />

          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-700">
              Título / Assunto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Ex: Tabela de Frete com divergência de cálculo"
              className="w-full text-sm border rounded-lg px-3 py-2 outline-none"
              style={{ borderColor: errors.assunto ? "#EF4444" : "#CBD5E1" }}
            />
            {errors.assunto && <p className="text-xs text-red-500 mt-1">{errors.assunto}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-700">
              Descrição Completa <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva detalhadamente a solicitação ou erro..."
              className="w-full text-sm border rounded-lg px-3 py-2 outline-none resize-y"
              style={{ borderColor: errors.descricao ? "#EF4444" : "#CBD5E1" }}
            />
            {errors.descricao && <p className="text-xs text-red-500 mt-1">{errors.descricao}</p>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1.5 text-slate-700">Categoria</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none bg-white cursor-pointer"
                style={{ borderColor: "#CBD5E1" }}
              >
                {(auxiliares?.categorias || []).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5 text-slate-700">Prioridade</label>
              <select
                value={prioridadeId}
                onChange={(e) => setPrioridadeId(e.target.value)}
                className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none bg-white cursor-pointer"
                style={{ borderColor: "#CBD5E1" }}
              >
                {(auxiliares?.prioridades || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5 text-slate-700">Canal</label>
              <select
                value={canalId}
                onChange={(e) => setCanalId(e.target.value)}
                className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none bg-white cursor-pointer"
                style={{ borderColor: "#CBD5E1" }}
              >
                {(auxiliares?.canais || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5 text-slate-700">Responsável</label>
              <select
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none bg-white cursor-pointer"
                style={{ borderColor: "#CBD5E1" }}
              >
                {(auxiliares?.usuarios || []).map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5 text-slate-700">Anexos</label>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={(e) => setFiles(Array.from(e.target.files))}
              className="w-full text-xs border rounded-lg p-2"
            />
            {files.length > 0 && (
              <p className="text-[11px] text-slate-500 mt-1">{files.length} arquivo(s) selecionado(s)</p>
            )}
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50 flex-shrink-0">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-4 py-2 rounded-lg text-sm font-medium border bg-white text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm cursor-pointer"
            style={{ background: "#0066CC" }}
          >
            Criar Ticket
          </button>
        </div>
      </div>
    </div>
  );
}