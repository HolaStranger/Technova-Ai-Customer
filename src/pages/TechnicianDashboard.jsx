import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function TechnicianDashboard() {
  const navigate = useNavigate();

  const technicianEmail =
    localStorage.getItem("technician_email") || "Not signed in";

  const [tab, setTab] = useState("all"); // all | active | done
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadTickets() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tickets`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        setTickets([]);
        return;
      }

      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  // ✅ normalize helpers
  const norm = (s) => String(s || "open").toLowerCase();

  const isDone = (t) => {
    const s = norm(t?.status);
    return (
      s.includes("resolved") ||
      s.includes("fixed") ||
      s.includes("self") ||
      s.includes("closed") ||
      s === "done"
    );
  };

  const isActive = (t) => !isDone(t); // Open + In Progress are Active

  const stats = useMemo(() => {
    const total = tickets.length;
    const done = tickets.filter(isDone).length;
    const active = tickets.filter(isActive).length;
    return { active, done, total };
  }, [tickets]);

  const assignedTickets = useMemo(() => {
    if (tab === "active") return tickets.filter(isActive);
    if (tab === "done") return tickets.filter(isDone);
    return tickets;
  }, [tickets, tab]);

  const handleLogout = () => {
    localStorage.removeItem("technician_email");
    navigate("/technician");
  };

  return (
    <div className="page">
      <style>{css}</style>

      <div className="topBar">
        <div className="topBarInner">
          <button className="iconBtn" onClick={() => navigate("/")}>
            ‹
          </button>
          <div className="topTitle">Technician Portal</div>
          <button className="iconBtn" onClick={loadTickets} title="Refresh">
            ↻
          </button>
        </div>
      </div>

      <div className="wrap">
        <div className="profileCard">
          <div className="profileLeft">
            <div>
              <div className="profileName">Technician</div>
              <div className="profileRole">{technicianEmail}</div>
            </div>
          </div>

          <button className="logoutBtn" onClick={handleLogout}>
            <span style={{ fontSize: 14 }}>⇦</span>
            Logout
          </button>
        </div>

        <div className="statsRow">
          <div className="statCard" style={{ background: "#e9eef5" }}>
            <div className="statNumber" style={{ color: "#0f5ea8" }}>
              {stats.active}
            </div>
            <div className="statLabel">Active</div>
          </div>

          <div className="statCard" style={{ background: "#eafaf1" }}>
            <div className="statNumber" style={{ color: "#16a34a" }}>
              {stats.done}
            </div>
            <div className="statLabel">Done</div>
          </div>

          <div className="statCard" style={{ background: "#fff6e5" }}>
            <div className="statNumber" style={{ color: "#f59e0b" }}>
              {stats.total}
            </div>
            <div className="statLabel">Total</div>
          </div>
        </div>

        <div className="sectionTitle">ASSIGNED TICKETS</div>

        <div className="tabs">
          <Tab
            label="All"
            active={tab === "all"}
            onClick={() => setTab("all")}
          />
          <Tab
            label="Active"
            active={tab === "active"}
            onClick={() => setTab("active")}
          />
          <Tab
            label="Done"
            active={tab === "done"}
            onClick={() => setTab("done")}
          />
        </div>

        <div className="list">
          {loading && (
            <div className="stateBox">
              <div className="stateTitle">Loading…</div>
              <div className="stateText">Fetching tickets.</div>
            </div>
          )}

          {!loading && assignedTickets.length === 0 && (
            <div className="stateBox">
              <div className="stateTitle">No tickets yet</div>
              <div className="stateText">
                When a customer creates an issue, it will appear here.
              </div>
            </div>
          )}

          {!loading &&
            assignedTickets.map((t) => (
              <TicketCard
                key={String(t?.ticketId || t?.id)}
                t={t}
                onOpen={() =>
                  navigate(`/admin/tickets/${t?.ticketId || t?.id}?role=tech`)
                }
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tab ${active ? "tabActive" : ""}`}
    >
      {label}
    </button>
  );
}

function TicketCard({ t, onOpen }) {
  const ticketId = t?.ticketId || t?.id;
  const customerName = t?.customerName || "—";
  const phone = t?.phone || "";
  const date = t?.createdAt || t?.updatedAt || "";
  const desc = t?.issue || "";

  const status = String(t?.status || "Open").toLowerCase();

  // ✅ NEW FLOW: Open / In Progress / Resolved (+ Self-Fixed etc.)
  const isDone =
    status.includes("resolved") ||
    status.includes("fixed") ||
    status.includes("self") ||
    status.includes("closed") ||
    status === "done";

  const isInProgress =
    status.includes("in progress") || status.includes("in_progress");

  const statusLabel = isDone ? "Done" : isInProgress ? "In Progress" : "Open";

  const statusPill = isDone
    ? "pillGreen"
    : isInProgress
      ? "pillOrange"
      : "pillBlue";

  return (
    <div className="ticketCard" onClick={onOpen} role="button" tabIndex={0}>
      <div className="ticketTopRow">
        <div className="ticketId">{ticketId ? String(ticketId) : "—"}</div>
        <div className={`pill ${statusPill}`}>{statusLabel}</div>
      </div>

      <div className="ticketCustomer">{customerName}</div>

      <div className="ticketMeta">
        {phone ? <div className="metaLine">📞 {phone}</div> : null}
        {date ? (
          <div className="metaLine">🗓️ {String(date).slice(0, 16)}</div>
        ) : null}
      </div>

      {desc ? <div className="ticketDesc">🧾 {desc}</div> : null}
    </div>
  );
}

