import type { ReactNode } from "react";
import { Shield } from "lucide-react";

const dotGrid = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><circle cx='1.5' cy='1.5' r='1.5' fill='white'/></svg>")`;

function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  const isLight = tone === "light";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          isLight ? "bg-white/15" : "bg-[#002663]"
        }`}
      >
        <Shield className="h-4.5 w-4.5" size={18} color="white" strokeWidth={2.4} />
      </div>
      <span
        className={`text-[15px] font-semibold tracking-tight ${
          isLight ? "text-white" : "text-[#002663]"
        }`}
      >
        Oware
      </span>
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen w-full bg-[#f8f9fc]">
      {/* Left brand panel */}
      <aside className="relative hidden lg:flex lg:w-[52%] flex-col overflow-hidden bg-[#002663] p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: dotGrid, opacity: 0.06 }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-40 h-[580px] w-[580px] rounded-full border border-white/[0.07]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-20 h-[380px] w-[380px] rounded-full border border-white/[0.07]"
        />

        <div className="relative z-10">
          <Logo tone="light" />
        </div>

        <div className="relative z-10 my-auto max-w-[460px]">
          <p
            className="text-[11px] font-bold uppercase text-white/40"
            style={{ letterSpacing: "0.22em" }}
          >
            Core Banking Platform
          </p>
          <h1
            className="mt-5 font-extrabold text-white"
            style={{ fontSize: "3.6rem", lineHeight: 1.08, letterSpacing: "-0.02em" }}
          >
            Banking built for
            <br />
            what's next.
          </h1>
          <p className="mt-6 text-[15px] text-white/50 max-w-[300px]">
            One platform to manage clients, accounts, products and compliance.
          </p>

          <ul className="mt-10 space-y-3.5">
            {[
              "Real-time transaction monitoring",
              "Multi-branch client management",
              "SOC 2 certified infrastructure",
            ].map((label) => (
              <li key={label} className="flex items-center gap-3">
                <span
                  className="h-[6px] w-[6px] rounded-full bg-white/40"
                  style={{ boxShadow: "0 0 0 0.5px rgba(255,255,255,0.4)" }}
                />
                <span className="text-[13.5px] font-medium text-white/55">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-[12px] text-white/20">
          © {year} Oware · All rights reserved
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 lg:hidden">
            <Logo tone="dark" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
