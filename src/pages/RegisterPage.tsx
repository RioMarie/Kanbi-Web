import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useRegister } from "../services/auth-service";

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

export default function RegisterPage() {
  if (localStorage.getItem("token")) return <Navigate to="/" replace />;

  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const {
    mutate: register,
    isPending,
    isError,
    isSuccess,
    error,
  } = useRegister();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValidationError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setValidationError("Passwords do not match.");
      return;
    }
    register({ email: form.email, password: form.password });
  }

  const errorMessage =
    validationError ||
    (isError ? (error as Error)?.message || "Registration failed." : "");

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "linear-gradient(135deg, #0052cc 0%, #1d6fa4 50%, #0747a6 100%)",
      }}
    >
      {/* Left branding */}
      <div className="hidden lg:flex flex-col justify-center px-20 w-[600px] shrink-0">
        <div className="mb-10">
          <KanbiLogo />
        </div>
        <p className="text-white text-[2rem] font-bold leading-tight mb-4">
          Start organizing
          <br />
          in minutes.
        </p>
        <p className="text-blue-200 text-base leading-relaxed mb-10 ">
          Create boards, add lists, and move cards to track progress across
          every project.
        </p>

        <div className="flex flex-col gap-4 mt-4">
          {[
            "Free forever",
            "Unlimited boards and cards",
            "Drag & drop task management",
          ].map((label) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-blue-100 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-2">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden justify-center mb-4">
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

            <div className="p-8">
              {isSuccess ? (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <svg
                      className="w-7 h-7 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">
                    Account created!
                  </h2>
                  <p className="text-sm text-slate-500 mb-6">
                    Your account is ready. Use your credentials to sign in.
                  </p>
                  <Link
                    to="/login"
                    className="w-full rounded-lg mt-5 px-4 py-2.5 text-sm font-semibold text-white text-center transition-opacity shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, #0052cc, #1d6fa4)",
                    }}
                  >
                    Go to sign in
                  </Link>
                </div>
              ) : (
                <>
                  <h4 className="text-2xl font-bold text-slate-800 mb-2">
                    Create your account
                  </h4>
                  <p className="text-sm text-slate-500">
                    Get started for free.
                  </p>

                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-5 mb-5 mt-6"
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
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={form.email}
                        onChange={handleChange}
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
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          value={form.password}
                          onChange={handleChange}
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

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="confirm"
                        className="text-sm font-medium text-slate-600 text-left"
                      >
                        Confirm password
                      </label>
                      <input
                        id="confirm"
                        name="confirm"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={form.confirm}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition"
                      />
                    </div>

                    {errorMessage && (
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
                        <p className="text-sm text-red-500">{errorMessage}</p>
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
                      {isPending ? "Creating account…" : "Create account"}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-blue-500 hover:text-blue-600 font-semibold"
                    >
                      Sign in
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
