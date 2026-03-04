import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [alertsOn, setAlertsOn] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- helpers ----------
  const norm = (s) => String(s || "open").toLowerCase();

  const isResolved = (t) => {
    const s = norm(t?.status);
    return (
      s.includes("resolved") ||
      s.includes("fixed") ||
      s.includes("self") ||
      s.includes("closed") ||
      s === "done"
    );
  };

  const isActive = (t) => !isResolved(t);

  const isFlagged = (t) =>
    t?.flagged === true ||
    t?.angry === true ||
    norm(t?.sentiment) === "angry" ||
    norm(t?.priority) === "high";

  const inWarranty = (t) => {
    const w = norm(t?.warranty);
    return (
      w.includes("in") ||
      w.includes("yes") ||
      t?.inWarranty === true ||
      t?.warranty === true
    );
  };

  const outWarranty = (t) => {
    const w = norm(t?.warranty);
    return (
      w.includes("out") ||
      w.includes("no") ||
      t?.outWarranty === true ||
      t?.warranty === false
    );
  };

async function loadTickets() {
  try {
    setError("");

    const res = await fetch(`${API}/api/tickets`);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error || "Failed to load tickets");
    }

    const data = await res.json();

    setTickets(Array.isArray(data) ? data : []);

  } catch (e) {
    console.error("Ticket fetch error:", e);
    setTickets([]);
    setError(e.message || "Failed to fetch tickets");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    loadTickets();
  }, []);

  // ---------- stats ----------
  const stats = useMemo(() => {
    const total = tickets.length;

    const completed = tickets.filter(isResolved).length;
    const active = tickets.filter(isActive).length;

    const inW = tickets.filter(inWarranty).length;
    const outW = tickets.filter(outWarranty).length;

    const dispatched = tickets.filter((t) =>
      norm(t?.status).includes("dispatch"),
    ).length;

    const selfFixed = tickets.filter((t) => {
      const s = norm(t?.status);
      return s.includes("self") || s.includes("fixed");
    }).length;

    const flagged = tickets.filter(isFlagged).length;

    return {
      total,
      active,
      inWarranty: inW,
      outWarranty: outW,
      dispatched,
      completed,
      selfFixed,
      flagged,
    };
  }, [tickets]);

  // ---------- filtering + search ----------
  const visibleTickets = useMemo(() => {
    const q = norm(query).trim();

    let list = [...tickets];

    if (filter === "Active") list = list.filter(isActive);
    if (filter === "Resolved") list = list.filter(isResolved);
    if (filter === "Flagged") list = list.filter(isFlagged);
    if (filter === "In Warranty") list = list.filter(inWarranty);

    if (q) {
      list = list.filter((t) => {
        const id = String(t?.ticketId || t?.id || "");
        const name = String(t?.customerName || "");
        const serial = String(t?.serialNumber || t?.serial || "");
        const issue = String(t?.issue || "");
        const phone = String(t?.phone || "");
        return (
          norm(id).includes(q) ||
          norm(name).includes(q) ||
          norm(serial).includes(q) ||
          norm(issue).includes(q) ||
          norm(phone).includes(q)
        );
      });
    }

    list.sort((a, b) => {
      const da = new Date(a?.createdAt || 0).getTime();
      const db = new Date(b?.createdAt || 0).getTime();
      return db - da;
    });

    return list;
  }, [tickets, filter, query]);

  const logout = () => navigate("/");

  return (
    <div className="page">
      <style>{css}</style>

      {/* Full-width top bar */}
      <div className="topBar">
        <div className="topBarInner">
          <button className="backBtn" onClick={() => navigate(-1)}>
            ‹
          </button>
          <div className="topTitle">Admin Dashboard</div>
          <button className="backBtn" onClick={loadTickets} title="Refresh">
            ↻
          </button>
        </div>
      </div>

      <div className="wrap">
        {/* Welcome */}
        <div className="welcomeCard">
          <div>
            <div className="welcomeTitle">Welcome, Admin</div>
            <div className="welcomeSub">
              {loading ? "Loading tickets…" : "Admin Dashboard"}
              {error ? ` • Error: ${error}` : ""}
            </div>
          </div>
          <button className="logoutBtn" onClick={logout}>
            ⎋ Logout
          </button>
        </div>

        {/* Stats */}
        <div className="statsGrid">
          <StatCard
            icon="👥"
            value={stats.total}
            label="Total Tickets"
            bg="statBlue"
          />
          <StatCard
            icon="🛡️"
            value={stats.inWarranty}
            label="In Warranty"
            bg="statGreen"
          />
          <StatCard
            icon="🍂"
            value={stats.outWarranty}
            label="Out of Warranty"
            bg="statAmber"
          />
          <StatCard
            icon="🚚"
            value={stats.dispatched}
            label="Dispatched"
            bg="statBlue"
          />
          <StatCard
            icon="✅"
            value={stats.completed}
            label="Completed"
            bg="statGreen"
          />
          <StatCard
            icon="🔧"
            value={stats.selfFixed}
            label="Self-Fixed"
            bg="statIndigo"
          />
        </div>

        {/* Alerts */}
        <div className="alertCard">
          <div className="alertRow">
            <div className="alertLeft">
              <div className="alertIcon">⚠️</div>
              <div>
                <div className="alertTitle">Angry Customer Alerts</div>
                <div className="alertSub">
                  {alertsOn ? `${stats.flagged} flagged` : "Alerts Off"}
                </div>
              </div>
            </div>

            <button
              className="toggle"
              style={{
                background: alertsOn ? "#10b981" : "#cbd5e1",
                justifyContent: alertsOn ? "flex-end" : "flex-start",
              }}
              onClick={() => setAlertsOn((v) => !v)}
              aria-label="toggle alerts"
            >
              <span className="toggleDot" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="searchBox">
          <span className="searchIcon">🔍</span>
          <input
            className="searchInput"
            placeholder="Search tickets by ID, name, serial..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="sectionLabel">TICKETS</div>
        <div className="filters">
          {["All", "Active", "In Warranty", "Resolved", "Flagged"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`chip ${filter === f ? "chipActive" : ""}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        <div className="ticketArea">
          {loading ? (
            <div className="emptyBox">
              <div className="emptyTitle">Loading…</div>
              <div className="emptySub">Fetching tickets from database.</div>
            </div>
          ) : error ? (
            <div
              className="emptyBox"
              style={{ borderStyle: "solid", borderColor: "#fecaca" }}
            >
              <div className="emptyTitle">Error</div>
              <div className="emptySub">{error}</div>
            </div>
          ) : visibleTickets.length === 0 ? (
            <div className="emptyBox">
              <div className="emptyTitle">No tickets found</div>
              <div className="emptySub">
                Try changing the filter or search keyword.
              </div>
            </div>
          ) : (
            visibleTickets.map((t) => (
              <TicketRow
                key={String(t?.ticketId || t?.id)}
                t={t}
                onClick={() =>
                  navigate(`/admin/tickets/${t?.ticketId || t?.id}`)
                }
              />
            ))
          )}
        </div>

        <div className="footerSpace" />
      </div>
    </div>
  );
}

// ✅ UPDATED TicketRow (full, inside same file)
function TicketRow({ t, onClick }) {
  const ticketId = t?.ticketId || t?.id;
  const issue = t?.issue || "No issue";
  const customer = t?.customerName || "—";
  const created = t?.createdAt ? new Date(t.createdAt).toLocaleString() : "—";

  const s = String(t?.status || "Open").toLowerCase();

  const done =
    s.includes("resolved") ||
    s.includes("fixed") ||
    s.includes("self") ||
    s.includes("closed") ||
    s === "done";

  const moving =
    s.includes("on the way") ||
    s.includes("on_the_way") ||
    s.includes("in progress") ||
    s.includes("in_progress") ||
    s.includes("dispatched") ||
    s.includes("dispatch") ||
    s.includes("accepted");

  const pillClass = done ? "pillGreen" : moving ? "pillOrange" : "pillBlue";
  const pillLabel = done
    ? "Done"
    : moving
      ? t?.status || "In Progress"
      : "Open";

  return (
    <div
      className="ticketRow"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div className="rowTop">
        <div className="rowLeft">
          <div className="rowId">#{ticketId}</div>
          <div className="rowIssue">{issue}</div>
        </div>
        <div className={`pill ${pillClass}`}>{pillLabel}</div>
      </div>

      <div className="rowMeta">
        Customer: <b>{customer}</b> • Created: {created}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, bg }) {
  return (
    <div className={`statCard ${bg}`}>
      <div className="statIcon">{icon}</div>
      <div className="statValue">{value ?? ""}</div>
      <div className="statLabel">{label}</div>
    </div>
  );
}

const css = `
  *{ box-sizing:border-box; }

  :root{
    --bg:#f1f5f9;
    --nav:#0f5ea8;
    --card:#ffffff;
    --stroke:#e5e7eb;
    --text:#0f172a;
    --muted:#64748b;
  }

  .page{
    min-height:100vh;
    background: var(--bg);
    font-family: Arial, sans-serif;
  }

  .topBar{
    background: var(--nav);
    color:#fff;
    position: sticky;
    top:0;
    z-index:10;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  }

  .topBarInner{
    max-width: 1100px;
    margin: 0 auto;
    padding: 14px 18px;
    display:flex;
    align-items:center;
    justify-content:space-between;
  }

  .backBtn{
    width:36px;
    height:36px;
    border-radius:10px;
    border:none;
    background:rgba(255,255,255,.15);
    color:#fff;
    font-size:22px;
    cursor:pointer;
  }

  .topTitle{ font-weight:900; font-size:14px; }

  .wrap{
    max-width: 1100px;
    margin: 0 auto;
    padding: 18px 18px 40px;
  }

  .welcomeCard{
    background: var(--card);
    border-radius: 16px;
    padding: 14px 16px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 10px 24px rgba(15,23,42,.06);
  }

  .welcomeTitle{ font-weight:900; color: var(--text); }
  .welcomeSub{ font-size:12px; color: var(--muted); margin-top:2px; }

  .logoutBtn{
    border: 1px solid #fca5a5;
    background: #fff1f2;
    color: #ef4444;
    font-weight: 900;
    border-radius: 12px;
    padding: 10px 12px;
    cursor:pointer;
  }

  .statsGrid{
    margin-top: 14px;
    display:grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .statCard{
    border-radius: 16px;
    padding: 14px;
    text-align:center;
    border: 1px solid rgba(0,0,0,0.04);
    min-height: 92px;
    display:flex;
    flex-direction:column;
    justify-content:center;
  }

  .statIcon{ font-size: 16px; }
  .statValue{ font-size: 18px; font-weight: 900; margin-top: 8px; min-height: 22px; }
  .statLabel{ font-size: 12px; color: var(--muted); margin-top: 4px; }

  .statBlue{ background:#eaf2ff; }
  .statGreen{ background:#eafff4; }
  .statAmber{ background:#fff6dd; }
  .statIndigo{ background:#eef2ff; }

  .alertCard{
    margin-top: 14px;
    background: var(--card);
    border-radius: 16px;
    padding: 14px 16px;
    border: 1px solid rgba(15, 23, 42, 0.08);
  }

  .alertRow{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 12px;
  }

  .alertLeft{
    display:flex;
    gap: 10px;
    align-items:center;
  }

  .alertIcon{ font-size: 16px; }

  .alertTitle{ font-weight: 900; color: var(--text); }
  .alertSub{ font-size: 12px; color: var(--muted); margin-top:2px; }

  .toggle{
    width: 46px;
    height: 26px;
    border-radius: 999px;
    border:none;
    display:flex;
    align-items:center;
    padding: 3px;
    cursor:pointer;
    flex-shrink:0;
  }
  .toggleDot{ width: 20px; height: 20px; border-radius: 999px; background:#fff; }

  .searchBox{
    margin-top: 14px;
    background: var(--card);
    border-radius: 14px;
    border: 1px solid rgba(15, 23, 42, 0.10);
    padding: 12px 14px;
    display:flex;
    align-items:center;
    gap: 10px;
    color: var(--muted);
  }

  .searchInput{
    border:none;
    outline:none;
    flex:1;
    font-size: 13px;
    background: transparent;
  }

  .searchBox:focus-within{
    border-color: rgba(59,130,246,.55);
    box-shadow: 0 0 0 3px rgba(59,130,246,.14);
  }

  .sectionLabel{
    margin-top: 16px;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .8px;
    color: #94a3b8;
  }

  .filters{
    margin-top: 10px;
    display:flex;
    gap: 10px;
    flex-wrap: nowrap;
    overflow-x:auto;
    padding-bottom: 6px;
    scrollbar-width:none;
  }
  .filters::-webkit-scrollbar{ display:none; }

  .chip{
    border: 1px solid var(--stroke);
    background: var(--card);
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 900;
    cursor:pointer;
    white-space: nowrap;
    color: #334155;
  }

  .chipActive{
    background: var(--nav);
    border-color: var(--nav);
    color:#fff;
  }

  .ticketArea{ margin-top: 10px; display:grid; gap: 12px; }

  .emptyBox{
    background: var(--card);
    border-radius: 16px;
    padding: 18px;
    border: 1px dashed #cbd5e1;
    text-align:center;
  }
  .emptyTitle{ font-weight: 900; color: var(--text); }
  .emptySub{ margin-top: 6px; font-size: 13px; color: var(--muted); line-height: 1.4; }

  .ticketRow{
    background: var(--card);
    border-radius: 16px;
    padding: 14px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    cursor:pointer;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  }

  .rowTop{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap: 10px;
  }

  .rowLeft{ min-width:0; }

  .rowId{
    font-weight: 900;
    color: #0f5ea8;
    font-size: 12px;
  }

  .rowIssue{
    margin-top: 6px;
    font-weight: 900;
    color: var(--text);
    font-size: 14px;
    word-break: break-word;
  }

  .rowMeta{
    margin-top: 8px;
    font-size: 12px;
    color: var(--muted);
  }

  .pill{
    padding: 6px 10px;
    border-radius:999px;
    font-size:11px;
    font-weight:900;
    border: 1px solid #e5e7eb;
    white-space:nowrap;
  }

  .pillBlue{ background:#eff6ff; border-color:#bfdbfe; color:#2563eb; }
  .pillOrange{ background:#fff7ed; border-color:#fed7aa; color:#f59e0b; }
  .pillGreen{ background:#ecfdf5; border-color:#bbf7d0; color:#16a34a; }

  .footerSpace{ height: 18px; }

  @media (max-width: 900px){
    .statsGrid{ grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 480px){
    .wrap{ padding: 10px 10px 18px; }
    .welcomeCard{ padding: 10px 12px; border-radius: 14px; }
    .welcomeTitle{ font-size: 14px; }
    .welcomeSub{ font-size: 11px; }
    .logoutBtn{ padding: 7px 9px; font-size: 12px; border-radius: 10px; }
    .statsGrid{ gap: 8px; }
    .statCard{ padding: 10px; min-height: 68px; border-radius: 12px; }
    .statIcon{ font-size: 14px; }
    .statValue{ font-size: 15px; margin-top: 5px; }
    .statLabel{ font-size: 10px; }
    .alertCard{ padding: 10px 12px; border-radius: 14px; }
    .alertTitle{ font-size: 13px; }
    .alertSub{ font-size: 11px; }
    .searchBox{ padding: 10px 12px; border-radius: 12px; gap: 8px; }
    .searchInput{ font-size: 12px; }
    .chip{ padding: 7px 10px; font-size: 11px; }
    .ticketRow{ padding: 12px; border-radius: 14px; }
  }
`;
