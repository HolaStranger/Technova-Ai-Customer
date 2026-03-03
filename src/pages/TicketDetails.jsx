import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function TicketDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [params] = useSearchParams();

  // ✅ only technician sees buttons
  const isTechnician = (params.get("role") || "").toLowerCase() === "tech";

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadTicket() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/tickets/${id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Failed to load ticket");

      setTicket(data);
    } catch (e) {
      setTicket(null);
      setError(e.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus) {
    try {
      if (!ticket) return;

      setSaving(true);
      setError("");

      const ticketKey = ticket.ticketId || ticket.id;

      const res = await fetch(`${API}/tickets/${ticketKey}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update status");

      setTicket(data);
    } catch (e) {
      setError(e.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const statusLower = String(ticket?.status || "").toLowerCase();

  const isResolved =
    statusLower.includes("self") ||
    statusLower.includes("fixed") ||
    statusLower.includes("resolved") ||
    statusLower.includes("closed") ||
    statusLower === "done";

  const statusPill = useMemo(() => {
    if (isResolved)
      return { cls: "pillGreen", label: ticket?.status || "Done" };

    if (statusLower.includes("dispatch")) {
      return { cls: "pillOrange", label: ticket?.status || "Dispatched" };
    }

    if (statusLower.includes("progress")) {
      return { cls: "pillOrange", label: ticket?.status || "In Progress" };
    }

    if (statusLower.includes("accept")) {
      return { cls: "pillBlue", label: ticket?.status || "Accepted" };
    }

    return { cls: "pillBlue", label: ticket?.status || "Open" };
  }, [ticket, isResolved, statusLower]);

  return (
    <div className="page">
      <style>{css}</style>

      {/* Top bar */}
      <div className="topBar">
        <div className="topBarInner">
          <button className="iconBtn" onClick={() => navigate(-1)}>
            ‹
          </button>
          <div className="topTitle">Ticket Details</div>
          <button className="iconBtn" onClick={loadTicket} title="Refresh">
            ↻
          </button>
        </div>
      </div>

      <div className="wrap">
        {loading && (
          <div className="stateBox">
            <div className="stateTitle">Loading…</div>
            <div className="stateText">Getting ticket information</div>
          </div>
        )}

        {!loading && error && (
          <div className="stateBox errorBox">
            <div className="stateTitle">Error</div>
            <div className="stateText">{error}</div>
          </div>
        )}

        {!loading && !error && ticket && (
          <>
            <div className="card">
              <div className="topRow">
                <div>
                  <div className="mutedLabel">Ticket ID</div>
                  <div className="ticketId">{ticket.ticketId || ticket.id}</div>
                </div>
                <div className={`pill ${statusPill.cls}`}>
                  {statusPill.label}
                </div>
              </div>

              <div className="title">{ticket.issue || "No issue provided"}</div>

              <div className="grid">
                <Info label="Customer Name" value={ticket.customerName} />
                <Info label="Status" value={ticket.status} />
                <Info label="Created At" value={fmt(ticket.createdAt)} />
                <Info label="Updated At" value={fmt(ticket.updatedAt)} />
              </div>

              <div className="desc">
                <div className="descLabel">Issue Details</div>
                <div className="descText">{ticket.issue || "—"}</div>
              </div>
            </div>

            {/* ✅ Technician-only buttons */}
            {isTechnician && !isResolved && (
              <div className="btnRow">
                <button
                  className="btnSecondary"
                  disabled={saving}
                  onClick={() => updateStatus("Accepted")}
                >
                  Accept
                </button>

                {/* ✅ merged (On The Way + In Progress) */}
                <button
                  className="btnSecondary"
                  disabled={saving}
                  onClick={() => updateStatus("In Progress")}
                >
                  In Progress
                </button>

                <button
                  className="btnPrimary"
                  disabled={saving}
                  onClick={() => updateStatus("Resolved")}
                >
                  Mark as Done
                </button>
              </div>
            )}

            {isTechnician && isResolved && (
              <div className="doneNote">This ticket is completed.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="info">
      <div className="infoLabel">{label}</div>
      <div className="infoValue">{value || "—"}</div>
    </div>
  );
}

function fmt(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

const css = `
  *{ box-sizing:border-box; }
  .page{ min-height:100vh; background:#f1f5f9; font-family: Arial, sans-serif; }

  .topBar{ background:#0f5ea8; color:#fff; position:sticky; top:0; z-index:10; box-shadow:0 8px 20px rgba(15,23,42,.08); }
  .topBarInner{ max-width:1100px; margin:0 auto; padding:14px 18px; display:flex; align-items:center; justify-content:space-between; }
  .topTitle{ font-weight:900; font-size:14px; }
  .iconBtn{ width:36px; height:36px; border-radius:10px; border:none; background:rgba(255,255,255,.15); color:#fff; font-size:20px; cursor:pointer; }

  .wrap{ max-width:900px; margin:0 auto; padding:18px 14px 40px; }

  .card{
    background:#fff;
    border:1px solid rgba(15,23,42,.08);
    border-radius:16px;
    padding:16px;
    box-shadow:0 10px 24px rgba(15,23,42,.06);
  }

  .topRow{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
  .mutedLabel{ font-size:11px; font-weight:900; color:#94a3b8; letter-spacing:.6px; }
  .ticketId{ font-size:16px; font-weight:900; color:#0f5ea8; margin-top:4px; }

  .pill{ padding:6px 10px; border-radius:999px; font-size:11px; font-weight:900; border:1px solid #e5e7eb; white-space:nowrap; }
  .pillBlue{ background:#eff6ff; border-color:#bfdbfe; color:#2563eb; }
  .pillOrange{ background:#fff7ed; border-color:#fed7aa; color:#f59e0b; }
  .pillGreen{ background:#ecfdf5; border-color:#bbf7d0; color:#16a34a; }

  .title{ margin-top:12px; font-weight:900; font-size:18px; color:#0f172a; }

  .grid{
    margin-top:12px;
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap:10px;
  }

  .info{
    background:#f8fafc;
    border:1px solid rgba(15,23,42,.08);
    border-radius:12px;
    padding:10px;
  }
  .infoLabel{ font-size:11px; font-weight:900; color:#64748b; }
  .infoValue{ margin-top:4px; font-size:13px; font-weight:800; color:#0f172a; word-break:break-word; }

  .desc{
    margin-top:12px;
    border:1px solid rgba(15,23,42,.08);
    border-radius:12px;
    padding:12px;
  }
  .descLabel{ font-size:11px; font-weight:900; color:#64748b; }
  .descText{ margin-top:6px; font-size:13px; color:#334155; line-height:1.4; }

  .btnRow{ margin-top:14px; display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }

  .btnPrimary{
    border:none;
    background:#0f5ea8;
    color:#fff;
    font-weight:900;
    padding:12px 14px;
    border-radius:12px;
    cursor:pointer;
  }

  .btnSecondary{
    border:1px solid #cbd5e1;
    background:#fff;
    font-weight:900;
    padding:12px 14px;
    border-radius:12px;
    cursor:pointer;
  }

  .btnPrimary:disabled, .btnSecondary:disabled{
    opacity:.65;
    cursor:not-allowed;
  }

  .doneNote{
    margin-top:12px;
    background:#ecfdf5;
    border:1px solid #bbf7d0;
    padding:12px;
    border-radius:12px;
    font-weight:900;
    color:#166534;
  }

  .stateBox{
    background:#fff;
    border-radius:16px;
    padding:14px;
    border:1px solid rgba(15,23,42,.08);
    text-align:center;
    box-shadow:0 8px 18px rgba(15,23,42,.06);
  }
  .errorBox{ border-color:#fecaca; background:#fef2f2; }
  .stateTitle{ font-weight:900; font-size:13px; color:#0f172a; }
  .stateText{ margin-top:6px; font-size:12px; color:#64748b; }

  @media (max-width: 700px){
    .grid{ grid-template-columns: 1fr; }
  }
`;
