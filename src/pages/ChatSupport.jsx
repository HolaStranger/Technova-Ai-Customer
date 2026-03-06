import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ChatSupport() {

  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [step, setStep] = useState("menu");

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    serialNumber: "",
    issue: ""
  });

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello! Welcome to TechNova Support.",
      options: [
        "1. Report an issue",
        "2. Check warranty",
        "3. Track technician"
      ]
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  /* AUTO SCROLL */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* CHAT HELPERS */

  const aiSay = (text, options = null) => {
    setMessages(prev => [...prev, { role: "ai", text, options }]);
  };

  const userSay = (text) => {
    setMessages(prev => [...prev, { role: "user", text }]);
  };

  /* API CALL */

  const sendToBackend = async (endpoint, payload) => {

    const res = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error("Server error");
    }

    return res.json();
  };

  /* MAIN MESSAGE HANDLER */

  const sendMessage = async (override = null) => {

    const userText = override ?? input;

    if (!userText.trim() || loading) return;

    userSay(userText);
    setInput("");

    /* ================= MENU ================= */

    if (step === "menu") {

      if (userText.includes("1")) {
        setStep("name");
        aiSay("Please enter your full name.");
        return;
      }

      if (userText.includes("2")) {
        setStep("warranty");
        aiSay("Please enter your product serial number.");
        return;
      }

      if (userText.includes("3")) {
        setStep("track");
        aiSay("Please enter your Ticket ID.");
        return;
      }

      aiSay("Please choose an option.", [
        "1. Report an issue",
        "2. Check warranty",
        "3. Track technician"
      ]);

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
          aiSay(`✅ Warranty valid until ${data.expiryDate}`);
        } else {
          aiSay(`❌ Warranty expired on ${data.expiryDate}`);
        }

      } catch {
        aiSay("Unable to check warranty.");
      }

      setLoading(false);
      setStep("menu");

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

        aiSay(`
Technician: ${data.technicianName || "Not assigned"}
ETA: ${data.estimatedArrival || "Unknown"}
        `);

      } catch {
        aiSay("Unable to track technician.");
      }

      setLoading(false);
      setStep("menu");

      return;
    }

    /* ================= ISSUE FLOW ================= */

    if (step === "name") {
      setForm(prev => ({ ...prev, customerName: userText }));
      setStep("phone");
      aiSay("Please enter your phone number.");
      return;
    }

    if (step === "phone") {
      setForm(prev => ({ ...prev, phone: userText }));
      setStep("serial");
      aiSay("Please enter your product serial number.");
      return;
    }

    if (step === "serial") {
      setForm(prev => ({ ...prev, serialNumber: userText }));
      setStep("issue");
      aiSay("Please describe the issue.");
      return;
    }

    if (step === "issue") {

      try {

        setLoading(true);
        aiSay("Creating support ticket...");

        const data = await sendToBackend("/ai/orchestrate", {
          intent: "report_issue",
          payload: {
            ...form,
            issue: userText
          }
        });

        aiSay(data.message || "Ticket created successfully.");

      } catch {
        aiSay("Failed to create ticket.");
      }

      setLoading(false);
      setStep("menu");

    }

  };

  return (

    <div className="page">

      <style>{css}</style>

      {/* HEADER */}

      <div className="topBar">

        <div className="topBarInner">

          <button
            className="backBtn"
            onClick={() => navigate("/customer")}
          >
            ←
          </button>

          <div className="topTitle">
            TechNova Support
          </div>

          <button
            className="logoutBtnTop"
            onClick={() => navigate("/customer")}
          >
            Home
          </button>

        </div>

      </div>

      {/* CONTENT */}

      <div className="contentWrap">

        <div className="hero">

          <div className="logoBox">🤖</div>

          <div className="mainTitle">
            AI Customer Support
          </div>

          <div className="onlineBadge">
            AI Agent Online
          </div>

          <div className="subtitle">
            TechNova Customer Success Guardian
          </div>

        </div>

        {/* CHAT */}

        <div className="chatBox">

          {messages.map((msg, i) => (

            <div
              key={i}
              className={msg.role === "user" ? "userBubble" : "aiBubble"}
            >

              <p>{msg.text}</p>

              {msg.options && msg.options.map(opt => (

                <button
                  key={opt}
                  className="optionBtn"
                  onClick={() => sendMessage(opt)}
                >
                  {opt}
                </button>

              ))}

            </div>

          ))}

          {loading && (

            <div className="aiBubble">
              <p className="typing">AI is typing...</p>
            </div>

          )}

          <div ref={chatEndRef}></div>

        </div>

        {/* INPUT */}

        <div className="inputBar">

          <input
            value={input}
            placeholder="Type your message..."
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button
            disabled={loading}
            onClick={() => sendMessage()}
          >
            Send
          </button>

        </div>

      </div>

    </div>

  );

}

/* ================= CSS ================= */

const css = `

*{box-sizing:border-box}

.page{
height:100vh;
background:#f1f5f9;
font-family:Arial;
display:flex;
flex-direction:column
}

.topBar{
background:#0f5ea8;
color:#fff;
box-shadow:0 8px 20px rgba(0,0,0,0.08)
}

.topBarInner{
max-width:1100px;
margin:auto;
padding:14px 20px;
display:flex;
align-items:center;
justify-content:space-between
}

.backBtn{
width:36px;
height:36px;
border-radius:10px;
border:none;
background:rgba(255,255,255,.15);
color:#fff;
font-size:20px;
cursor:pointer
}

.logoutBtnTop{
border:none;
background:rgba(255,255,255,.15);
color:#fff;
font-weight:700;
border-radius:10px;
padding:8px 14px;
cursor:pointer
}

.topTitle{
font-weight:900
}

.contentWrap{
max-width:900px;
margin:auto;
padding:20px;
display:flex;
flex-direction:column;
flex:1;
width:100%
}

.hero{
text-align:center;
margin-bottom:10px
}

.logoBox{
width:64px;
height:64px;
border-radius:18px;
background:#e8f0fe;
display:grid;
place-items:center;
font-size:26px;
margin:auto
}

.mainTitle{
font-weight:900;
font-size:26px
}

.onlineBadge{
color:#16a34a;
font-size:12px;
font-weight:700
}

.subtitle{
color:#6b7280;
font-size:14px
}

.chatBox{
flex:1;
background:#fff;
border-radius:16px;
padding:18px;
overflow-y:auto;
border:1px solid #e5e7eb
}

.aiBubble{
text-align:left;
margin-bottom:14px
}

.aiBubble p{
display:inline-block;
background:#f1f5f9;
border:1px solid #e5e7eb;
padding:10px 14px;
border-radius:12px;
max-width:70%
}

.userBubble{
text-align:right;
margin-bottom:14px
}

.userBubble p{
display:inline-block;
background:#0f5ea8;
color:#fff;
padding:10px 14px;
border-radius:12px;
max-width:70%
}

.optionBtn{
display:block;
margin-top:6px;
background:#fff;
border:1px solid #e5e7eb;
padding:7px 10px;
border-radius:8px;
cursor:pointer
}

.inputBar{
display:flex;
gap:10px;
margin-top:12px
}

.inputBar input{
flex:1;
padding:10px;
border-radius:10px;
border:1px solid #e5e7eb
}

.inputBar button{
background:#0f5ea8;
color:#fff;
border:none;
padding:10px 16px;
border-radius:10px;
cursor:pointer
}

.typing{
font-size:13px;
color:#6b7280;
font-style:italic
}

`;