const css = `
  *{ box-sizing:border-box; }
  :root{
    --bg:#f1f5f9;
    --nav:#0f5ea8;
    --card:#ffffff;
    --stroke: rgba(15, 23, 42, 0.08);
    --text:#0f172a;
    --muted:#64748b;
  }
  .page{ min-height:100vh; background: var(--bg); font-family: Arial, sans-serif; }
  .topBar{ background: var(--nav); color:#fff; position: sticky; top:0; z-index:10; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08); }
  .topBarInner{ max-width: 1100px; margin: 0 auto; padding: 14px 18px; display:flex; align-items:center; justify-content:space-between; }
  .iconBtn{ width:36px; height:36px; border-radius:10px; border:none; background:rgba(255,255,255,.15); color:#fff; font-size:20px; cursor:pointer; }
  .topTitle{ font-weight:900; font-size:14px; }
  .wrap{ max-width: 1100px; margin: 0 auto; padding: 18px 18px 40px; display:flex; flex-direction:column; gap: 12px; }
  .profileCard{ background: var(--card); border-radius: 16px; padding: 14px; border: 1px solid var(--stroke); box-shadow: 0 10px 24px rgba(15,23,42,.06); display:flex; align-items:center; justify-content:space-between; gap: 12px; }
  .profileLeft{ display:flex; align-items:center; gap:10px; }
  .profileName{ font-weight:900; font-size:14px; color: var(--text); }
  .profileRole{ margin-top:2px; font-size:11px; color:#94a3b8; font-weight:700; word-break: break-word; }
  .logoutBtn{ border: 1px solid #fca5a5; background:#fff; color:#ef4444; font-weight:900; font-size:12px; padding:10px 12px; border-radius:12px; cursor:pointer; display:flex; align-items:center; gap:8px; flex-shrink:0; }
  .statsRow{ display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .statCard{ border-radius: 16px; padding: 12px; text-align:center; border: 1px solid var(--stroke); }
  .statNumber{ font-weight:900; font-size:22px; }
  .statLabel{ margin-top:2px; font-size:11px; color: var(--muted); font-weight:700; }
  .sectionTitle{ margin-top: 4px; font-size: 12px; font-weight: 900; color: #94a3b8; letter-spacing: .6px; }
  .tabs{ display:grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .tab{ border: 1px solid rgba(15, 23, 42, 0.10); background: #fff; color:#334155; font-size:12px; font-weight:900; padding: 10px 10px; border-radius: 999px; cursor:pointer; }
  .tabActive{ background: var(--nav); border-color: var(--nav); color:#fff; }
  .list{ display:flex; flex-direction:column; gap: 12px; padding-bottom: 10px; }
  .ticketCard{ background:#fff; border-radius:16px; padding:14px; border: 1px solid var(--stroke); box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06); cursor:pointer; }
  .ticketTopRow{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .ticketId{ font-weight:900; font-size:16px; color:#0f5ea8; }
  .pill{ padding: 6px 10px; border-radius:999px; font-size:11px; font-weight:900; border: 1px solid #e5e7eb; white-space:nowrap; }
  .pillBlue{ background:#eff6ff; border-color:#bfdbfe; color:#2563eb; }
  .pillOrange{ background:#fff7ed; border-color:#fed7aa; color:#f59e0b; }
  .pillGreen{ background:#ecfdf5; border-color:#bbf7d0; color:#16a34a; }
  .ticketCustomer{ margin-top:6px; font-weight:900; font-size:13px; color:#111827; }
  .ticketMeta{ margin-top:8px; display:flex; flex-direction:column; gap:6px; }
  .metaLine{ font-size:12px; color: var(--muted); font-weight:600; }
  .ticketDesc{ margin-top:10px; font-size:12px; color: var(--muted); line-height:1.35; }
  .stateBox{ background:#fff; border-radius:16px; padding:14px; border: 1px solid var(--stroke); text-align:center; box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06); }
  .stateTitle{ font-weight:900; font-size:13px; color: var(--text); }
  .stateText{ margin-top:6px; font-size:12px; color: var(--muted); }
  @media (max-width: 900px){ .statsRow{ grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 768px){
    .topBarInner{ padding: 14px 14px; }
    .wrap{ max-width:none; margin:0; padding: 14px 12px 26px; }
    .statsRow{ grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .statCard{ padding: 10px; border-radius: 14px; }
    .statNumber{ font-size: 18px; }
    .statLabel{ font-size: 10px; }
    .profileCard{ padding: 12px; border-radius: 14px; }
    .logoutBtn{ padding: 8px 10px; border-radius: 10px; }
    .ticketCard{ padding: 12px; border-radius: 14px; }
  }
  @media (max-width: 360px){ .statsRow{ grid-template-columns: 1fr; } }
`;
