import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/patterns";
import { authApi, useAuthSession, type TenantOption } from "@/api/auth";
import { apiErrorMessage } from "@/api/backend";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — Oware" },
      { name: "description", content: "Sign in to your Oware workspace." },
    ],
  }),
  component: SignInPage,
});

type Step = "email" | "tenant" | "password";

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#002663] focus:ring-2 focus:ring-[#002663]/10";

function SignInPage() {
  const navigate = useNavigate();
  const session = useAuthSession();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [tenant, setTenant] = useState<TenantOption | null>(null);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (e.g. navigated here directly) — no reason to show the form.
  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  function backToEmail() {
    setStep("email");
    setTenant(null);
    setTenantOptions([]);
    setPassword("");
    setError(null);
  }

  async function onSubmitEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }
    setEmail(normalizedEmail);
    setLoading(true);
    try {
      const tenants = await authApi.lookupTenants(normalizedEmail);
      if (tenants.length === 0) {
        setError("No account found for this email.");
      } else if (tenants.length === 1) {
        setTenant(tenants[0]);
        setStep("password");
      } else {
        setTenantOptions(tenants);
        setStep("tenant");
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Something went wrong looking up your account."));
    } finally {
      setLoading(false);
    }
  }

  function selectTenant(option: TenantOption) {
    setTenant(option);
    setError(null);
    setStep("password");
  }

  async function onSubmitPassword(e: FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setError(null);
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      await authApi.login(email, password, tenant.tenantCode);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-[2rem] font-semibold tracking-tight text-gray-900">Sign in</h2>
      <p className="mt-2 text-[14px] text-gray-400">
        {step === "email" && "Enter your email to get started."}
        {step === "tenant" && "Select the workspace you'd like to sign in to."}
        {step === "password" && "Enter your password to access your workspace."}
      </p>

      {error && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3">
          <AlertCircle size={16} className="mt-0.5 text-red-600" />
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      {step === "email" && (
        <form onSubmit={(e) => void onSubmitEmail(e)} className="mt-7 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[14px] font-semibold text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="akosua@oware.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            full
            icon={loading ? <Loader2 size={16} className="animate-spin" /> : undefined}
            iconRight={!loading ? <ArrowRight size={16} /> : undefined}
          >
            {loading ? "Checking…" : "Continue"}
          </Button>
        </form>
      )}

      {step === "tenant" && (
        <div className="mt-7 space-y-3">
          <button
            type="button"
            onClick={backToEmail}
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="space-y-2">
            {tenantOptions.map((option) => (
              <button
                key={option.tenantCode}
                type="button"
                onClick={() => selectTenant(option)}
                className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-[#002663] hover:bg-[#002663]/5"
              >
                <span className="block text-[14px] font-semibold text-gray-900">
                  {option.tenantName}
                </span>
                <span className="block text-[12px] text-gray-400">{option.tenantCode}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "password" && (
        <form onSubmit={(e) => void onSubmitPassword(e)} className="mt-7 space-y-5">
          <button
            type="button"
            onClick={backToEmail}
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={14} />
            {email}
            {tenant && tenantOptions.length > 1 ? ` · ${tenant.tenantName}` : ""}
          </button>

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
                autoFocus
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

          <Button
            type="submit"
            disabled={loading}
            full
            icon={loading ? <Loader2 size={16} className="animate-spin" /> : undefined}
            iconRight={!loading ? <ArrowRight size={16} /> : undefined}
          >
            {loading ? "Signing in…" : "Continue"}
          </Button>
        </form>
      )}

      <p className="mt-8 text-center text-[13px] text-gray-500">
        Having trouble signing in?{" "}
        <a href="#" className="font-semibold text-[#002663] hover:underline">
          Contact support
        </a>
      </p>
    </AuthLayout>
  );
}
