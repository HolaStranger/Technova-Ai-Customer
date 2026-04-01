import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getToken, getUser, clearAuth } from "../auth";


const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export default function CustomerChat() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = getToken();
  const user = getUser();
  const customerName = user?.name || "Customer";

  /* =========================
     LOGOUT FUNCTION
  ========================= */

  const logout = () => {
    clearAuth();

    // force refresh to clear session
    window.location.href = "/customer-login";
  };

  /* =========================
     AUTH CHECK
  ========================= */

  useEffect(() => {
    if (!token) {
      navigate("/customer-login", { replace: true });
    }
  }, [token, navigate]);
  /* =========================
     LOAD CUSTOMER TICKETS
  ========================= */

  const loadTickets = async () => {

    if (!token) {
      logout();
      return;
    }

    try {

      setLoading(true);
      setError("");

      const res = await fetch(`${API}/api/tickets/my`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        logout();
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        setTickets([]);
      }

    } catch (err) {

      setError("Failed to fetch tickets");
      setTickets([]);

    } finally {

      setLoading(false);

    }
  };
  /* =========================
     LOAD ON PAGE START
  ========================= */

  useEffect(() => {
    loadTickets();
  }, []);

  /* =========================
     SESSION TIMEOUT
  ========================= */

  useEffect(() => {
    let timeout;

    const resetTimer = () => {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        logout();
      }, SESSION_TIMEOUT);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, []);

  // 📊 Ticket statistics with exact demo offsets
  const stats = useMemo(() => {
    // Exact offsets as requested (Active: 2, Self-Fixed: 3, Total: 5)
    // We assume real data is 0 for this demo state, but we add them together.
    const realTotal = tickets.length;
    const realFixed = tickets.filter((t) => {
      const s = String(t?.status || "").toLowerCase();
      return s.includes("self") || s.includes("fixed") || s.includes("resolved");
    }).length;
    const realActive = realTotal - realFixed;

    return {
      active: realActive + 2,
      selfFixed: realFixed + 3,
      total: realTotal + 5
    };
  }, [tickets]);

  // Mock tickets for the "Recent Activity" section
  const mockTickets = [
    { id: "1772880700000", issue: "Fan making loud noise", status: "Open", date: "2026-03-07" },
    { id: "1772911", issue: "WiFi Signal Weak", status: "Resolved", date: "2026-03-25" },
    { id: "1772945", issue: "AC not cooling", status: "In Progress", date: "2026-03-26" },
  ];

  return (
    <div className="page">
      <style>{css}</style>

      <div className="topBar">
        <div className="topBarInner">

          <button
            className="backBtn"
            onClick={() => navigate("/")}
          >
            ‹
          </button>

          <div className="topTitle">
            TechNova AI Guardian
          </div>

          <button
            className="logoutBtnTop"
            onClick={logout}
          >
            ⎋ Logout
          </button>

        </div>
      </div>

      <div className="contentWrap">

        <div className="hero">

          <div className="logoBox">🛡️</div>

          <div className="mainTitle">TechNova AI</div>

          <div className="subtitle">
            Welcome, {customerName}

          </div>

          <div className="onlineBadge">
            🟢 Agent Online
          </div>

          <div className="apiStatusRow">

            {loading && (
              <span className="apiPill">
                Loading tickets…
              </span>
            )}

            {!loading && !error && (
              <span className="apiPill apiPillOk">
                Connected ✅
              </span>
            )}

            {error && (
              <span className="apiPill apiPillErr">
                Error: {error}
              </span>
            )}

            <button
              className="refreshBtn"
              onClick={loadTickets}
            >
              ↻
            </button>

          </div>
        </div>

        {/* --- NEW SERVICE INTELLIGENCE --- */}
        <div className="intelGrid">
          <div className="intelCard">
            <div className="intelTitle">AI RESPONSE</div>
            <div className="intelVal">&lt; 1.2s</div>
          </div>
          <div className="intelCard">
            <div className="intelTitle">SECURITY</div>
            <div className="intelVal">ACTIVE 🛡️</div>
          </div>
          <div className="intelCard">
            <div className="intelTitle">SUCCESS</div>
            <div className="intelVal">98.4%</div>
          </div>
        </div>

        {/* Voice call */}
        <div
          className="primaryCard"
          onClick={() => navigate("/voice-call")}
        >
          <div className="cardLeft">

            <div className="iconCircle">📞</div>

            <div>
              <div className="cardTitle">
                Start Voice Support Call
              </div>

              <div className="cardDesc">
                Speak with our agent in real-time
              </div>
            </div>

          </div>

          <div className="chev">›</div>

        </div>

        {/* Chat support */}
        <div
          className="secondaryCard"
          onClick={() => navigate("/chat-support")}
        >
          <div className="cardLeft">

            <div className="iconCircle iconCircleChat">
              💬
            </div>

            <div>
              <div className="cardTitleDark">
                Chat Support
              </div>

              <div className="cardDescDark">
                Text-based assistance
              </div>
            </div>

          </div>

          <div className="chev chevMuted">›</div>

        </div>

        <div className="sectionLabel">
          SERVICE OVERVIEW
        </div>

        <div className="overviewRow">

          <div
            className="statCard statBlue"
            onClick={() => navigate("/my-tickets?filter=active")}
          >
            <div className="statIcon">⚡</div>
            <div className="statNumber">{stats.active}</div>
            <div className="statLabel">Active</div>
          </div>

          <div
            className="statCard statGreen"
            onClick={() => navigate("/my-tickets?filter=resolved")}
          >
            <div className="statIcon">✅</div>
            <div className="statNumber">{stats.selfFixed}</div>
            <div className="statLabel">Self-Fixed</div>
          </div>

          <div
            className="statCard statAmber"
            onClick={() => navigate("/my-tickets?filter=all")}
          >
            <div className="statIcon">🟠</div>
            <div className="statNumber">{stats.total}</div>
            <div className="statLabel">Total</div>
          </div>

        </div>

        {/* --- NEW RECENT TICKETS SECTION --- */}
        <div className="sectionLabel">RECENT TICKETS (DEMO)</div>
        <div className="recentList">
          {mockTickets.map(t => (
            <div key={t.id} className="miniRow">
              <div className="rowMain">
                <div className="rowMsg">ID: #{t.id} - {t.issue}</div>
                <div className="rowDate">{t.date}</div>
              </div>
              <div className={`statusPill status${t.status.replace(' ', '')}`}>{t.status}</div>
            </div>
          ))}
        </div>

        <div className="howBox">

          <div className="howTitle">
            How It Works
          </div>

          <div className="stepRow">
            <div className="stepCircle stepBlue">1</div>
            <div className="stepText">
              Explain your issue
            </div>
          </div>

          <div className="stepRow">
            <div className="stepCircle stepBlue">2</div>
            <div className="stepText">
              We record your details
            </div>
          </div>

          <div className="stepRow" style={{ marginBottom: 0 }}>
            <div className="stepCircle stepGreen">3</div>
            <div className="stepText">
              Track progress in My Tickets
            </div>
          </div>

        </div>

        <div className="footer">
          TechNova AI Hackathon
        </div>

      </div>
    </div>
  );
}

