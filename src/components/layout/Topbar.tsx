import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  Search,
  Menu,
  Globe,
  LogOut,
  CreditCard,
  TrendingUp,
  AlertCircle,
  User,
  Settings,
  Shield,
  HelpCircle,
} from "lucide-react";

const NAVY = "#002663";
const BORDER = "#DDE4EF";
const MUTED = "#7A879F";
const INK = "#16233F";

type Notif = {
  title: string;
  desc: string;
  time: string;
  unread?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
};

const NOTIFS: Notif[] = [
  {
    title: "New transaction alert",
    desc: "Cash deposit of GHS 5,000 processed",
    time: "2 min ago",
    unread: true,
    icon: <CreditCard size={16} />,
    iconBg: "#EFF4FE",
    iconColor: "#1E40AF",
  },
  {
    title: "KYC verified",
    desc: "Client KYC verification completed",
    time: "1 hr ago",
    unread: true,
    icon: <TrendingUp size={16} />,
    iconBg: "#ECFDF3",
    iconColor: "#067647",
  },
  {
    title: "Scheduled maintenance",
    desc: "System maintenance at 2:00 AM tonight",
    time: "3 hr ago",
    icon: <AlertCircle size={16} />,
    iconBg: "#FFFBEB",
    iconColor: "#B45309",
  },
];

export function Topbar() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header
      className="flex shrink-0 items-center justify-between bg-white"
      style={{ height: 64, padding: "0 24px", borderBottom: `1px solid ${BORDER}` }}
    >
      {/* LEFT */}
      <div className="flex items-center" style={{ gap: 14 }}>
        <button
          type="button"
          aria-label="Menu"
          style={{ color: MUTED, cursor: "pointer", padding: 4 }}
        >
          <Menu size={20} />
        </button>
        <div style={{ width: 1, height: 24, background: BORDER }} />
        <div
          style={{
            position: "relative",
            width: 420,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: "9px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
          }}
        >
          <Search size={16} color={MUTED} />
          <input
            placeholder="Search clients, accounts…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 13,
              color: INK,
              background: "transparent",
              fontFamily: "DM Sans, sans-serif",
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: MUTED,
              background: "#F4F6FB",
              borderRadius: 5,
              padding: "2px 6px",
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 600,
            }}
          >
            ⌘K
          </span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center" style={{ gap: 16 }}>
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: "8px 12px",
            background: "#fff",
            color: INK,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Globe size={14} color={MUTED} />
          EN
          <ChevronDown size={14} color={MUTED} />
        </button>

        {/* Bell */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
              setNotifOpen((v) => !v);
              setUserOpen(false);
            }}
            style={{
              position: "relative",
              padding: 6,
              color: MUTED,
              cursor: "pointer",
              background: "transparent",
              border: "none",
            }}
          >
            <Bell size={20} />
            <span
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                minWidth: 16,
                height: 16,
                borderRadius: 999,
                background: "#D92D20",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
              }}
            >
              2
            </span>
          </button>
          {notifOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 340,
                background: "#fff",
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                zIndex: 50,
                overflow: "hidden",
                fontSize: 13,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 14px",
                  borderBottom: `1px solid ${BORDER}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: "Sora, sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                      color: INK,
                    }}
                  >
                    Notifications
                  </span>
                  <span
                    style={{
                      background: "#FEF3F2",
                      color: "#D92D20",
                      border: "1px solid #FECDCA",
                      borderRadius: 999,
                      padding: "1px 7px",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    2 new
                  </span>
                </div>
                <button
                  type="button"
                  style={{
                    color: NAVY,
                    fontSize: 12,
                    fontWeight: 600,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Mark all read
                </button>
              </div>
              <div>
                {NOTIFS.map((n, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "11px 14px",
                      borderBottom: i < NOTIFS.length - 1 ? `1px solid ${BORDER}` : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        background: n.iconBg,
                        color: n.iconColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {n.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{n.title}</span>
                        {n.unread && (
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 999,
                              background: "#1E40AF",
                            }}
                          />
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{n.desc}</div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  textAlign: "center",
                  borderTop: `1px solid ${BORDER}`,
                }}
              >
                <button
                  type="button"
                  style={{
                    color: NAVY,
                    fontSize: 12,
                    fontWeight: 600,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 24, background: BORDER }} />

        {/* User */}
        <div ref={userRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => {
              setUserOpen((v) => !v);
              setNotifOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: NAVY,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                DQ
              </div>
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#12B76A",
                  border: "2px solid #fff",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                lineHeight: 1.2,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>Daniel Quaidoo</span>
              <span style={{ fontSize: 11, color: MUTED }}>Administrator</span>
            </div>
            <ChevronDown size={14} color={MUTED} />
          </button>

          {userOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 260,
                background: "#fff",
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                zIndex: 50,
                overflow: "hidden",
                fontSize: 13,
              }}
            >
              <div style={{ padding: "12px 14px", borderBottom: `1px solid ${BORDER}` }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK,
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  Daniel Quaidoo
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                  daniel.quaidoo@gmail.com
                </div>
              </div>
              <div style={{ padding: "4px 0" }}>
                <UserMenuItem icon={<User size={16} />} label="My Profile" />
                <UserMenuItem icon={<Settings size={16} />} label="Settings" />
                <UserMenuItem icon={<Shield size={16} />} label="Security" />
                <div style={{ height: 1, background: BORDER, margin: "4px 0" }} />
                <UserMenuItem icon={<HelpCircle size={16} />} label="Help & Support" />
                <div style={{ height: 1, background: BORDER, margin: "4px 0" }} />
                <UserMenuItem icon={<LogOut size={16} />} label="Logout" danger />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function UserMenuItem({
  icon,
  label,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "9px 14px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: danger ? "#D92D20" : INK,
        fontSize: 13,
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = danger ? "#FEF3F2" : "#F4F6FB")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ color: danger ? "#D92D20" : MUTED, display: "flex" }}>{icon}</span>
      {label}
    </button>
  );
}
