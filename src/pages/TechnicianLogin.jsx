import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TechnicianLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (email === "tech@technova.com" && password === "tech123") {
      localStorage.setItem("technician_email", email);
      navigate("/technician/dashboard");
      return;
    }

    setError("Invalid email or password.");
  };

  return (
    <div className="page">
      <style>{css}</style>

      {/* Full-width top bar */}
      <div className="topBar">
        <div className="topBarInner">
          <button className="backBtn" onClick={() => navigate("/")}>
            ‹
          </button>
          <div className="topTitle">Technician Sign In</div>
          <div style={{ width: 36 }} />
        </div>
      </div>

      {/* Normal web layout */}
      <div className="wrap">
        <div className="card">
          <div className="logoBox">🧰</div>

          <div className="title">Technician Portal</div>
          <div className="subtitle">Company access required</div>

          <form onSubmit={handleLogin} className="form">
            <div className="inputWrap">
              <span className="inputIcon">✉️</span>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Company email"
                type="email"
              />
            </div>

            <div className="inputWrap">
              <span className="inputIcon">🔒</span>
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
              />
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" className="signInBtn">
              ➜ Sign In
            </button>
          </form>

          {/* Optional: keep demo credentials */}
          <div className="demoBox">
            <div className="demoTitle">DEMO CREDENTIALS</div>
            <div className="demoText">Email: tech@technova.com</div>
            <div className="demoText">Password: tech123</div>
          </div>
        </div>
      </div>
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

  /* Top bar */
  .topBar{
    background: var(--nav);
    color:#fff;
    position: sticky;
    top:0;
    z-index:10;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  }

  .topBarInner{
    max-width: 980px;
    margin: 0 auto;
    padding: 14px 18px;
    display:flex;
    align-items:center;
    justify-content:space-between;
  }

  .backBtn{
    width:34px;
    height:34px;
    border-radius:10px;
    border:none;
    background:rgba(255,255,255,.15);
    color:#fff;
    font-size:20px;
    cursor:pointer;
  }

  .topTitle{ font-weight:900; font-size:14px; }

  /* Layout */
  .wrap{
    max-width: 980px;
    margin: 0 auto;
    padding: 40px 18px;
    display:flex;
    justify-content:center;
  }

  .card{
    width: min(460px, 100%);
    background: var(--card);
    border-radius: 18px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 18px 40px rgba(15,23,42,.08);
    padding: 28px;
    text-align:center;
  }

  .logoBox{
    width:72px;
    height:72px;
    border-radius:18px;
    background:#e8f0fe;
    display:grid;
    place-items:center;
    font-size:26px;
    margin: 0 auto 12px;
  }

  .title{
    font-size:22px;
    font-weight:900;
    color: var(--text);
  }

  .subtitle{
    margin-top:6px;
    font-size:13px;
    color:#94a3b8;
  }

  .form{
    margin-top:20px;
    display:flex;
    flex-direction:column;
    gap:14px;
    text-align:left;
  }

  .inputWrap{
    display:flex;
    align-items:center;
    gap:10px;
    padding:12px;
    border-radius:14px;
    border:1px solid var(--stroke);
    background:#fff;
  }

  .inputWrap:focus-within{
    border-color: rgba(59,130,246,.55);
    box-shadow: 0 0 0 3px rgba(59,130,246,.16);
  }

  .inputIcon{ width:22px; text-align:center; opacity:.7; }

  .input{
    border:none;
    outline:none;
    flex:1;
    font-size:14px;
    background:transparent;
  }

  .error{
    background:#fff1f2;
    border:1px solid #fca5a5;
    color:#ef4444;
    border-radius:12px;
    padding:10px;
    font-size:12px;
    text-align:left;
  }

  .signInBtn{
    padding:14px;
    border:none;
    border-radius:14px;
    background: var(--nav);
    color:#fff;
    font-weight:900;
    cursor:pointer;
    box-shadow: 0 10px 18px rgba(15,94,168,0.18);
  }

  .demoBox{
    margin-top:20px;
    background:#eef2f7;
    border-radius:14px;
    padding:14px;
    border:1px solid var(--stroke);
  }

  .demoTitle{
    font-size:10px;
    font-weight:700;
    letter-spacing:.6px;
    color:#94a3b8;
  }

  .demoText{
    font-size:12px;
    font-weight:600;
    color:#64748b;
    margin-top:4px;
  }

  /* ✅ Mobile: full screen, compact */
  @media (max-width: 768px){
    .topBarInner{ padding: 14px 14px; }

    .wrap{
      padding: 0;
      max-width: none;
    }

    .card{
      width: 100%;
      min-height: calc(100vh - 64px);
      border-radius: 0;
      box-shadow: none;
      border: none;
      padding: 18px 14px;
    }

    .logoBox{
      width: 54px;
      height: 54px;
      font-size: 22px;
      margin: 6px auto 10px;
    }

    .title{ font-size: 18px; }
    .subtitle{ font-size: 12px; }

    .inputWrap{ padding: 10px 12px; }
    .input{ font-size: 13px; }

    .signInBtn{ padding: 12px; font-size: 14px; }

    .demoBox{ padding: 12px; }
    .demoText{ font-size: 11px; }
  }
`;
