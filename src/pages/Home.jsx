import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <style>{css}</style>

      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="logoBox">🛡️</div>
          <div className="headerText">
            <div className="title">TechNova AI</div>
            <div className="subtitle">Customer Success Guardian</div>
            <div className="badge">🤖 AI Hackathon</div>
          </div>
        </div>

        {/* Body */}
        <div className="body">
          <div className="sectionTitle">SELECT YOUR ROLE TO CONTINUE</div>

          {/* ✅ Customer */}
          <div
            className="roleCard"
            onClick={() => navigate("/customer-access")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/customer-access")}
          >
            <div className="left">
              <div className="iconBox" style={{ background: "#e9f2ff" }}>
                👤
              </div>
              <div className="roleText">
                <div className="roleTitle">Continue as Customer</div>
                <div className="roleDesc">
                  Login or create an account to track tickets & chat history
                </div>
              </div>
            </div>
            <div className="right">
              <span className="loginPill">Continue</span>
              <span className="chev">›</span>
            </div>
          </div>

          {/* Admin */}
          <div
            className="roleCard"
            onClick={() => navigate("/admin")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/admin")}
          >
            <div className="left">
              <div className="iconBox" style={{ background: "#eef2ff" }}>
                📊
              </div>
              <div className="roleText">
                <div className="roleTitle">Admin Portal</div>
                <div className="roleDesc">Dashboard, tickets & analytics</div>
              </div>
            </div>
            <div className="right">
              <span className="loginPill">Login</span>
              <span className="chev">›</span>
            </div>
          </div>

          {/* Technician */}
          <div
            className="roleCard"
            onClick={() => navigate("/technician")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/technician")}
          >
            <div className="left">
              <div className="iconBox" style={{ background: "#ecfdf5" }}>
                🧰
              </div>
              <div className="roleText">
                <div className="roleTitle">Technician Portal</div>
                <div className="roleDesc">View & manage assigned tickets</div>
              </div>
            </div>
            <div className="right">
              <span className="loginPill">Login</span>
              <span className="chev">›</span>
            </div>
          </div>

          <div className="footer">
            Chin Hin AI Hackathon — Business Challenge 6 <br />
            TechNova 
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
  * { box-sizing: border-box; }

  .page {
    min-height: 100vh;
    background: #f1f5f9;
    padding: 40px 20px;
    font-family: Arial, sans-serif;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    background: white;
    border-radius: 20px;
    box-shadow: 0 15px 40px rgba(0,0,0,0.06);
    overflow: hidden;
  }

  .header {
    background: #0f5ea8;
    color: white;
    padding: 40px 30px;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .headerText { min-width: 0; }

  .logoBox {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    background: rgba(255,255,255,0.2);
    font-size: 28px;
    flex: 0 0 auto;
  }

  .title {
    font-size: 28px;
    font-weight: 800;
    line-height: 1.1;
  }

  .subtitle {
    font-size: 14px;
    opacity: 0.9;
    margin-top: 4px;
  }

  .badge {
    display: inline-block;
    margin-top: 10px;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(0,0,0,0.2);
    font-size: 12px;
  }

  .body { padding: 40px 30px; }

  .sectionTitle {
    font-size: 12px;
    letter-spacing: 1px;
    color: #6b7280;
    margin-bottom: 20px;
    font-weight: 700;
  }

  .roleCard {
    background: #f8fafc;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
    cursor: pointer;
    transition: 0.2s ease;
    border: 1px solid #e5e7eb;
  }

  .roleCard:hover {
    background: white;
    box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  }

  .roleCard:focus {
    outline: 2px solid rgba(59,130,246,.45);
    outline-offset: 2px;
  }

  .left {
    display: flex;
    gap: 16px;
    align-items: center;
    min-width: 0;
  }

  .iconBox {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-size: 20px;
    flex: 0 0 auto;
  }

  .roleText { min-width: 0; }

  .roleTitle {
    font-weight: 800;
    font-size: 16px;
    color: #111827;
  }

  .roleDesc {
    font-size: 13px;
    color: #6b7280;
    margin-top: 4px;
    line-height: 1.3;
    word-break: break-word;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 0 0 auto;
  }

  .loginPill {
    font-size: 12px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 999px;
    background: #e0e7ff;
    color: #374151;
    white-space: nowrap;
  }

  .chev {
    font-size: 20px;
    color: #9ca3af;
    line-height: 1;
  }

  .footer {
    text-align: center;
    font-size: 12px;
    color: #9ca3af;
    margin-top: 40px;
    line-height: 1.4;
  }

  @media (max-width: 768px) {
    .page { padding: 0; }
    .container {
      max-width: none;
      border-radius: 0;
      min-height: 100vh;
      box-shadow: none;
    }
    .header { flex-direction: column; text-align: center; }
    .body { padding: 28px 18px; }
  }
`;
