import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Loader2, MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Chelsea Bank" },
      { name: "description", content: "Reset your Chelsea Bank account password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const inputCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#002663] focus:ring-2 focus:ring-[#002663]/10";

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 900);
  }

  return (
    <AuthLayout>
      {!sent ? (
        <>
          <Link
            to="/signin"
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>

          <h2 className="mt-5 text-[2rem] font-extrabold tracking-tight text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-[14px] text-gray-400">
            Enter the email associated with your account and we'll send you a reset link.
          </p>

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

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#002663] py-3 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#002663]/10">
            <MailCheck size={28} className="text-[#002663]" />
          </div>
          <h2 className="mt-6 text-[2rem] font-extrabold tracking-tight text-gray-900">
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
