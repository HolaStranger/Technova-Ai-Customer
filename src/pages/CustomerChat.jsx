import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CustomerChat() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("customer_token") || "";

  const logout = () => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_email");
    localStorage.removeItem("customer_user");
    navigate("/customer-access");
  };

  async function loadTickets() {
    try {
      setLoading(true);
      setError("");

      // ✅ must be logged in
      if (!token) {
        navigate("/customer-access");
        return;
      }

      // ✅ customer-only endpoint
      const res = await fetch(`${API}/tickets/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // backend might return HTML error in rare cases, so guard json parsing
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      if (!res.ok) {
        // token invalid/expired OR server error
        logout();
        return;
      }

      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      setTickets([]);
      setError(e?.message || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;

    const selfFixed = tickets.filter((t) => {
      const s = String(t?.status || "").toLowerCase();
      return (
        s.includes("self") || s.includes("fixed") || s.includes("resolved")
      );
    }).length;

    const active = tickets.filter((t) => {
      const s = String(t?.status || "").toLowerCase();
      return !(
        s.includes("fixed") ||
        s.includes("resolved") ||
        s.includes("closed") ||
        s.includes("self")
      );
    }).length;

    return { active, selfFixed, total };
  }, [tickets]);

  return (
    <div className="page">
      <style>{css}</style>

      <div className="topBar">
        <div className="topBarInner">
          <button className="backBtn" onClick={() => navigate("/")}>
            ‹
          </button>
          <div className="topTitle">TechNova AI Guardian</div>
          <button className="logoutBtnTop" onClick={logout}>
            ⎋ Logout
          </button>
        </div>
      </div>

      <div className="contentWrap">
        <div className="hero">
          <div className="logoBox">🛡️</div>
          <div className="mainTitle">TechNova AI</div>
          <div className="subtitle">Customer Success Guardian</div>
          <div className="onlineBadge">🟢 Agent Online</div>

          <div className="apiStatusRow">
            {loading && <span className="apiPill">Loading tickets…</span>}
            {!loading && !error && (
              <span className="apiPill apiPillOk">Connected ✅</span>
            )}
            {error && (
              <span className="apiPill apiPillErr">Error: {error}</span>
            )}
            <button
              className="refreshBtn"
              onClick={loadTickets}
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>

        <div className="primaryCard" onClick={() => navigate("/voice-call")}>
          <div className="cardLeft">
            <div className="iconCircle">📞</div>
            <div>
              <div className="cardTitle">Start Voice Support Call</div>
              <div className="cardDesc">Speak with our agent in real-time</div>
            </div>
          </div>
          <div className="chev">›</div>
        </div>

        <div
          className="secondaryCard"
          onClick={() => navigate("/chat-support")}
        >
          <div className="cardLeft">
            <div className="iconCircle iconCircleChat">💬</div>
            <div>
              <div className="cardTitleDark">Chat Support</div>
              <div className="cardDescDark">Text-based assistance</div>
            </div>
          </div>
          <div className="chev chevMuted">›</div>
        </div>

        <div className="sectionLabel">SERVICE OVERVIEW</div>

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

        <div className="howBox">
          <div className="howTitle">How It Works</div>

          <div className="stepRow">
            <div className="stepCircle stepBlue">1</div>
            <div className="stepText">Explain your issue</div>
          </div>

          <div className="stepRow">
            <div className="stepCircle stepBlue">2</div>
            <div className="stepText">We record your details</div>
          </div>

          <div className="stepRow" style={{ marginBottom: 0 }}>
            <div className="stepCircle stepGreen">3</div>
            <div className="stepText">Track progress in My Tickets</div>
          </div>
        </div>

        <div className="footer">
          TechNova — Hackathon Demo <br />
          v1.0 Prototype
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

  @media (max-width: 768px){
    .topBarInner{ padding:14px 14px; }
    .contentWrap{ padding:20px 14px 34px; }
    .mainTitle{ font-size:24px; }
    .statCard{ min-width: 160px; }
  }
`;
