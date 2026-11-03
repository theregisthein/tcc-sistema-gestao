import { useState } from "react";

const BASE_URL = "http://localhost:8000/api";

function LeftBanner() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
      style={{ background: "#0B2847" }}
    >
      <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <svg className="absolute bottom-0 right-0 w-3/4 h-3/4 opacity-10" viewBox="0 0 400 300" fill="none">
        <path d="M0 280 Q 100 150 200 200 T 400 80" stroke="#F26522" strokeWidth="2" fill="none" />
        <path d="M0 240 Q 120 100 240 160 T 400 40" stroke="#0066CC" strokeWidth="1.5" fill="none" />
        <path d="M0 300 Q 80 200 180 220 T 400 120" stroke="white" strokeWidth="1" fill="none" />
        <circle cx="200" cy="200" r="6" fill="#F26522" />
        <circle cx="120" cy="180" r="4" fill="#0066CC" />
        <circle cx="300" cy="100" r="5" fill="#10B981" />
        <circle cx="60" cy="260" r="3" fill="white" />
        <circle cx="350" cy="60" r="4" fill="#F59E0B" />
      </svg>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-16">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ background: "#F26522", color: "#fff" }}>FG</div>
          <span className="text-white font-semibold text-lg">Frete Gestão</span>
        </div>
        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
          Plataforma Unificada de Gestão de Suporte e Implantação
        </h1>
        <p className="text-white/60 text-lg leading-relaxed">
          Gerencie tickets de suporte, projetos de onboarding e cadastros de clientes em um único lugar.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-8">
          {[
            { label: "Tickets Gerenciados", value: "12.847", icon: "🎫" },
            { label: "Clientes Ativos", value: "284", icon: "🏢" },
            { label: "Implantações", value: "1.203", icon: "🚀" },
            { label: "SLA Médio", value: "98,2%", icon: "✅" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-white font-bold text-xl">{stat.value}</div>
              <div className="text-white/50 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-6 text-white/30 text-xs">
        <span>© 2026 Frete Gestão</span>
        <span>Privacidade</span>
        <span>Termos de Uso</span>
      </div>
    </div>
  );
}

function LoginForm({ onLogin, onForgot }) {
  const [email, setEmail] = useState("regis@fretegestao.com");
  const [password, setPassword] = useState("12345678");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Credenciais inválidas.");
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      onLogin(data.user);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-3 mb-10 lg:hidden">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ background: "#0B2847", color: "#fff" }}>FG</div>
        <span className="font-semibold text-lg" style={{ color: "#0B2847" }}>Frete Gestão</span>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1.5" style={{ color: "#1E293B" }}>Acesse sua conta</h2>
        <p className="text-sm" style={{ color: "#64748B" }}>Entre com suas credenciais corporativas</p>
      </div>

      {erro && (
        <div className="mb-4 p-3 rounded-lg text-xs font-medium bg-red-50 border border-red-200 text-red-700">
          ⚠️ {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#1E293B" }}>E-mail corporativo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
            style={{ border: "1.5px solid #E2E8F0", color: "#1E293B", background: "#fff" }}
            onFocus={(e) => { e.target.style.borderColor = "#0066CC"; e.target.style.boxShadow = "0 0 0 3px rgba(0,102,204,0.12)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#1E293B" }}>Senha</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-lg outline-none transition-all"
              style={{ border: "1.5px solid #E2E8F0", color: "#1E293B", background: "#fff" }}
              onFocus={(e) => { e.target.style.borderColor = "#0066CC"; e.target.style.boxShadow = "0 0 0 3px rgba(0,102,204,0.12)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: "#64748B" }}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex justify-end mt-1.5">
            <button type="button" onClick={onForgot} className="text-xs font-medium cursor-pointer" style={{ color: "#0066CC" }}>
              Esqueceu a senha?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all mt-2 cursor-pointer"
          style={{ background: loading ? "#0F5FC2" : "#0066CC", opacity: loading ? 0.8 : 1 }}
        >
          {loading ? "Entrando..." : "Entrar no Sistema"}
        </button>
      </form>
    </div>
  );
}

function ForgotPasswordForm({ onBack }) {
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleRequestToken(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setErro("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao solicitar recuperação.");

      if (data.reset_token) setToken(data.reset_token);
      setStep("reset");
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, token, password: novaSenha }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao atualizar senha.");

      setStep("success");
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm mb-8 transition-colors cursor-pointer text-slate-500 hover:text-[#0066CC]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Voltar para o login
      </button>

      {erro && (
        <div className="mb-4 p-3 rounded-lg text-xs font-medium bg-red-50 border border-red-200 text-red-700">
          ⚠️ {erro}
        </div>
      )}

      {step === "success" && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-50">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-[#1E293B]">Senha Atualizada!</h2>
          <p className="text-sm leading-relaxed mb-6 text-slate-500">
            A sua palavra-passe foi alterada com sucesso.
          </p>
          <button
            onClick={onBack}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0066CC] cursor-pointer"
          >
            Acessar com a nova senha
          </button>
        </div>
      )}

      {step === "request" && (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2 text-[#1E293B]">Esqueceu a senha?</h2>
            <p className="text-sm leading-relaxed text-slate-500">
              Informe o e-mail corporativo cadastrado para redefinir o acesso.
            </p>
          </div>

          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[#1E293B]">E-mail corporativo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="regis@fretegestao.com"
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none border border-slate-200 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0066CC] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Verificando..." : "Prosseguir"}
            </button>
          </form>
        </>
      )}

      {step === "reset" && (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2 text-[#1E293B]">Definir Nova Senha</h2>
            <p className="text-sm leading-relaxed text-slate-500">
              Conta verificada para <strong>{email}</strong>. Digite a sua nova senha abaixo.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[#1E293B]">Nova Senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none border border-slate-200 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || novaSenha.length < 6}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0066CC] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Gravando..." : "Salvar Nova Senha"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function Login({ onLogin }) {
  const [view, setView] = useState("login");

  return (
    <div className="flex h-full">
      <LeftBanner />
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        {view === "login" ? (
          <LoginForm onLogin={onLogin} onForgot={() => setView("forgot")} />
        ) : (
          <ForgotPasswordForm onBack={() => setView("login")} />
        )}
      </div>
    </div>
  );
}