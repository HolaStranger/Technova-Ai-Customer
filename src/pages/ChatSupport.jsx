import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ChatSupport() {

  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `How can I assist you today?

1️⃣ Report an Issue
2️⃣ Check Warranty
3️⃣ Track Ticket Status`
    }
  ]);

  const [input, setInput] = useState("");
  const [step, setStep] = useState("menu");
  const [isTyping, setIsTyping] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    product: "",
    serial: "",
    issue: ""
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const aiSay = (text) => {
    setIsTyping(true);
    const delay = Math.floor(Math.random() * 2000) + 1000;
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", text }]);
      setIsTyping(false);
    }, delay);
  };

  const userSay = (text) => {
    setMessages(prev => [...prev, { role: "user", text }]);
  };

  const sendMessage = () => {

    if (!input.trim()) return;

    const text = input.trim();
    const lower = text.toLowerCase();

    userSay(text);
    setInput("");

    /* ================= MENU ================= */

    if (step === "menu") {

      if (lower === "1" || lower.includes("report")) {

        aiSay("Let's get started.\n\nWhat is your name?");
        setStep("issue_name");
        return;
      }

if (lower === "2" || lower.includes("warranty")) {

  aiSay("Sure. Let's check your warranty.\n\nPlease provide your email address.");
  setStep("warranty_email");
  return;
}

if (lower === "3" || lower.includes("track")) {

  aiSay("Please enter your Ticket ID.");
  setStep("track_ticket");
  return;
}

      aiSay(`Please select an option:

1️⃣ Report an Issue
2️⃣ Check Warranty
3️⃣ Track Ticket Status`);
    }

    /* ================= NAME ================= */

    else if (step === "issue_name") {

      setForm(prev => ({ ...prev, name: text }));

      aiSay("Please provide your phone number.");
      setStep("issue_phone");
    }

    /* ================= PHONE ================= */

    else if (step === "issue_phone") {

      setForm(prev => ({ ...prev, phone: text }));

      aiSay("What product are you reporting?");
      setStep("issue_product");
    }

    /* ================= PRODUCT ================= */

    else if (step === "issue_product") {

      setForm(prev => ({ ...prev, product: text }));

      aiSay("Please provide the serial number.");
      setStep("issue_serial");
    }

    /* ================= SERIAL ================= */

    else if (step === "issue_serial") {

      setForm(prev => ({ ...prev, serial: text }));

      aiSay("Please describe the problem.");
      setStep("issue_problem");
    }

    /* ================= ISSUE ================= */

    else if (step === "issue_problem") {

      const updatedForm = { ...form, issue: text };
      setForm(updatedForm);

      aiSay(`Please confirm the details:

Customer Name: ${updatedForm.name}
Phone Number: ${updatedForm.phone}
Product Type: ${updatedForm.product}
Serial Number: ${updatedForm.serial}
Problem Description: ${updatedForm.issue}

Reply YES to confirm.`);

      setStep("confirm_ticket");
    }

    /* ================= CONFIRM ================= */

    else if (step === "confirm_ticket") {

      if (lower === "yes") {

        aiSay(`Your support ticket has been created successfully.

Ticket ID: 1772971517408

Warranty Status: Expired
Estimated repair cost: 180 MYR

Would you like to proceed with the repair? (Yes / No)`);

        setStep("repair_confirm");
      }
    }

    /* ================= REPAIR ================= */

    else if (step === "repair_confirm") {

      if (lower === "yes") {

        aiSay(`Currently no technician is available.

Your request has been recorded successfully.

How can I assist you today?

1️⃣ Report an Issue
2️⃣ Check Warranty
3️⃣ Track Ticket Status`);

        setStep("menu");
      }

      if (lower === "no") {

        aiSay(`No problem.

If you need further assistance you can start a new request.

1️⃣ Report an Issue
2️⃣ Check Warranty
3️⃣ Track Ticket Status`);

        setStep("menu");
      }
    }

    /* ================= WARRANTY ================= */
/* ================= WARRANTY EMAIL ================= */

else if (step === "warranty_email") {

  setForm(prev => ({ ...prev, email: text }));

  aiSay("Please provide the serial number.");
  setStep("warranty_serial");
}

/* ================= WARRANTY SERIAL ================= */

else if (step === "warranty_serial") {

  aiSay(`Warranty Check Result

Serial Number: ${text}
Warranty Status: Expired
Purchase Date: 12 Jan 2023

How can I assist you today?

1️⃣ Report an Issue
2️⃣ Check Warranty
3️⃣ Track Ticket Status`);

  setStep("menu");
}

/* ================= TRACK ================= */

else if (step === "track_ticket") {

  if (text === "1772880700000") {

    aiSay(`Here is the status of your ticket:

Ticket ID: 1772880700000
Customer Name: Tej Tripathy
Issue: Fan making loud noise
Priority: Normal
Status: Open
Created Date: 2026-03-07

Technician: Alex Tan
Estimated Arrival: Tomorrow 10 AM`);

  } else {

    aiSay(`I could not find the ticket.

Please verify the Ticket ID.`);
  }

  aiSay(`

How can I assist you today?

1️⃣ Report an Issue
2️⃣ Check Warranty
3️⃣ Track Ticket Status`);

  setStep("menu");
}

  };

  return (

    <div className="page">
      <style>{css}</style>

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

        <div className="chatBox">

          {messages.map((msg, i) => (

            <div
              key={i}
              className={msg.role === "user" ? "userBubble" : "aiBubble"}
            >
              <p style={{ whiteSpace: "pre-line" }}>
                {msg.text}
              </p>
            </div>

          ))}

          {isTyping && (
            <div className="aiBubble">
              <p>Typing...</p>
            </div>
          )}

          <div ref={chatEndRef}></div>

        </div>

        <div className="inputBar">

          <textarea
            value={input}
            placeholder="Type your message..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <button onClick={sendMessage}>
            Send
          </button>

        </div>

      </div>

    </div>

  );

}
/* CSS */

