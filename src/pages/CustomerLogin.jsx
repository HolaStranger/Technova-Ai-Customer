import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuth } from "../auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onLogin(e) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");

      setAuth(data.token, data.user);

      // ✅ go to customer portal (your existing page)
      navigate("/customer");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <style>{css}</style>

      <div className="topBar">
        <div className="topBarInner">
          <button className="backBtn" onClick={() => navigate(-1)}>
            ‹
          </button>
          <div className="topTitle">Customer Login</div>
          <div style={{ width: 36 }} />
        </div>
      </div>

      <div className="wrap">
        <div className="card">
          <div className="head">
            <div className="logo">👤</div>
            <div>
              <div className="h1">Welcome</div>
              <div className="sub">Login to track tickets & chat history</div>
            </div>
          </div>

          {error && <div className="err">{error}</div>}

          <form onSubmit={onLogin} className="form">
            <label className="label">Email</label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />

            <label className="label">Password</label>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />

            <button className="btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="foot">
            Don’t have an account?{" "}
            <button
              className="linkBtn"
              onClick={() => navigate("/customer-signup")}
            >
              Sign up
            </button>
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

  .page{ min-height:100vh; background:var(--bg); font-family: Arial, sans-serif; }

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
    width:36px;height:36px;border-radius:10px;border:none;
    background:rgba(255,255,255,.15);color:#fff;font-size:22px;cursor:pointer;
  }
  .topTitle{ font-weight:900; font-size:14px; }

  .wrap{ max-width: 980px; margin:0 auto; padding: 22px 18px; }
  .card{
    background: var(--card);
    border-radius: 18px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 18px 40px rgba(15,23,42,.08);
    padding: 18px;
    max-width: 520px;
    margin: 0 auto;
  }

  .head{ display:flex; gap:12px; align-items:center; }
  .logo{
    width:48px;height:48px;border-radius:14px;
    background:#e9f2ff; display:grid; place-items:center; font-size:20px;
  }
  .h1{ font-weight:900; color: var(--text); font-size:18px; }
  .sub{ color: var(--muted); font-size:12px; margin-top:2px; }

  .err{
    margin-top:12px;
    padding:10px 12px;
    border-radius:12px;
    background:#fef2f2;
    border:1px solid #fecaca;
    color:#991b1b;
    font-size:12px;
    font-weight:800;
  }

  .form{ margin-top:14px; display:flex; flex-direction:column; gap:10px; }
  .label{ font-size:12px; font-weight:900; color:#334155; }
  .input{
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--stroke);
    outline: none;
    font-size: 13px;
    background: #fff;
  }
  .input:focus{
    border-color: rgba(59,130,246,.55);
    box-shadow: 0 0 0 3px rgba(59,130,246,.18);
  }

  .btn{
    margin-top:6px;
    width:100%;
    padding: 11px 12px;
    border-radius: 12px;
    border:none;
    background: var(--nav);
    color:#fff;
    font-weight:900;
    cursor:pointer;
  }
  .btn:disabled{ opacity:.6; cursor:not-allowed; }

  .foot{
    margin-top:12px;
    font-size:12px;
    color: var(--muted);
    text-align:center;
  }
  .linkBtn{
    border:none;
    background:transparent;
    color: var(--nav);
    font-weight:900;
    cursor:pointer;
    text-decoration: underline;
  }
`;
