import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useLogin } from "../services/auth-service";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  ) : (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function KanbiLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "md" ? "w-10 h-10" : "w-8 h-8";
  const icon = size === "md" ? "w-6 h-6" : "w-4 h-4";
  const text = size === "md" ? "text-2xl" : "text-xl";
  return (
    <div className="flex items-center gap-3">
      <div
        className={`${box} bg-white rounded-xl flex items-center justify-center shadow-lg`}
      >
        <svg
          className={`${icon} text-blue-600`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <rect x="3" y="4" width="7" height="14" rx="1.5" />
          <rect x="14" y="4" width="7" height="14" rx="1.5" />
        </svg>
      </div>
      <span className={`text-white ${text} font-bold tracking-tight`}>
        Kanbi
      </span>
    </div>
  );
}

export default function LoginPage() {
  if (localStorage.getItem("token")) return <Navigate to="/" replace />;

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    mutate: login,
    isPending,
    isError,
  } = useLogin({
    onSuccess: () => navigate("/"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login({ email, password });
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "linear-gradient(135deg, #0052cc 0%, #1d6fa4 50%, #0747a6 100%)",
      }}
    >
      {/* Left branding */}
      <div className="hidden lg:flex flex-col justify-center px-16 w-[600px] shrink-0">
        <div className="mb-10">
          <KanbiLogo />
        </div>
        <p className="text-white text-[2rem] font-bold leading-tight mb-4">
          Organize work,
          <br />
          your way.
        </p>
        <p className="text-blue-200 text-base leading-relaxed mb-10 ">
          Boards, lists, and cards to help you get a clearer view of what needs
          to get done.
        </p>

        {/* Decorative mini board preview */}
        <div className="flex gap-2 opacity-80 mt-6">
          {[
            { title: "To do", cards: ["Design mockup", "Write copy"] },
            { title: "In progress", cards: ["API integration"] },
            { title: "Done", cards: ["Setup repo", "Auth flow"] },
          ].map((col) => (
            <div
              key={col.title}
              className="flex-1 rounded-lg p-3"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <p className="text-white/70 text-xs font-semibold mb-3 px-0.5">
                {col.title}
              </p>
              <div className="flex flex-col gap-1">
                {col.cards.map((c) => (
                  <div key={c} className="rounded bg-white/20 px-2 py-1.5 mt-2">
                    <p className="text-white text-xs">{c}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden justify-center mb-8">
            <KanbiLogo size="sm" />
          </div>

          <div
            className="rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.97)" }}
          >
            <div
              className="h-1 w-full"
              style={{ background: "linear-gradient(90deg, #0052cc, #1d6fa4)" }}
            />

            <div className="p-8 ">
              <h4 className="text-2xl font-bold text-slate-800 mb-2">
                Welcome back
              </h4>
              <p className="text-sm text-slate-500 mb-7">
                Sign in to your account to continue
              </p>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-5 mb-5 mt-5"
              >
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-600 text-left"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-600 text-left"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>

                {isError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
                    <svg
                      className="w-4 h-4 text-red-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-red-500">
                      Invalid email or password.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #0052cc, #1d6fa4)",
                  }}
                >
                  {isPending ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-500 hover:text-blue-600 font-semibold"
                >
                  Sign up free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
