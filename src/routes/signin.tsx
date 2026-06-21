import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — Chelsea Bank" },
      { name: "description", content: "Sign in to your Chelsea Bank workspace." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#002663] focus:ring-2 focus:ring-[#002663]/10";

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/" });
    }, 900);
  }

  return (
    <AuthLayout>
      <h2 className="text-[2rem] font-extrabold tracking-tight text-gray-900">Sign in</h2>
      <p className="mt-2 text-[14px] text-gray-400">
        Enter your credentials to access your workspace.
      </p>

      {error && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3">
          <AlertCircle size={16} className="mt-0.5 text-red-600" />
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-7 space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[14px] font-semibold text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@chelseabank.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-[14px] font-semibold text-gray-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[12px] font-semibold text-[#002663] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#002663] py-3 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-[13px] text-gray-500">
        Having trouble signing in?{" "}
        <a href="#" className="font-semibold text-[#002663] hover:underline">
          Contact support
        </a>
      </p>
    </AuthLayout>
  );
}
