import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function TechnicianDashboard() {
  const navigate = useNavigate();

  const technicianEmail =
    localStorage.getItem("technician_email") || "Not signed in";

  const technicianId =
    localStorage.getItem("technician_id") || "";

  const [tab, setTab] = useState("all");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadTickets() {
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/tickets`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      let apiData = [];
      if (res.ok && (res.headers.get("content-type") || "").includes("application/json")) {
        apiData = await res.json();
      }

      // Get local demo tickets
      const demoData = JSON.parse(localStorage.getItem("TECH_DEMO_TICKETS") || "[]");
      
      const merged = [...demoData, ...(Array.isArray(apiData) ? apiData : [])];

      const sorted = merged.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setTickets(sorted);
    } catch (err) {
      // Fallback to just demo tickets if API fails
      const demoData = JSON.parse(localStorage.getItem("TECH_DEMO_TICKETS") || "[]");
      setTickets(demoData);
    } finally {
      setLoading(false);
    }
  }

  // load immediately
  useEffect(() => {
    loadTickets();
  }, []);

  // auto refresh every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      loadTickets();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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

  const isActive = (t) => !isDone(t);

  // stats only for this technician with demo offsets
  const stats = useMemo(() => {
    const myTickets = tickets.filter(
      (t) => t.technicianId === technicianId
    );

    const realTotal = myTickets.length;
    const realDone = myTickets.filter(isDone).length;
    const realActive = myTickets.filter(isActive).length;

    // Demo Offsets: Active + 4, Done + 28
    return { 
      active: realActive + 4, 
      done: realDone + 16, 
      total: realTotal + 32 
    };
  }, [tickets, technicianId]);

  // filter ticket tabs
  const assignedTickets = useMemo(() => {
    const myTickets = tickets.filter(
      (t) => t.technicianId === technicianId
    );

    if (tab === "active") return myTickets.filter(isActive);
    if (tab === "done") return myTickets.filter(isDone);

    return myTickets;
  }, [tickets, tab, technicianId]);

  const handleLogout = () => {
    localStorage.removeItem("technician_email");
    localStorage.removeItem("technician_id");
    navigate("/technician");
  };

  return (
    <div className="page">
      <style>{css}</style>

      <div className="topBar">
        <div className="topBarInner">
          <button
            className="iconBtn"
            onClick={() => navigate("/")}
          >
            ‹
          </button>

          <div className="topTitle">
            Technician Pro-Portal
          </div>

          <button
            className="iconBtn"
            onClick={loadTickets}
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </div>

      <div className="wrap">
        <div className="profileSection">
          <div className="profileCard">
            <div className="profileLeft">
              <div className="profileAvatar">🛠️</div>
              <div>
                <div className="profileName">
                  Tech Specialist
                </div>

                <div className="profileRole">
                  {technicianEmail}
                </div>
              </div>
            </div>

            <button
              className="logoutBtn"
              onClick={handleLogout}
            >
              ⇦ Logout
            </button>
          </div>

          <div className="efficiencyCard">
              <div className="effLabel">REPAIR SUCCESS</div>
              <div className="effBox">
                  <RepairEfficiency percentage={72} />
                  <div className="effText">
                      <div className="effNum">72%</div>
                  </div>
              </div>
          </div>
        </div>

        <div className="statsRow">
          <div className="statCard statBlue">
            <div className="statValue">3</div>
            <div className="statLabel">ACTIVE JOBS</div>
          </div>

          <div className="statCard statGreen">
            <div className="statValue">{stats.done}</div>
            <div className="statLabel">COMPLETED</div>
          </div>

          <div className="statCard statAmber">
            <div className="statValue">{stats.total}</div>
            <div className="statLabel">TOTAL HISTORY</div>
          </div>
        </div>

        <div className="performanceGrid">
            <div className="chartCard">
                <div className="chartTitle">WEEKLY PRODUCTIVITY (JOBS)</div>
                <WeeklyJobsChart />
            </div>
        </div>

        <div className="sectionTitle">
          DAILY ACTIVITY LOG (MOCKED)
        </div>

        <div className="activityLog">
            <div className="logItem">
                <div className="logIcon">✅</div>
                <div className="logBody">
                    <div className="logMsg">Resolved Ticket #7721 - Screen Repair</div>
                    <div className="logMeta">Success • 12m ago</div>
                </div>
            </div>
            <div className="logItem">
                <div className="logIcon">⚡</div>
                <div className="logBody">
                    <div className="logMsg">Assigned to Ticket #7745 - Battery Check</div>
                    <div className="logMeta">Priority: High • 34m ago</div>
                </div>
            </div>
            <div className="logItem">
                <div className="logIcon">🏠</div>
                <div className="logBody">
                    <div className="logMsg">On-site session started at TechNova HQ</div>
                    <div className="logMeta">Active • 1h ago</div>
                </div>
            </div>
        </div>

        <div className="sectionTitle">
          MY ASSIGNED TICKETS
        </div>

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
              <div className="stateTitle">
                Loading…
              </div>

              <div className="stateText">
                Fetching assigned tickets.
              </div>
            </div>
          )}

          {!loading &&
            assignedTickets.length === 0 && (
              <div className="stateBox">
                <div className="stateTitle">
                  No active assignments
                </div>

                <div className="stateText">
                  Great job! You've cleared your queue.
                </div>
              </div>
            )}

          {!loading &&
            assignedTickets.map((t) => (
              <TicketCard
                key={
                  t?.ticketId ||
                  t?.id ||
                  Math.random()
                }
                t={t}
                onOpen={() =>
                  navigate(
                   `/admin/tickets/${
                      t?.ticketId || t?.id
                    }?role=tech`
                  )
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
      className={`tab ${
        active ? "tabActive" : ""
      }`}
    >
      {label}
    </button>
  );
}

function RepairEfficiency({ percentage }) {
  const radius = 38; // Slightly smaller to give text more room
  const circ = 2 * Math.PI * radius;
  const off = circ - (percentage / 100) * circ;

  return (
     <svg width="100" height="100" viewBox="0 0 100 100" className="effCircle">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="7" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#10b981" strokeWidth="7" 
                strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />
     </svg>
  );
}

function WeeklyJobsChart() {
    const data = [
        { day: "Mon", val: 14 },
        { day: "Tue", val: 19 },
        { day: "Wed", val: 12 },
        { day: "Thu", val: 24 },
        { day: "Fri", val: 11 },
    ];
    const max = 30; // Standardize scale for realism

    return (
        <div className="jobChart">
            <div className="chartGrid">
                <div className="gridLine" style={{ bottom: '33%' }}><span>10</span></div>
                <div className="gridLine" style={{ bottom: '66%' }}><span>20</span></div>
            </div>
            {data.map((d, i) => (
                <div key={i} className="jobCol">
                    <div className="jobBar" style={{ height: `${(d.val / max) * 100}%` }}>
                        <div className="jobTip">{d.val}</div>
                    </div>
                    <div className="jobDay">{d.day}</div>
                </div>
            ))}
        </div>
    );
}

function TicketCard({ t, onOpen }) {
  const ticketId = t?.ticketId || t?.id;
  const customerName = t?.customerName || "Unknown Customer";
  const phone = t?.phone || "";
  const date = t?.createdAt || t?.updatedAt || "";
  const desc = t?.issueDescription || t?.issue || "";

  const status = String(t?.status || "Open").toLowerCase();

  const isDone =
    status.includes("resolved") ||
    status.includes("fixed") ||
    status.includes("self") ||
    status.includes("closed") ||
    status === "done";

  const isInProgress =
    status.includes("in progress") ||
    status.includes("in_progress");

  const statusLabel = isDone
    ? "Resolved"
    : isInProgress
    ? "In Progress"
    : "Open";

  const statusPill = isDone
    ? "pillGreen"
    : isInProgress
    ? "pillOrange"
    : "pillBlue";

  return (
    <div
      className="ticketCard"
      onClick={onOpen}
      role="button"
      tabIndex={0}
    >
      <div className="ticketTopRow">
        <div className="ticketId">
          #{ticketId ? String(ticketId).slice(-6) : "0000"}
        </div>

        <div className={`pill ${statusPill}`}>
          {statusLabel}
        </div>
      </div>

      <div className="ticketCustomer">
        {customerName}
      </div>

      <div className="ticketRow">
          <div className="ticketMeta">
            {phone && (
              <div className="metaLine">
                📞 {phone}
              </div>
            )}
            {date && (
              <div className="metaLine">
                🗓️ {new Date(date).toLocaleDateString()}
              </div>
            )}
          </div>
          <button className="viewBtn">View →</button>
      </div>

      {desc && (
        <div className="ticketDesc">
          {desc.length > 60 ? desc.slice(0, 60) + "..." : desc}
        </div>
      )}
    </div>
  );
} 

const css = `
  *{ box-sizing:border-box; }
  :root{
    --bg:#f8fafc;
    --nav:#0f5ea8;
    --card:#ffffff;
    --stroke: rgba(15, 23, 42, 0.08);
    --text:#0f172a;
    --muted:#64748b;
  }
  .page{ min-height:100vh; background: var(--bg); font-family: Arial, sans-serif; padding-bottom: 40px; }
  .topBar{ background: var(--nav); color:#fff; position: sticky; top:0; z-index:10; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08); }
  .topBarInner{ max-width: 1100px; margin: 0 auto; padding: 14px 18px; display:flex; align-items:center; justify-content:space-between; }
  .iconBtn{ width:36px; height:36px; border-radius:10px; border:none; background:rgba(255,255,255,.15); color:#fff; font-size:20px; cursor:pointer; }
  .topTitle{ font-weight:900; font-size:14px; letter-spacing: .5px; }
  
  .wrap{ max-width: 1100px; margin: 0 auto; padding: 18px 18px 0; display:flex; flex-direction:column; gap: 14px; }
  
  .profileSection{ display:grid; grid-template-columns: 2fr 1fr; gap: 12px; }
  .profileCard{ background: var(--card); border-radius: 20px; padding: 16px; border: 1px solid var(--stroke); box-shadow: 0 10px 24px rgba(15,23,42,.04); display:flex; align-items:center; justify-content:space-between; }
  .avatar{ width: 44px; height: 44px; background:#e8f0fe; border-radius:12px; display:grid; place-items:center; font-size:20px; }
  .profileLeft{ display:flex; align-items:center; gap:12px; }
  .profileAvatar{ width:48px; height:48px; background:#e0f2fe; border-radius:14px; display:grid; place-items:center; font-size:22px; }
  .profileName{ font-weight:900; font-size:16px; color: var(--text); }
  .profileRole{ font-size:12px; color: var(--muted); margin-top: 2px; }
  
  .logoutBtn{ border: 1px solid #fee2e2; background:#fef2f2; color:#ef4444; font-weight:900; font-size:11px; padding:8px 12px; border-radius:10px; cursor:pointer; }
  
  .efficiencyCard{ background: var(--card); border-radius: 20px; padding: 14px; border: 1px solid var(--stroke); text-align:center; display:flex; flex-direction:column; align-items:center; }
  .effLabel{ font-size: 9px; font-weight: 900; color: var(--muted); letter-spacing: .5px; margin-bottom: 8px; }
  .effBox{ position:relative; width: 100px; height: 100px; margin: 0 auto; }
  .effText{ position:absolute; top:0; left:0; right:0; bottom:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .effNum{ font-size: 22px; font-weight: 900; color: var(--text); line-height: 1; }
  .effSub{ font-size: 8px; color: var(--muted); font-weight: 900; text-transform:uppercase; margin-top: 4px; letter-spacing: 0.2px; }



  .statsRow{ display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .statCard{ background:#fff; border-radius: 20px; padding: 18px; border: 1px solid var(--stroke); position:relative; overflow:hidden; }
  .statValue{ font-weight:900; font-size:26px; color: var(--text); }
  .statLabel{ margin-top:4px; font-size:10px; color: var(--muted); font-weight:900; letter-spacing: .4px; }
  .trendUp{ font-size: 10px; font-weight: 900; color: #10b981; margin-top: 6px; }
  
  .statBlue{ border-left: 4px solid #0f5ea8; }
  .statGreen{ border-left: 4px solid #10b981; }
  .statAmber{ border-left: 4px solid #f59e0b; }

  .performanceGrid{ margin-top: 4px; }
  .chartCard{ background: #fff; border-radius: 20px; padding: 20px 20px 40px; border: 1px solid var(--stroke); }
  .chartTitle{ font-size: 10px; font-weight: 900; color: var(--muted); letter-spacing: 1px; margin-bottom: 24px; text-transform:uppercase; }
  .jobChart{ display:flex; align-items:flex-end; gap: 20px; height: 100px; position:relative; margin-left: 20px; }
  .chartGrid{ position:absolute; top:0; left:-20px; right:0; bottom:0; }
  .gridLine{ position:absolute; left:0; right:0; border-top: 1px dashed #e2e8f0; pointer-events:none; }
  .gridLine span{ position:absolute; left:-18px; top:-6px; font-size:9px; color: #94a3b8; font-weight:900; }

  .jobCol{ flex:1; height: 100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; z-index:1; position:relative; }
  .jobBar{ width: 24px; background: var(--nav); border-radius: 6px 6px 0 0; position:relative; min-height: 4px; }
  .jobTip{ position:absolute; top:-16px; left:0; right:0; text-align:center; font-size:9px; font-weight:900; color: var(--nav); }
  .jobDay{ font-size:10px; font-weight:900; color: #94a3b8; width: 100%; text-align: center; position:absolute; bottom: -24px; }

  .activityLog{ background:#fff; border-radius:20px; padding:6px; border: 1px solid var(--stroke); }
  .logItem{ display:flex; gap:12px; padding:12px; border-bottom:1px solid #f1f5f9; align-items:center; }
  .logItem:last-child{ border-bottom:none; }
  .logIcon{ width:32px; height:32px; background:#f8fafc; border-radius:10px; display:grid; place-items:center; font-size:14px; }
  .logMsg{ font-size:12px; font-weight:900; color: var(--text); }
  .logMeta{ font-size:10px; color: var(--muted); margin-top:2px; font-weight:700; }


  .sectionTitle{ margin-top: 10px; font-size: 11px; font-weight: 900; color: #94a3b8; letter-spacing: .8px; }
  .tabs{ display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 4px; }
  .tab{ border: 1px solid rgba(15, 23, 42, 0.08); background: #fff; color: var(--muted); font-size:12px; font-weight:900; padding: 12px; border-radius: 14px; cursor:pointer; }
  .tabActive{ background: var(--nav); border-color: var(--nav); color:#fff; box-shadow: 0 8px 16px rgba(15,94,168,.15); }
  
  .list{ display:flex; flex-direction:column; gap: 12px; margin-top: 4px; }
  .ticketCard{ background:#fff; border-radius:20px; padding:18px; border: 1px solid var(--stroke); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); transition: transform .2s; }
  .ticketCard:hover{ transform: translateY(-2px); }
  .ticketTopRow{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .ticketId{ font-weight:900; font-size:14px; color:#94a3b8; }
  .pill{ padding: 6px 10px; border-radius:8px; font-size:10px; font-weight:900; }
  .pillBlue{ background:#eff6ff; color:#2563eb; }
  .pillOrange{ background:#fff7ed; color:#f59e0b; }
  .pillGreen{ background:#ecfdf5; color:#16a34a; }
  
  .ticketCustomer{ margin-top:10px; font-weight:900; font-size:16px; color: var(--text); }
  .ticketRow{ display:flex; justify-content:space-between; align-items:flex-end; margin-top: 12px; }
  .ticketMeta{ display:flex; flex-direction:column; gap:6px; }
  .metaLine{ font-size:12px; color: var(--muted); font-weight:700; }
  .viewBtn{ border:none; background:#f1f5f9; color: var(--nav); font-weight:900; font-size:12px; padding: 10px 14px; border-radius:10px; cursor:pointer; }
  .ticketDesc{ margin-top:14px; font-size:13px; color: var(--muted); line-height:1.4; border-top: 1px solid #f1f5f9; padding-top: 10px; font-style: italic; }
  
  .stateBox{ background:#fff; border-radius:20px; padding:30px; border: 1px solid var(--stroke); text-align:center; }
  .stateTitle{ font-weight:900; font-size:15px; color: var(--text); }
  .stateText{ margin-top:8px; font-size:13px; color: var(--muted); }
  
  @media (max-width: 768px){
    .profileSection{ grid-template-columns: 1fr; }
    .statsRow{ grid-template-columns: 1fr; }
    .chartCard{ height: auto; }
  }
`;
