import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ChatSupport() {
  const navigate = useNavigate();

  // steps: menu -> name -> phone -> issue -> done (or warranty/track)
  const [step, setStep] = useState("menu");
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    issue: "",
  });

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello! Welcome to TechNova support. How can I help you today?",
      options: ["1. Report an issue", "2. Check warranty", "3. Track technician"],
    },
  ]);

  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, error, saving]);

  function aiSay(text, options = null) {
    setMessages((prev) => [...prev, { role: "ai", text, options }]);
  }

  async function createTicket(payload) {
    // ✅ assumes backend has POST /tickets
    const res = await fetch(`${API}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to create ticket");

    return data;
  }

  const sendMessage = async (overrideText = null) => {
    const textToSend = typeof overrideText === "string" ? overrideText : input;
    if (!textToSend.trim() || saving) return;

    const userText = textToSend.trim();
    setError("");

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");

    // ✅ MENU LOGIC
    if (step === "menu") {
      const choice = userText.toLowerCase();
      if (choice.includes("1") || choice.includes("report")) {
        setStep("name");
        aiSay("Okay, let's report an issue. First, what is your name?");
      } else if (choice.includes("2") || choice.includes("warranty")) {
        setStep("warranty");
        aiSay("Please enter your Product Serial Number.");
      } else if (choice.includes("3") || choice.includes("track")) {
        setStep("track");
        aiSay("Please enter your Ticket ID.");
      } else {
        aiSay("I didn't understand. Please select an option:", [
          "1. Report an issue",
          "2. Check warranty",
          "3. Track technician",
        ]);
      }
      return;
    }

    if (step === "warranty") {
      aiSay(`Checking warranty for ${userText}...`);
      setSaving(true);
      setTimeout(() => {
        aiSay("✅ Warranty is valid until Dec 2026.");
        setSaving(false);
      }, 1000);
      return;
    }

    if (step === "track") {
      aiSay(`Tracking ticket ${userText}...`);
      setSaving(true);
      setTimeout(() => {
        aiSay("🚚 Technician is 15 mins away.");
        setSaving(false);
      }, 1000);
      return;
    }

    // ✅ Step logic (no repeating bug)
    if (step === "name") {
      setForm((p) => ({ ...p, customerName: userText }));
      setStep("phone");
      aiSay("Thanks! Please share your phone number.");
      return;
    }

    if (step === "phone") {
      // simple phone check
      const onlyDigits = userText.replace(/\D/g, "");
      if (onlyDigits.length < 8) {
        aiSay("Hmm, that phone number looks too short. Please re-enter it.");
        return;
      }

      setForm((p) => ({ ...p, phone: userText }));
      setStep("issue");
      aiSay("Got it. Please describe your issue (example: AC not cooling).");
      return;
    }

    if (step === "issue") {
      const payload = {
        customerName: form.customerName,
        phone: form.phone,
        issue: userText,
        status: "Open",
        // OPTIONAL if you store logged-in customer email
        customerEmail: localStorage.getItem("customer_email") || "",
        createdAt: new Date().toISOString(),
      };

      try {
        setSaving(true);
        aiSay("Thanks! Creating your ticket now…");

        await createTicket(payload);

        setStep("done");
        aiSay("✅ Ticket created! You can track it in My Tickets.");

        // send user to My Tickets
        setTimeout(() => navigate("/my-tickets?filter=active"), 600);
      } catch (e) {
        setError(e.message || "Failed to create ticket");
        aiSay("❌ Sorry, I couldn’t create the ticket. Please try again.");
      } finally {
        setSaving(false);
      }
      return;
    }

    // if done
    aiSay("Your ticket is already created. Please check My Tickets.");
  };

  return (
    <div className="page">
      <style>{css}</style>

      <div className="topBar">
        <div className="topBarInner">
          <button className="backBtn" onClick={() => navigate(-1)}>
            ‹
          </button>
          <div className="topTitle">Chat Support</div>
          <div style={{ width: 36 }} />
        </div>
      </div>

      <div className="wrap">
        <div className="panel">
          <div className="chatArea">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`bubble ${
                  msg.role === "user" ? "userBubble" : "aiBubble"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="agentTag">🟢 AI AGENT</div>
                )}
                <div className="bubbleText">{msg.text}</div>
                {msg.options && (
                  <div className="optionBtns">
                    {msg.options.map((opt) => (
                      <button key={opt} className="optBtn" onClick={() => sendMessage(opt)}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {saving && (
              <div className="bubble aiBubble">
                <div className="agentTag">🟢 AI AGENT</div>
                <div className="bubbleText">Typing...</div>
              </div>
            )}
            {error ? <div className="errorBanner">Error: {error}</div> : null}
            <div ref={chatEndRef} />
          </div>

          <div className="inputBar">
            <input
              className="input"
              placeholder={
                saving
                  ? "Please wait…"
                  : step === "menu"
                    ? "Select an option..."
                    : step === "name"
                    ? "Type your name..."
                    : step === "phone"
                      ? "Type your phone number..."
                      : step === "issue"
                        ? "Describe your issue..."
                        : "Done"
              }
              value={input}
              disabled={saving || step === "done"}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              className="sendBtn"
              onClick={sendMessage}
              aria-label="Send"
              disabled={saving || step === "done"}
            >
              ➤
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