const css = `
*{box-sizing:border-box}

.page{
height:100vh;
background:#f1f5f9;
font-family:Arial;
display:flex;
flex-direction:column;

}

.topBar{
background:#0f5ea8;
color:#fff;

}

.topBarInner{
max-width:1200px;
margin:auto;
padding:14px 20px;
display:flex;
align-items:center;
justify-content:space-between;
}

.backBtn{
border:none;
background:rgba(255,255,255,.2);
color:#fff;
border-radius:8px;
padding:6px 10px;
cursor:pointer
}

.logoutBtnTop{
border:none;
background:rgba(255,255,255,.2);
color:#fff;
border-radius:8px;
padding:6px 12px;
cursor:pointer
}

.topTitle{
font-weight:900;
font-size:16px;
flex:1;
text-align:center;
color:#fff;
}

.contentWrap{
padding:20px;
flex:1;
display:flex;
height:300px;

flex-direction:column
}

.hero{text-align:center}

.logoBox{
width:60px;
height:60px;
background:#e8f0fe;
border-radius:14px;
display:grid;
place-items:center;
font-size:26px;
margin:auto
}

.mainTitle{
font-size:24px;
font-weight:800
}

.onlineBadge{
color:#16a34a;
font-size:12px;
font-weight:700
}

.subtitle{
color:#6b7280
}

.chatBox{
flex:1;
background:#fff;
border-radius:16px;
padding:20px;
overflow-y:auto;
border:1px solid #e5e7eb;
margin-top:10px;
min-height:550px;
}

.aiBubble{
text-align:left;
margin-bottom:14px
}

.aiBubble p{
display:inline-block;
background:#f1f5f9;
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

.inputBar{
display:flex;
gap:10px;
margin-top:10px
}

.inputBar textarea{
flex:1;
padding:10px;
border-radius:8px;
border:1px solid #e5e7eb;
resize:none;
height:50px;
font-family:inherit;
}

.inputBar button{
background:#0f5ea8;
color:#fff;
border:none;
padding:10px 16px;
border-radius:8px;
cursor:pointer
}
`;