const css = `
  * { box-sizing: border-box; }
  .page{ min-height:100vh; background:#f1f5f9; font-family: Arial, sans-serif; }

  .topBar{ background:#0f5ea8; color:#fff; position: sticky; top: 0; z-index: 10; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08); }
  .topBarInner{ max-width:1100px; margin:0 auto; padding:14px 20px; display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .backBtn{ width:36px; height:36px; border-radius:10px; border:none; background:rgba(255,255,255,.15); color:#fff; font-size:22px; cursor:pointer; }
  .ghostBtn{ width:36px; height:36px; border-radius:10px; border:none; background:rgba(255,255,255,.15); color:#fff; font-size:16px; cursor:pointer; }
  .logoutBtnTop{
  border: none;
  background: rgba(255,255,255,0.15);
  color: #fff;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.logoutBtnTop:hover{
  background: rgba(255,255,255,0.25);
}
  .topTitle{ font-weight:900; font-size:14px; }

  .contentWrap{ max-width:1100px; margin:0 auto; padding:28px 20px 40px; }
  .hero{ text-align:center; padding: 8px 0 6px; }
  .logoBox{ width:72px; height:72px; border-radius:18px; background:#e8f0fe; display:grid; place-items:center; font-size:26px; margin:10px auto 14px; }
  .mainTitle{ font-weight:900; font-size:28px; color:#0f172a; }
  .subtitle{ color:#6b7280; font-size:14px; margin-top:4px; }
  .onlineBadge{ margin-top:10px; font-size:12px; color:#16a34a; font-weight:800; }

  .apiStatusRow{ margin-top:10px; display:flex; justify-content:center; align-items:center; gap:8px; flex-wrap:wrap; }
  .apiPill{ font-size:11px; padding:6px 10px; border-radius:999px; background:#ffffff; border:1px solid #e5e7eb; color:#111827; font-weight:800; }
  .apiPillOk{ background:#ecfdf5; border-color:#bbf7d0; color:#166534; }
  .apiPillErr{ background:#fef2f2; border-color:#fecaca; color:#991b1b; max-width: 720px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .refreshBtn{ border:none; cursor:pointer; width:30px; height:30px; border-radius:10px; background:#ffffff; border:1px solid #e5e7eb; font-weight:900; }

  .primaryCard{ margin-top:18px; background:#0f5ea8; color:#fff; padding:18px; border-radius:16px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; box-shadow:0 10px 20px rgba(15,94,168,.18); }
  .secondaryCard{ margin-top:12px; background:#fff; padding:18px; border-radius:16px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; border:1px solid #e5e7eb; }
  .cardLeft{ display:flex; align-items:center; gap:12px; min-width:0; }
  .iconCircle{ width:42px; height:42px; border-radius:12px; background:rgba(255,255,255,.18); display:grid; place-items:center; font-size:16px; flex:0 0 auto; }
  .iconCircleChat{ background:#eef2ff; color:#1d4ed8; }
  .cardTitle{ font-weight:900; font-size:15px; }
  .cardDesc{ font-size:12px; opacity:.9; margin-top:2px; line-height:1.3; }
  .cardTitleDark{ font-weight:900; font-size:15px; color:#111827; }
  .cardDescDark{ font-size:12px; color:#6b7280; margin-top:2px; line-height:1.3; }
  .chev{ font-size:22px; font-weight:900; }
  .chevMuted{ color:#9ca3af; }

  .sectionLabel{ margin-top:22px; font-size:11px; font-weight:900; letter-spacing:.8px; color:#9ca3af; }
  .overviewRow{ margin-top:12px; display:flex; gap:12px; flex-wrap:wrap; }
  .statCard{ flex:1; min-width:220px; border-radius:14px; padding:14px; text-align:center; border:1px solid rgba(0,0,0,.04); min-height:90px; display:flex; flex-direction:column; justify-content:center; cursor:pointer; transition: transform .12s ease, box-shadow .12s ease; }
  .statCard:hover{ transform: translateY(-2px); box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08); }
  .statBlue{ background:#eaf2ff; }
  .statGreen{ background:#eafff4; }
  .statAmber{ background:#fff6dd; }
  .statIcon{ font-size:14px; }
  .statNumber{ font-size:18px; font-weight:900; margin-top:6px; min-height:22px; }
  .statLabel{ font-size:11px; color:#6b7280; margin-top:2px; }

  .howBox{ margin-top:16px; background:#fff; border-radius:16px; padding:16px; border:1px solid #e5e7eb; }
  .howTitle{ font-weight:900; margin-bottom:10px; color:#111827; }
  .stepRow{ display:flex; gap:10px; align-items:center; margin-bottom:10px; }
  .stepCircle{ width:26px; height:26px; border-radius:999px; display:grid; place-items:center; font-weight:900; font-size:12px; flex:0 0 auto; }
  .stepBlue{ background:#dbeafe; color:#1d4ed8; }
  .stepGreen{ background:#dcfce7; color:#16a34a; }
  .stepText{ font-size:12px; color:#374151; line-height:1.35; }

  .footer{ text-align:center; font-size:12px; color:#9ca3af; margin-top:28px; line-height:1.4; }

  /* New analytics & intelligence */
  .intelGrid{ display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-top:14px; }
  .intelCard{ background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:10px; text-align:center; }
  .intelTitle{ font-size:9px; font-weight:900; color:#94a3b8; letter-spacing:.5px; }
  .intelVal{ font-size:12px; font-weight:900; color:#0f172a; margin-top:4px; }

  .recentList{ margin-top:10px; background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:10px; }
  .miniRow{ display:flex; justify-content:space-between; align-items:center; padding:10px 8px; border-bottom:1px solid #f1f5f9; }
  .miniRow:last-child{ border-bottom:none; }
  .rowMsg{ font-size:12px; font-weight:800; color:#1e293b; }
  .rowDate{ font-size:10px; color:#94a3b8; margin-top:2px; }
  .statusPill{ font-size:10px; padding:4px 8px; border-radius:999px; font-weight:900; }
  .statusResolved{ background:#ecfdf5; color:#16a34a; }
  .statusInProgress{ background:#fff7ed; color:#f59e0b; }

  @media (max-width: 768px){
    .topBarInner{ padding:14px 14px; }
    .contentWrap{ padding:20px 14px 34px; }
    .mainTitle{ font-size:24px; }
    .statCard{ min-width: 160px; }
  }
`;
