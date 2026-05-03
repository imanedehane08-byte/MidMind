import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import { Home, Clock, ShieldCheck, LogOut, Sun, Moon, type LucideIcon } from "lucide-react";

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          background: isActive ? "#2563eb" : hovered ? "var(--bg-hover)" : "transparent",
          color: isActive ? "#fff" : hovered ? "var(--text)" : "var(--text-secondary)",
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 0.15s, color 0.15s",
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 14,
        }}
      >
        <Icon size={16} />
        {label}
      </div>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { darkMode, toggle } = useDarkMode();
  const [location] = useLocation();
  const [logoutHovered, setLogoutHovered] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <aside
        style={{
          width: 264,
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border)",
          padding: "22px 16px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ marginBottom: 22, paddingLeft: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                }}
              >
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>M</span>
              </div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>
                MIDMIND
              </h1>
            </div>
            <p style={{ margin: 0, color: "var(--text-faint)", fontSize: 11, paddingLeft: 44 }}>
              Guidance-First AI Tutor
            </p>
          </div>

          {user ? (
            <>
              <div
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "11px 13px",
                  marginBottom: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      color: "var(--text-faint)",
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.email}
                  </div>
                </div>
                <div
                  style={{
                    padding: "3px 7px",
                    borderRadius: 999,
                    background: user.role === "admin" ? "#dbeafe" : "var(--bg-hover)",
                    color: user.role === "admin" ? "#1d4ed8" : "var(--text-muted)",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "capitalize",
                    flexShrink: 0,
                  }}
                >
                  {user.role}
                </div>
              </div>

              <nav>
                <NavItem href="/" label="Active Session" icon={Home} isActive={location === "/"} />
                <NavItem href="/history" label="History" icon={Clock} isActive={location === "/history"} />
                {user.role === "admin" && (
                  <NavItem href="/admin" label="Admin Dashboard" icon={ShieldCheck} isActive={location === "/admin"} />
                )}
              </nav>
            </>
          ) : (
            <nav>
              <NavItem href="/login" label="Login" icon={Home} isActive={location === "/login"} />
              <NavItem href="/register" label="Register" icon={Clock} isActive={location === "/register"} />
            </nav>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
          <button
            onClick={toggle}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              transition: "border-color 0.15s, background 0.15s, color 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-card)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
            }}
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            {darkMode ? "Light mode" : "Dark mode"}
          </button>

          {user && (
            <button
              onClick={logout}
              onMouseEnter={() => setLogoutHovered(true)}
              onMouseLeave={() => setLogoutHovered(false)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: `1px solid ${logoutHovered ? "#fecaca" : "var(--border)"}`,
                background: logoutHovered ? "var(--red-tint)" : "var(--bg-card)",
                color: logoutHovered ? "#dc2626" : "var(--text-muted)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "border-color 0.15s, background 0.15s, color 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
              }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          )}
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          padding: 32,
          boxSizing: "border-box",
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
