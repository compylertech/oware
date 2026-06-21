import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Chelsea Bank" },
      { name: "description", content: "Chelsea Bank workspace dashboard." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] px-8 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-[11px] font-bold uppercase text-gray-400" style={{ letterSpacing: "0.22em" }}>
          Chelsea Bank
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-900">
          Welcome back.
        </h1>
        <p className="mt-3 text-gray-500">
          Your workspace dashboard will live here.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/signin"
            className="rounded-xl bg-[#002663] px-5 py-2.5 text-sm font-bold text-white"
          >
            Go to sign in
          </Link>
          <Link
            to="/forgot-password"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700"
          >
            Reset password
          </Link>
        </div>
      </div>
    </div>
  );
}
