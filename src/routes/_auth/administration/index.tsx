import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Shield, Plus, Search, Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import { FONTS, tokens } from "@/lib/tokens";
import { Modal, MField, MInput, MSelect } from "@/components/common/Modal";
import { Pill, Table, TableCard, Td, Th, THead, Tr, Tabs, Button } from "@/components/patterns";
import { StatusPill } from "@/components/common/StatusPill";

export const Route = createFileRoute("/_auth/administration/")({
  component: AdminPage,
});

type TabKey = "users" | "roles" | "audit" | "config";

const TABS: { key: TabKey; label: string }[] = [
  { key: "users", label: "Users" },
  { key: "roles", label: "Roles & Permissions" },
  { key: "audit", label: "Audit Log" },
  { key: "config", label: "System Config" },
];

function AdminPage() {
  const [tab, setTab] = useState<TabKey>("users");

  return (
    <div
      style={{
        padding: "24px 28px",
        background: tokens.bg,
        minHeight: "100%",
        fontFamily: FONTS.body,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 100,
              letterSpacing: "0.14em",
              color: "#5B6A86",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            ADMINISTRATION
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: "#EAF0FB",
                color: "#002663",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Settings size={20} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 26,
                  fontWeight: 200,
                  color: "#16233F",
                  letterSpacing: "-0.02em",
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                Administration
              </h1>
              <div style={{ fontSize: 13, color: "#5B6A86", marginTop: 4 }}>
                Manage users, roles, permissions and system configuration.
              </div>
            </div>
          </div>
        </div>
        <Pill color="#002663" bg="#EAF0FB" style={{ fontWeight: 100, padding: "5px 10px" }}>
          Core layer
        </Pill>
      </div>

      {/* Tabs */}
      <Tabs items={TABS} value={tab} onChange={setTab} style={{ marginBottom: 18 }} />

      {tab === "users" && <UsersTab />}
      {tab === "roles" && <RolesTab />}
      {tab === "audit" && <AuditTab />}
      {tab === "config" && <ConfigTab />}
    </div>
  );
}

/* ============== Shared bits ============== */

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${tokens.border}`,
  borderRadius: 12,
};

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 100, color: "#16233F" }}>{title}</div>
      {right}
    </div>
  );
}

/* ============== Users Tab ============== */

type User = {
  name: string;
  id: string;
  role: string;
  branch: string;
  lastLogin: string;
  status: "Active" | "Suspended" | "Pending";
};

const INITIAL_USERS: User[] = [
  {
    name: "Kwame Asante",
    id: "USR-001",
    role: "Super Admin",
    branch: "All Branches",
    lastLogin: "Today 09:14",
    status: "Active",
  },
  {
    name: "Abena Mensah",
    id: "USR-002",
    role: "Branch Manager",
    branch: "Kumasi",
    lastLogin: "Yesterday 17:32",
    status: "Active",
  },
  {
    name: "Kofi Boateng",
    id: "USR-003",
    role: "Loan Officer",
    branch: "Head Office",
    lastLogin: "3 days ago",
    status: "Active",
  },
  {
    name: "Ama Darko",
    id: "USR-004",
    role: "Teller",
    branch: "Takoradi",
    lastLogin: "5 days ago",
    status: "Active",
  },
  {
    name: "Yaw Owusu",
    id: "USR-005",
    role: "Auditor",
    branch: "All Branches",
    lastLogin: "12 Jun 2026",
    status: "Suspended",
  },
  {
    name: "Efua Tetteh",
    id: "USR-006",
    role: "Data Entry",
    branch: "Head Office",
    lastLogin: "Never",
    status: "Pending",
  },
];

function UsersTab() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Loan Officer",
    branch: "Head Office",
  });

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "Suspended" ? "Active" : "Suspended" } : u,
      ),
    );
  };

  return (
    <>
      <TableCard
        title="System Users"
        actions={
          <Button variant="success" onClick={() => setInviteOpen(true)} icon={<Plus size={14} />}>
            Invite user
          </Button>
        }
      >
        <Table>
          <THead>
            <Th>Name</Th>
            <Th>User ID</Th>
            <Th>Role</Th>
            <Th>Branch</Th>
            <Th>Last Login</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </THead>
          <tbody>
            {users.map((u) => (
              <Tr key={u.id} hover>
                <Td style={{ fontWeight: 300 }}>{u.name}</Td>
                <Td style={{ fontFamily: FONTS.mono, fontSize: 12, color: "#4A5878" }}>{u.id}</Td>
                <Td>{u.role}</Td>
                <Td>{u.branch}</Td>
                <Td muted>{u.lastLogin}</Td>
                <Td>
                  <StatusPill status={u.status} />
                </Td>
                <Td>
                  <button
                    onClick={() => toast.info(`Edit ${u.name}`)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#002663",
                      fontSize: 13,
                      fontWeight: 300,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Edit
                  </button>
                  <span style={{ color: tokens.border, margin: "0 8px" }}>·</span>
                  {u.status === "Suspended" ? (
                    <button
                      onClick={() => toggleStatus(u.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#067647",
                        fontSize: 13,
                        fontWeight: 300,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Activate
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleStatus(u.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#D92D20",
                        fontSize: 13,
                        fontWeight: 300,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Suspend
                    </button>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite User"
        maxWidth={460}
        footer={
          <>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={() => {
                setInviteOpen(false);
                toast.success(`Invite sent to ${form.email || form.name}`);
                setForm({ name: "", email: "", role: "Loan Officer", branch: "Head Office" });
              }}
            >
              Send Invite
            </Button>
          </>
        }
      >
        <MField label="Full Name">
          <MInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </MField>
        <MField label="Email">
          <MInput
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </MField>
        <MField label="Role">
          <MSelect
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              "Super Admin",
              "Branch Manager",
              "Loan Officer",
              "Teller",
              "Auditor",
              "Data Entry",
            ]}
          />
        </MField>
        <MField label="Branch">
          <MSelect
            value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value })}
            options={["All Branches", "Head Office", "Kumasi", "Takoradi"]}
          />
        </MField>
      </Modal>
    </>
  );
}

/* ============== Roles & Permissions Tab ============== */

const ROLES = [
  {
    name: "Super Admin",
    desc: "Full system access, all modules",
    perms: 6,
    color: "#002663",
    bg: "#EAF0FB",
  },
  {
    name: "Branch Manager",
    desc: "Branch-level oversight, approve transactions",
    perms: 4,
    color: "#3551A4",
    bg: "#EEF2FB",
  },
  {
    name: "Loan Officer",
    desc: "Loans module read/write, no admin",
    perms: 3,
    color: "#0F6E56",
    bg: "#E1F5EE",
  },
  {
    name: "Teller",
    desc: "Savings, withdrawals, account lookup",
    perms: 2,
    color: "#B45309",
    bg: "#FFFBEB",
  },
];

const MATRIX: { module: string; perms: [boolean, boolean, boolean, boolean] }[] = [
  { module: "Loans", perms: [true, true, true, false] },
  { module: "Savings", perms: [true, true, false, true] },
  { module: "Cooperative", perms: [true, true, false, false] },
  { module: "Reports", perms: [true, true, false, false] },
  { module: "Administration", perms: [true, false, false, false] },
];

function RolesTab() {
  return (
    <>
      <SectionHeader
        title="Roles & Permissions"
        right={
          <Button variant="success" onClick={() => toast.info("New role")} icon={<Plus size={14} />}>
            New role
          </Button>
        }
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {ROLES.map((r) => (
          <div key={r.name} style={{ ...cardStyle, padding: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: r.bg,
                    color: r.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 100, color: "#16233F" }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "#5B6A86", marginTop: 2 }}>{r.desc}</div>
                </div>
              </div>
              <button
                onClick={() => toast.info(`Edit ${r.name}`)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#002663",
                  fontSize: 13,
                  fontWeight: 300,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Edit
              </button>
            </div>
            <div style={{ fontSize: 12, color: "#5B6A86", marginTop: 8 }}>
              {r.perms} permissions
            </div>
          </div>
        ))}
      </div>

      <TableCard title="Permissions Matrix">
        <Table>
          <THead>
            <Th>Module</Th>
            {ROLES.map((r) => (
              <Th key={r.name} align="center">
                {r.name}
              </Th>
            ))}
          </THead>
          <tbody>
            {MATRIX.map((row) => (
              <Tr key={row.module} hover>
                <Td style={{ fontWeight: 300 }}>{row.module}</Td>
                {row.perms.map((on, i) => (
                  <Td
                    key={i}
                    align="center"
                    style={{
                      fontSize: 16,
                      color: on ? "#067647" : tokens.border,
                      fontWeight: 100,
                    }}
                  >
                    {on ? "✓" : "—"}
                  </Td>
                ))}
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </>
  );
}

/* ============== Audit Log Tab ============== */

const AUDIT_ROWS = [
  {
    ts: "22 Jun 2026 09:14",
    user: "Kwame Asante",
    action: "Login",
    module: "System",
    rec: "—",
    ip: "197.255.32.1",
    status: "Success" as const,
  },
  {
    ts: "22 Jun 2026 09:02",
    user: "Kofi Boateng",
    action: "Created loan application",
    module: "Loans",
    rec: "LN-20260044",
    ip: "197.255.32.4",
    status: "Success" as const,
  },
  {
    ts: "21 Jun 2026 17:32",
    user: "Abena Mensah",
    action: "Approved disbursement",
    module: "Loans",
    rec: "LN-20260039",
    ip: "10.0.0.12",
    status: "Success" as const,
  },
  {
    ts: "21 Jun 2026 16:55",
    user: "Ama Darko",
    action: "Posted savings deposit",
    module: "Savings",
    rec: "SAV-00871",
    ip: "10.0.0.15",
    status: "Success" as const,
  },
  {
    ts: "21 Jun 2026 15:10",
    user: "Kwame Asante",
    action: "Updated policy rule",
    module: "Administration",
    rec: "POL-007",
    ip: "197.255.32.1",
    status: "Success" as const,
  },
  {
    ts: "20 Jun 2026 11:45",
    user: "Yaw Owusu",
    action: "Export report",
    module: "Reports",
    rec: "RPT-2026-06",
    ip: "197.255.32.8",
    status: "Success" as const,
  },
  {
    ts: "20 Jun 2026 09:30",
    user: "Efua Tetteh",
    action: "Failed login attempt",
    module: "System",
    rec: "—",
    ip: "41.66.10.5",
    status: "Failed" as const,
  },
  {
    ts: "19 Jun 2026 14:22",
    user: "Kofi Boateng",
    action: "Updated member record",
    module: "Cooperative",
    rec: "MEM-00124",
    ip: "197.255.32.4",
    status: "Success" as const,
  },
];

function AuditTab() {
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("All");

  const rows = AUDIT_ROWS.filter((r) => {
    if (mod !== "All" && r.module !== mod) return false;
    if (q && !`${r.user} ${r.action}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <SectionHeader
        title="Audit Log"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="outline"
              onClick={() => toast.info("Pick date range")}
              icon={<Calendar size={14} />}
            >
              Last 7 days ▾
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.success("Audit log exported")}
              icon={<Download size={14} />}
            >
              Export
            </Button>
          </div>
        }
      />
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#5B6A86",
            }}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by user or action…"
            style={{
              width: "100%",
              border: `1px solid ${tokens.border}`,
              borderRadius: 8,
              padding: "9px 12px 9px 34px",
              fontSize: 13,
              fontFamily: FONTS.body,
              color: "#16233F",
              outline: "none",
              background: "#fff",
            }}
          />
        </div>
        <select
          value={mod}
          onChange={(e) => setMod(e.target.value)}
          style={{
            border: `1px solid ${tokens.border}`,
            borderRadius: 8,
            padding: "9px 12px",
            fontSize: 13,
            fontFamily: FONTS.body,
            color: "#16233F",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {["All", "Loans", "Savings", "Cooperative", "Reports", "Administration", "System"].map(
            (m) => (
              <option key={m}>{m}</option>
            ),
          )}
        </select>
      </div>

      <TableCard title="Audit Log">
        <Table>
          <THead>
            <Th>Timestamp</Th>
            <Th>User</Th>
            <Th>Action</Th>
            <Th>Module</Th>
            <Th>Record ID</Th>
            <Th>IP Address</Th>
            <Th>Status</Th>
          </THead>
          <tbody>
            {rows.map((r, i) => (
              <Tr key={i} hover>
                <Td muted style={{ whiteSpace: "nowrap" }}>
                  {r.ts}
                </Td>
                <Td style={{ fontWeight: 300 }}>{r.user}</Td>
                <Td>{r.action}</Td>
                <Td>{r.module}</Td>
                <Td style={{ fontFamily: FONTS.mono, fontSize: 12, color: "#4A5878" }}>{r.rec}</Td>
                <Td style={{ fontFamily: FONTS.mono, fontSize: 12, color: "#4A5878" }}>{r.ip}</Td>
                <Td>
                  <StatusPill status={r.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </>
  );
}

/* ============== System Config Tab ============== */

function ConfigTab() {
  const [notif, setNotif] = useState({ email: true, sms: true, daily: false, compliance: true });
  const [sec, setSec] = useState({ twofa: true, timeout: true, ip: false });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "60fr 40fr", gap: 20 }}>
      {/* General */}
      <div style={{ ...cardStyle, padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 100, color: "#16233F", marginBottom: 16 }}>
          General Settings
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CfgField label="Institution Name">
            <MInput defaultValue="Asante Multipurpose Cooperative" />
          </CfgField>
          <CfgField label="Regulatory Body">
            <MInput defaultValue="Bank of Ghana (BoG)" />
          </CfgField>
          <CfgField label="Base Currency">
            <MSelect options={["GHS", "USD", "EUR"]} />
          </CfgField>
          <CfgField label="Financial Year Start">
            <MSelect options={["January", "April", "October"]} />
          </CfgField>
          <CfgField label="Default Branch">
            <MSelect options={["Head Office", "Kumasi", "Takoradi"]} />
          </CfgField>
        </div>
        <div style={{ marginTop: 20 }}>
          <Button variant="success" onClick={() => toast.success("Settings saved")}>
            Save changes
          </Button>
        </div>
      </div>

      <div>
        {/* Notifications */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 100, color: "#16233F", marginBottom: 8 }}>
            Notifications
          </div>
          <ToggleRow
            label="Email alerts for approvals"
            on={notif.email}
            onToggle={() => setNotif({ ...notif, email: !notif.email })}
          />
          <ToggleRow
            label="SMS on loan disbursement"
            on={notif.sms}
            onToggle={() => setNotif({ ...notif, sms: !notif.sms })}
          />
          <ToggleRow
            label="Daily summary email"
            on={notif.daily}
            onToggle={() => setNotif({ ...notif, daily: !notif.daily })}
          />
          <ToggleRow
            label="Compliance reminders"
            on={notif.compliance}
            onToggle={() => setNotif({ ...notif, compliance: !notif.compliance })}
            last
          />
        </div>

        {/* Security */}
        <div style={{ ...cardStyle, padding: 20, marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 100, color: "#16233F", marginBottom: 8 }}>
            Security
          </div>
          <ToggleRow
            label="Two-factor authentication"
            on={sec.twofa}
            onToggle={() => setSec({ ...sec, twofa: !sec.twofa })}
          />
          <ToggleRow
            label="Session timeout (30 min)"
            on={sec.timeout}
            onToggle={() => setSec({ ...sec, timeout: !sec.timeout })}
          />
          <ToggleRow
            label="IP allowlisting"
            on={sec.ip}
            onToggle={() => setSec({ ...sec, ip: !sec.ip })}
            last
          />
          <button
            onClick={() => toast.info("Change system password")}
            style={{
              marginTop: 14,
              background: "none",
              border: "none",
              color: "#002663",
              fontSize: 13,
              fontWeight: 300,
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Change system password
          </button>
        </div>
      </div>
    </div>
  );
}

function CfgField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 300, color: "#16233F" }}>{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({
  label,
  on,
  onToggle,
  last,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: last ? "none" : `1px solid ${tokens.border}`,
      }}
    >
      <span style={{ fontSize: 13, color: "#16233F" }}>{label}</span>
      <button
        onClick={onToggle}
        style={{
          width: 36,
          height: 20,
          borderRadius: 999,
          border: "none",
          background: on ? "#002663" : "#DDE4EF",
          position: "relative",
          cursor: "pointer",
          padding: 0,
          transition: "background 0.15s",
        }}
        aria-pressed={on}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.15s",
          }}
        />
      </button>
    </div>
  );
}
