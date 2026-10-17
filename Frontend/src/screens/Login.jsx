import { useState } from "react";

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

// ── Login form ──────────────────────────────────────────────────────────────
function LoginForm({ onLogin, onForgot }) {
  const [email, setEmail] = useState("regis.rinaldi@fretegestao.com.br");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1000);
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#1E293B" }}>E-mail corporativo</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
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
              type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-lg outline-none transition-all"
              style={{ border: "1.5px solid #E2E8F0", color: "#1E293B", background: "#fff" }}
              onFocus={(e) => { e.target.style.borderColor = "#0066CC"; e.target.style.boxShadow = "0 0 0 3px rgba(0,102,204,0.12)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#64748B" }}>
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex justify-end mt-1.5">
            <button type="button" onClick={onForgot} className="text-xs font-medium" style={{ color: "#0066CC" }}>
              Esqueceu a senha?
            </button>
          </div>
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all mt-2"
          style={{ background: loading ? "#0F5FC2" : "#0066CC", opacity: loading ? 0.8 : 1 }}
          onMouseEnter={(e) => { if (!loading) e.target.style.background = "#0054a8"; }}
          onMouseLeave={(e) => { if (!loading) e.target.style.background = "#0066CC"; }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Entrando...
            </span>
          ) : "Entrar no Sistema"}
        </button>
      </form>
    </div>
  );
}

// ── Forgot password form ────────────────────────────────────────────────────
function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1200);
  }

  return (
    <div className="w-full max-w-sm">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm mb-8 transition-colors"
        style={{ color: "#64748B" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#0066CC"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Voltar para o login
      </button>

      {sent ? (
        /* Success state */
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "#ECFDF5" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#1E293B" }}>E-mail enviado!</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#64748B" }}>
            Enviamos um link de redefinição de senha para{" "}
            <strong style={{ color: "#1E293B" }}>{email}</strong>.
            <br /><br />
            Verifique sua caixa de entrada e a pasta de spam. O link expira em <strong>30 minutos</strong>.
          </p>
          <button
            onClick={onBack}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#0066CC" }}
          >
            Voltar para o login
          </button>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "#EBF4FF" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#1E293B" }}>Esqueceu a senha?</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
              Sem problemas. Informe o e-mail corporativo cadastrado na sua conta e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#1E293B" }}>
                E-mail corporativo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@fretegestao.com.br"
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-lg outline-none transition-all"
                style={{ border: "1.5px solid #E2E8F0", color: "#1E293B", background: "#fff" }}
                onFocus={(e) => { e.target.style.borderColor = "#0066CC"; e.target.style.boxShadow = "0 0 0 3px rgba(0,102,204,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
              />
              <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>
                Um link de redefinição de senha será enviado para este e-mail.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
              style={{
                background: loading || !email.trim() ? "#94A3B8" : "#0066CC",
                cursor: loading || !email.trim() ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enviando...
                </span>
              ) : "Enviar link de redefinição"}
            </button>
          </form>

          <div
            className="mt-4 p-3 rounded-xl text-xs"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}
          >
            ⚠️ O link expira em <strong>30 minutos</strong>. Caso não receba o e-mail, verifique a pasta de spam ou entre em contato com o administrador do sistema.
          </div>
        </>
      )}
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────
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
