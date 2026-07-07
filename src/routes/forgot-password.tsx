import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Loader2, MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/patterns";
import { authApi, type TenantOption } from "@/api/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Oware" },
      { name: "description", content: "Reset your Oware account password." },
    ],
  }),
  component: ForgotPasswordPage,
});

type Step = "email" | "tenant" | "sent";

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#002663] focus:ring-2 focus:ring-[#002663]/10";

function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(false);

  async function sendFor(tenantCode: string) {
    setLoading(true);
    try {
      await authApi.forgotPassword(email, tenantCode);
    } catch {
      // The backend already replies with a generic "sent if it exists" message
      // regardless of whether the account exists — treat any failure here (e.g.
      // a transient network error) the same way rather than leaking which
      // emails are registered.
    } finally {
      setLoading(false);
      setStep("sent");
    }
  }

  async function onSubmitEmail(e: FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    setEmail(normalizedEmail);
    setLoading(true);
    try {
      const tenants = await authApi.lookupTenants(normalizedEmail);
      if (tenants.length === 0) {
        // Don't reveal that the email isn't registered anywhere — same
        // generic outcome as a successful send.
        setStep("sent");
      } else if (tenants.length === 1) {
        await sendFor(tenants[0].tenantCode);
      } else {
        setTenantOptions(tenants);
        setStep("tenant");
      }
    } catch {
      setStep("sent");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      {step === "email" && (
        <>
          <Link
            to="/signin"
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>

          <h2 className="mt-5 text-[2rem] font-semibold tracking-tight text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-[14px] text-gray-400">
            Enter the email associated with your account and we'll send you a reset link.
          </p>

          <form onSubmit={(e) => void onSubmitEmail(e)} className="mt-7 space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[14px] font-semibold text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="kwabena@oware.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              full
              icon={loading ? <Loader2 size={16} className="animate-spin" /> : undefined}
              iconRight={!loading ? <ArrowRight size={16} /> : undefined}
            >
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </>
      )}

      {step === "tenant" && (
        <>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <h2 className="mt-5 text-[2rem] font-semibold tracking-tight text-gray-900">
            Select your workspace
          </h2>
          <p className="mt-2 text-[14px] text-gray-400">
            This email is linked to more than one workspace — which one do you want to reset the
            password for?
          </p>
          <div className="mt-6 space-y-2">
            {tenantOptions.map((option) => (
              <button
                key={option.tenantCode}
                type="button"
                disabled={loading}
                onClick={() => void sendFor(option.tenantCode)}
                className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-[#002663] hover:bg-[#002663]/5"
              >
                <span className="block text-[14px] font-semibold text-gray-900">
                  {option.tenantName}
                </span>
                <span className="block text-[12px] text-gray-400">{option.tenantCode}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "sent" && (
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#002663]/10">
            <MailCheck size={28} className="text-[#002663]" />
          </div>
          <h2 className="mt-6 text-[2rem] font-semibold tracking-tight text-gray-900">
            Check your inbox
          </h2>
          <p className="mt-3 text-[14px] text-gray-400">
            If an account exists for <span className="font-medium text-gray-700">{email}</span>,
            you'll receive a password reset link shortly.
          </p>
          <Link
            to="/signin"
            className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#002663] hover:underline"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
