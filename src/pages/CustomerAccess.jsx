import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../auth";

export default function CustomerAccess() {
  const navigate = useNavigate();

  // ✅ If already logged in, skip access page
  useEffect(() => {
    const token = getToken();
    if (token) navigate("/customer");
  }, [navigate]);

  return (
    <div className="page">
      <style>{css}</style>

      {/* Top bar */}
      <div className="topBar">
        <div className="topBarInner">
          <button className="backBtn" onClick={() => navigate("/")}>
            ‹
          </button>
          <div className="topTitle">Customer Portal</div>
          <div style={{ width: 36 }} />
        </div>
      </div>

      <div className="wrap">
        <div className="card">
          <div className="head">
            <div className="logo">👤</div>
            <div>
              <div className="h1">Continue as Customer</div>
              <div className="sub">
                Login or create an account to track your tickets & chat history.
              </div>
            </div>
          </div>

          <div className="btnRow">
            <button
              className="btn primary"
              onClick={() => navigate("/customer-login")}
            >
              Login →
            </button>

            <button
              className="btn"
              onClick={() => navigate("/customer-signup")}
            >
              Sign up →
            </button>
          </div>

          <div className="hint">
            After login, you will be redirected to the Customer Home.
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
    background:var(--bg);
    font-family: Arial, sans-serif;
  }

  .topBar{
    background:var(--nav);
    color:#fff;
    position:sticky;
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
    max-width: 980px;
    margin:0 auto;
    padding: 22px 18px;
  }

  .card{
    background:var(--card);
    border-radius:18px;
    border:1px solid rgba(15,23,42,.08);
    box-shadow: 0 18px 40px rgba(15,23,42,.08);
    padding:18px;
    max-width: 620px;
    margin: 0 auto;
  }

  .head{
    display:flex;
    gap:12px;
    align-items:center;
  }

  .logo{
    width:48px;
    height:48px;
    border-radius:14px;
    background:#e9f2ff;
    display:grid;
    place-items:center;
    font-size:20px;
    flex:0 0 auto;
  }

  .h1{
    font-weight:900;
    color:var(--text);
    font-size:18px;
  }

  .sub{
    color:var(--muted);
    font-size:12px;
    margin-top:3px;
    line-height:1.4;
  }

  .btnRow{
    margin-top:14px;
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap:12px;
  }

  .btn{
    border-radius:14px;
    border:1px solid var(--stroke);
    background:#fff;
    padding:14px 14px;
    font-weight:900;
    cursor:pointer;
    color:#111827;
  }

  .primary{
    background: var(--nav);
    color:#fff;
    border-color: var(--nav);
    box-shadow: 0 10px 18px rgba(15,94,168,.20);
  }

  .hint{
    margin-top:12px;
    font-size:12px;
    color:var(--muted);
    text-align:center;
  }

  @media (max-width: 700px){
    .btnRow{ grid-template-columns: 1fr; }
  }
`;
