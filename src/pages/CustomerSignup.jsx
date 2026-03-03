import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CustomerSignup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSignup(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      // if backend returns HTML error page, this prevents crash
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Server returned non-JSON response. Check backend route.",
        );
      }

      if (!res.ok) throw new Error(data?.error || "Signup failed");

      // ✅ DO NOT auto-login. Just show message + redirect to login.
      setSuccess("Account created successfully! Redirecting to login…");

      // optional: clear form
      setName("");
      setEmail("");
      setPassword("");

      setTimeout(() => navigate("/customer-login"), 1200);
    } catch (err) {
      setError(err.message || "Signup failed");
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
          <div className="topTitle">Customer Signup</div>
          <div style={{ width: 36 }} />
        </div>
      </div>

      <div className="wrap">
        <div className="card">
          <div className="head">
            <div className="logo">🛡️</div>
            <div>
              <div className="h1">Create account</div>
              <div className="sub">Save tickets & track progress</div>
            </div>
          </div>

          {error && <div className="err">{error}</div>}
          {success && <div className="ok">{success}</div>}

          <form onSubmit={onSignup} className="form">
            <label className="label">Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />

            <label className="label">Email</label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              type="email"
              required
            />

            <label className="label">Password</label>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              type="password"
              required
            />

            <button className="btn" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <div className="foot">
            Already have an account?{" "}
            <button
              type="button"
              className="linkBtn"
              onClick={() => navigate("/customer-login")}
            >
              Login
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
    background:#eef2ff; display:grid; place-items:center; font-size:20px;
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

  .ok{
    margin-top:12px;
    padding:10px 12px;
    border-radius:12px;
    background:#ecfdf5;
    border:1px solid #bbf7d0;
    color:#166534;
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
