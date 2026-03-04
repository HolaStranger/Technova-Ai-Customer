import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ChatSupport() {
  const navigate = useNavigate();

  const [step, setStep] = useState("menu");

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    serialNumber: "",
    issue: "",
  });

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello! Welcome to TechNova Support.",
      options: [
        "1. Report an issue",
        "2. Check warranty",
        "3. Track technician"
      ],
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const aiSay = (text, options = null) => {
    setMessages((prev) => [...prev, { role: "ai", text, options }]);
  };

  const sendToBackend = async (endpoint, payload) => {
    const res = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Server error");
    }

    return await res.json();
  };

  const sendMessage = async (override = null) => {
    const userText = override ?? input;

    if (!userText.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");

    /* ================= MENU ================= */

    if (step === "menu") {
      if (userText.includes("1")) {
        setStep("name");
        aiSay("Please enter your full name.");
      }

      else if (userText.includes("2")) {
        setStep("warranty");
        aiSay("Please enter your product serial number.");
      }

      else if (userText.includes("3")) {
        setStep("track");
        aiSay("Please enter your Ticket ID.");
      }

      else {
        aiSay("Please select one of the options.", [
          "1. Report an issue",
          "2. Check warranty",
          "3. Track technician"
        ]);
      }

      return;
    }

    /* ================= WARRANTY ================= */

    if (step === "warranty") {
      try {
        setLoading(true);
        aiSay("Checking warranty status...");

        const data = await sendToBackend("/check-warranty", {
          serialNumber: userText
        });

        if (data.inWarranty) {
          aiSay(`✅ Your product is under warranty until ${data.expiryDate}.`);
        } else {
          aiSay(`❌ Warranty expired on ${data.expiryDate}.`);
        }

      } catch (err) {
        aiSay("Unable to check warranty right now.");
      }

      finally {
        setLoading(false);
        setStep("menu");
      }

      return;
    }

    /* ================= TRACK ================= */

    if (step === "track") {
      try {
        setLoading(true);
        aiSay("Tracking technician...");

        const data = await sendToBackend("/dispatch/track", {
          ticketId: userText
        });

        aiSay(
          `Technician: ${data.technicianName || "Not assigned"}\nETA: ${
            data.estimatedArrival || "Not available"
          }`
        );

      } catch (err) {
        aiSay("Unable to track technician right now.");
      }

      finally {
        setLoading(false);
        setStep("menu");
      }

      return;
    }

    /* ================= ISSUE FLOW ================= */

    if (step === "name") {
      setForm((p) => ({ ...p, customerName: userText }));
      setStep("phone");
      aiSay("Please enter your phone number.");
      return;
    }

    if (step === "phone") {
      setForm((p) => ({ ...p, phone: userText }));
      setStep("serial");
      aiSay("Please enter your product serial number.");
      return;
    }

    if (step === "serial") {
      setForm((p) => ({ ...p, serialNumber: userText }));
      setStep("issue");
      aiSay("Please describe the issue.");
      return;
    }

    if (step === "issue") {
      try {
        setLoading(true);
        aiSay("Processing your request...");

        const data = await sendToBackend("/ai/orchestrate", {
          intent: "report_issue",
          payload: {
            ...form,
            issue: userText
          }
        });

        aiSay(data.message || "Ticket created successfully.");

        if (data.ticketId) {
          setTimeout(() => navigate("/my-tickets?filter=active"), 800);
        }

      } catch (err) {
        aiSay("Failed to process your request.");
      }

      finally {
        setLoading(false);
        setStep("menu");
      }

      return;
    }
  };

  return (
    <div className="page">
      <div className="wrap">

        <div className="chatArea">
          {messages.map((msg, idx) => (
            <div key={idx} className={msg.role === "user" ? "user" : "ai"}>
              <p>{msg.text}</p>

              {msg.options &&
                msg.options.map((opt) => (
                  <button key={opt} onClick={() => sendMessage(opt)}>
                    {opt}
                  </button>
                ))}
            </div>
          ))}

          {loading && <p>AI is thinking...</p>}

          <div ref={chatEndRef} />
        </div>

        <div className="inputBar">
          <input
            value={input}
            disabled={loading}
            placeholder="Type your response..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button disabled={loading} onClick={() => sendMessage()}>
            Send
          </button>
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
    --panel:#ffffff;
    --stroke:#e5e7eb;
    --text:#0f172a;
    --muted:#6b7280;
    --user:#0f5ea8;
  }

  .page{ min-height:100vh; background: var(--bg); font-family: Arial, sans-serif; }

  .topBar{ background: var(--nav); color:#fff; position: sticky; top:0; z-index:10; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08); }
  .topBarInner{ max-width: 980px; margin: 0 auto; padding: 14px 18px; display:flex; align-items:center; justify-content:space-between; }
  .backBtn{ width:36px; height:36px; border-radius:10px; border:none; background:rgba(255,255,255,.15); color:#fff; font-size:22px; cursor:pointer; }
  .topTitle{ font-weight:900; font-size:14px; }

  .wrap{ max-width: 980px; margin: 0 auto; padding: 18px; }

  .panel{
    background: var(--panel);
    border-radius: 18px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 18px 40px rgba(15,23,42,.08);
    overflow: hidden;
    display:flex;
    flex-direction:column;
    height: calc(100vh - 72px - 36px);
    min-height: 520px;
  }

  .chatArea{
    flex:1;
    padding: 16px;
    display:flex;
    flex-direction:column;
    gap: 10px;
    overflow:auto;
    background: #f8fafc;
  }

  .bubble{
    max-width: min(720px, 85%);
    border-radius: 14px;
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.45;
    border: 1px solid rgba(0,0,0,0.06);
  }

  .aiBubble{ align-self:flex-start; background:#fff; color:#111827; }
  .userBubble{ align-self:flex-end; background: var(--user); color:#fff; border: 1px solid rgba(255,255,255,0.12); }

  .agentTag{ font-size: 10px; font-weight: 900; color: #16a34a; margin-bottom: 6px; letter-spacing: .4px; }
  .bubbleText{ word-break: break-word; }

  .optionBtns{ display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
  .optBtn{
    background: #e0f2fe; border:1px solid #bae6fd; color:#0284c7;
    padding: 8px 12px; border-radius: 20px; font-size:12px; font-weight:700;
    cursor:pointer; transition:0.2s;
  }
  .optBtn:hover{ background:#bae6fd; }

  .errorBanner{
    background:#fef2f2;
    border:1px solid #fecaca;
    color:#991b1b;
    padding:10px 12px;
    border-radius:12px;
    font-weight:800;
    font-size:12px;
    align-self:flex-start;
    max-width: 85%;
  }

  .inputBar{
    padding: 12px;
    background: #fff;
    border-top: 1px solid var(--stroke);
    display:flex;
    gap: 10px;
    align-items:center;
  }

  .input{
    flex:1;
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

  .sendBtn{
    width: 42px;
    height: 42px;
    border-radius: 12px;
    border:none;
    background: var(--nav);
    color:#fff;
    cursor:pointer;
    font-size: 16px;
    font-weight: 900;
  }

  .sendBtn:disabled, .input:disabled{
    opacity: .6;
    cursor: not-allowed;
  }

  @media (max-width: 768px){
    .wrap{ padding: 0; }
    .panel{ height: calc(100vh - 64px); border-radius: 0; box-shadow: none; border: none; }
    .topBarInner{ padding: 14px 14px; }
  }
`;
