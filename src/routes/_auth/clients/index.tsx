import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { Search, ChevronDown, MoreVertical, Eye, Pencil, Trash2, Plus } from "lucide-react";
import { StatusPill, type StatusKind } from "@/components/common/StatusPill";
import { Button, EmptyRow, Table, TableCard, Td, Th, THead, Tr } from "@/components/patterns";
import { FONTS } from "@/lib/tokens";
import { useClients, removeClient, type Client, type ClientStatus } from "@/lib/mockStore";

export const Route = createFileRoute("/_auth/clients/")({
  component: ClientsPage,
});

const PAGE_SIZE = 10;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ClientsPage() {
  const navigate = useNavigate();
  const clients = useClients();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ClientStatus>("All");
  const [statusOpen, setStatusOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);
  const [loading] = useState(false);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const m =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.clientNumber.toLowerCase().includes(search.toLowerCase()) ||
        c.externalId.toLowerCase().includes(search.toLowerCase());
      const s = statusFilter === "All" || c.status === statusFilter;
      return m && s;
    });
  }, [clients, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  const totalActive = clients.filter((c) => c.status === "Active").length;
  const totalPending = clients.filter((c) => c.status === "Pending").length;

  const statusDotColor =
    statusFilter === "Active" ? "#067647" : statusFilter === "Pending" ? "#D97706" : null;

  // close popovers on outside click
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setStatusOpen(false);
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function goToClient(id: string) {
    navigate({ to: "/clients/$clientId", params: { clientId: id } });
  }

  return (
    <div ref={rootRef} style={{ backgroundColor: "#F4F6FB", minHeight: "100%" }} className="p-7">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 16,
          background: "linear-gradient(135deg, #001844 0%, #002663 60%, #1a4080 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "#3B82F6",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage: "radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="relative px-8 pt-7 pb-0">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div
                style={{
                  color: "rgba(201,168,76,0.9)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontWeight: 300,
                }}
              >
                Oware
              </div>
              <h1
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 26,
                  fontWeight: 100,
                  color: "white",
                  letterSpacing: "-0.02em",
                  marginTop: 6,
                }}
              >
                Clients
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                Manage and view all registered clients
              </p>
            </div>
            <Button
              onClick={() => navigate({ to: "/clients/add" })}
              variant="success"
              icon={<Plus size={16} />}
            >
              Create Client
            </Button>
          </div>

          {/* Stat strip */}
          <div
            className="mt-7 grid grid-cols-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            {[
              { label: "Total Clients", value: clients.length, desc: "All records" },
              { label: "Active", value: totalActive, desc: "Currently active" },
              { label: "Pending", value: totalPending, desc: "Awaiting approval" },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: "18px 20px",
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
              >
                <div
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 300,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 28,
                    fontWeight: 100,
                    color: "white",
                    lineHeight: 1.2,
                    marginTop: 4,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center gap-3">
        <div className="relative" style={{ width: 280 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#5B6A86",
            }}
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search clients…"
            className="w-full bg-white outline-none transition-colors"
            style={{
              border: "1px solid #DDE4EF",
              borderRadius: 8,
              padding: "8px 12px 8px 36px",
              fontSize: 13,
              color: "#0D1B3E",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#002663")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#DDE4EF")}
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setStatusOpen((v) => !v)}
            className="inline-flex items-center gap-2 bg-white"
            style={{
              border: "1px solid #DDE4EF",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              color: "#0D1B3E",
              fontWeight: 500,
            }}
          >
            {statusDotColor && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: statusDotColor,
                  display: "inline-block",
                }}
              />
            )}
            <span>
              Status: <span style={{ fontWeight: 300 }}>{statusFilter}</span>
            </span>
            <ChevronDown
              size={14}
              style={{
                transition: "transform 0.15s",
                transform: statusOpen ? "rotate(180deg)" : "none",
                color: "#6B7A99",
              }}
            />
          </button>
          {statusOpen && (
            <div
              className="absolute z-10 mt-1 bg-white"
              style={{
                border: "1px solid #DDE4EF",
                borderRadius: 8,

                minWidth: 180,
                padding: 4,
              }}
            >
              {(["All", "Active", "Pending"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setStatusFilter(opt === "All" ? "All" : opt);
                    setStatusOpen(false);
                    setPage(1);
                  }}
                  className="block w-full text-left"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    fontSize: 13,
                    color: "#0D1B3E",
                    background: statusFilter === opt ? "rgba(0,38,99,0.1)" : "transparent",
                  }}
                >
                  {opt === "All" ? "All Statuses" : opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="mt-4">
        <TableCard
          pagination={{
            page: currentPage,
            totalPages,
            totalItems: filtered.length,
            itemLabel: "clients",
            onPageChange: setPage,
          }}
          style={{ borderRadius: 12 }}
        >
          <Table>
            <THead>
              {["Name", "Client No.", "External ID", "Status", "Office Name", ""].map((h, i) => (
                <Th key={i} style={{ fontSize: 12, fontWeight: 500, padding: "12px 14px" }}>
                  {h}
                </Th>
              ))}
            </THead>
            <tbody>
              {loading ? (
                <EmptyRow colSpan={6}>Loading clients…</EmptyRow>
              ) : pageRows.length === 0 ? (
                <EmptyRow colSpan={6}>No clients found</EmptyRow>
              ) : (
                pageRows.map((c) => (
                  <Tr
                    key={c.id}
                    onClick={() => goToClient(c.id)}
                    className="group cursor-pointer"
                    hover
                  >
                    <Td style={{ padding: 14 }}>
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 999,
                            background: "#E0E9FF",
                            color: "#002663",
                            fontFamily: FONTS.body,
                            fontWeight: 100,
                            fontSize: 11,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {initials(c.name)}
                        </div>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#0D1B3E",
                          }}
                        >
                          {c.name}
                        </span>
                      </div>
                    </Td>
                    <Td
                      style={{
                        padding: 14,
                        fontFamily: FONTS.mono,
                        fontSize: 13,
                        color: "#374151",
                      }}
                    >
                      {c.clientNumber}
                    </Td>
                    <Td
                      muted
                      style={{
                        padding: 14,
                        fontFamily: FONTS.mono,
                        fontSize: 13,
                      }}
                    >
                      {c.externalId}
                    </Td>
                    <Td style={{ padding: 14 }}>
                      <StatusPill status={c.status as StatusKind} />
                    </Td>
                    <Td muted style={{ padding: 14, fontSize: 13 }}>
                      {c.officeName}
                    </Td>
                    <Td
                      style={{ padding: 14, width: 60, textAlign: "right" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative inline-block">
                        <button
                          onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                          className={
                            menuOpen === c.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#6B7A99",
                            transition: "opacity 0.15s, background 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF2F8")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {menuOpen === c.id && (
                          <div
                            className="absolute right-0 z-10 mt-1 bg-white"
                            style={{
                              border: "1px solid #DDE4EF",
                              borderRadius: 8,

                              minWidth: 140,
                              padding: 4,
                            }}
                          >
                            <MenuItem
                              icon={<Eye size={14} />}
                              label="View"
                              onClick={() => {
                                setMenuOpen(null);
                                goToClient(c.id);
                              }}
                            />
                            <MenuItem
                              icon={<Pencil size={14} />}
                              label="Edit"
                              onClick={() => setMenuOpen(null)}
                            />
                            <MenuItem
                              icon={<Trash2 size={14} />}
                              label="Delete"
                              danger
                              onClick={() => {
                                setMenuOpen(null);
                                setConfirmDelete(c);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </TableCard>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(13,27,62,0.45)" }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderRadius: 12,
              padding: 24,
              width: 380,
            }}
          >
            <h3
              style={{
                fontFamily: FONTS.body,
                fontSize: 17,
                fontWeight: 100,
                color: "#0D1B3E",
              }}
            >
              Delete client?
            </h3>
            <p style={{ fontSize: 13, color: "#6B7A99", marginTop: 8 }}>
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This cannot be
              undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setConfirmDelete(null)} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  removeClient(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                variant="danger"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 text-left"
      style={{
        padding: "8px 10px",
        borderRadius: 6,
        fontSize: 13,
        color: danger ? "#EF4444" : "#374151",
        background: "transparent",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = danger ? "#FEF2F2" : "#F7FAFF")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon}
      {label}
    </button>
  );
}
