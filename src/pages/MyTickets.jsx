import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MyTickets() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const filter = searchParams.get("filter") || "all";

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("customer_token");

  const logout = () => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_email");
    localStorage.removeItem("customer_user");
    navigate("/customer-login");
  };

  /* =========================
     AUTH CHECK
  ========================= */

  useEffect(() => {
    if (!token) {
      navigate("/customer-login", { replace: true });
    }
  }, []);

  /* =========================
     LOAD TICKETS
  ========================= */

  const loadTickets = async () => {

    try {

      setLoading(true);
      setError("");

      const res = await fetch(`${API}/api/tickets/my`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        logout();
        return;
      }

      const data = await res.json();

      setTickets(Array.isArray(data) ? data : []);

    } catch (err) {

      setError("Failed to load tickets");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    loadTickets();
  }, []);

  /* =========================
     FILTER LOGIC
  ========================= */

  const filteredTickets = tickets.filter((t) => {

    const status = String(t?.status || "").toLowerCase();

    if (filter === "active") {
      return !(
        status.includes("resolved") ||
        status.includes("closed") ||
        status.includes("fixed")
      );
    }

    if (filter === "resolved") {
      return (
        status.includes("resolved") ||
        status.includes("fixed")
      );
    }

    return true;

  });

  return (
    <div className="page">

      <style>{css}</style>

      <div className="topBar">

        <button
          className="backBtn"
          onClick={() => navigate("/customer")}
        >
          ← Back
        </button>

        <div className="title">My Tickets</div>

        <button
          className="logoutBtn"
          onClick={logout}
        >
          Logout
        </button>

      </div>

      <div className="container">

        {loading && <div className="msg">Loading tickets...</div>}

        {error && <div className="error">{error}</div>}

        {!loading && filteredTickets.length === 0 && (
          <div className="msg">No tickets found</div>
        )}

        {filteredTickets.map((ticket) => (

          <div
            key={ticket.id}
            className="ticketCard"
          >

            <div className="ticketTop">

              <div className="ticketId">
                #{ticket.id}
              </div>

              <div className="ticketStatus">
                {ticket.status || "Pending"}
              </div>

            </div>

            <div className="ticketTitle">
              {ticket.issue || "Support Request"}
            </div>

            <div className="ticketDate">
              {ticket.createdAt
                ? new Date(ticket.createdAt).toLocaleString()
                : ""}
            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

const css = `

.page{
  min-height:100vh;
  background:#f1f5f9;
  font-family:Arial;
}

.topBar{
  background:#0f5ea8;
  color:white;
  padding:14px 20px;
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.backBtn{
  border:none;
  background:rgba(255,255,255,0.2);
  color:white;
  padding:6px 10px;
  border-radius:6px;
  cursor:pointer;
}

.logoutBtn{
  border:none;
  background:#ef4444;
  color:white;
  padding:6px 10px;
  border-radius:6px;
  cursor:pointer;
}

.title{
  font-weight:bold;
}

.container{
  max-width:800px;
  margin:auto;
  padding:20px;
}

.ticketCard{
  background:white;
  padding:16px;
  border-radius:10px;
  margin-bottom:12px;
  border:1px solid #e5e7eb;
}

.ticketTop{
  display:flex;
  justify-content:space-between;
  margin-bottom:6px;
}

.ticketId{
  font-weight:bold;
}

.ticketStatus{
  font-size:12px;
  padding:3px 8px;
  background:#e0f2fe;
  border-radius:6px;
}

.ticketTitle{
  font-size:14px;
  margin-bottom:4px;
}

.ticketDate{
  font-size:11px;
  color:#6b7280;
}

.msg{
  text-align:center;
  margin-top:40px;
}

.error{
  color:red;
  text-align:center;
}

`;