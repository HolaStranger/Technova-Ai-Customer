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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      // store token
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // store user
      if (data.user) {
        localStorage.setItem("customer", JSON.stringify(data.user));
      }

      setSuccess(`Account created for ${data.user.name}!`);

      setName("");
      setEmail("");
      setPassword("");

      setTimeout(() => {
        navigate("/customer-login");
      }, 1200);

    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <style>{css}</style>        
      <h2>Customer Signup</h2>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={onSignup} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            style={styles.input}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button style={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <button
            style={styles.link}
            onClick={() => navigate("/customer-login")}
          >
            Login
          </button>
        </p>
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
