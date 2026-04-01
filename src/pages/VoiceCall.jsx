import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VoiceCall() {
  const navigate = useNavigate();

  const [seconds, setSeconds] = useState(3);
  const [isEnded, setIsEnded] = useState(false);

  // Messages state synchronized with ChatSupport.jsx mock data
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: `Hello! How can I assist you today?

1️⃣ Report an Issue
2️⃣ Check Warranty
3️⃣ Track Ticket Status`,
    },
  ]);

  // Conversation state machine
  const [step, setStep] = useState("menu");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    product: "",
    serial: "",
    issue: "",
  });

  // Speech states
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, interimTranscript]);

  // Timer
  useEffect(() => {
    if (isEnded) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isEnded]);

  // Setup SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let resultText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        resultText += event.results[i][0].transcript;
      }
      setInterimTranscript(resultText);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Wait a tiny bit for result processing to finish
      setTimeout(() => {
        setInterimTranscript((text) => {
          if (text) {
            processFinalText(text);
          }
          return "";
        });
      }, 100);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) { }
    };
  }, []);

  const agentSay = (text) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setMessages((prev) => [...prev, { role: "agent", text }]);
      isProcessingRef.current = false;
    }, 1500);
  };

  const saveDemoTicket = (ticketData) => {
    const existing = JSON.parse(localStorage.getItem("TECH_DEMO_TICKETS") || "[]");
    const newTicket = {
      id: "DEMO-" + Math.floor(Math.random() * 9000000 + 1000000),
      ...ticketData,
      status: "open",
      createdAt: new Date().toISOString(),
      customerName: ticketData.name || "Demo Customer",
      technicianId: localStorage.getItem("technician_id") || "tech-123"
    };
    existing.unshift(newTicket);
    localStorage.setItem("TECH_DEMO_TICKETS", JSON.stringify(existing));
  };

  const processFinalText = (finalText) => {
    // Guard against double processing
    if (isProcessingRef.current || !finalText.trim()) return;
    isProcessingRef.current = true;

    const lower = finalText.toLowerCase().trim();

    // Add user message to history
    setMessages((prev) => [...prev, { role: "user", text: finalText }]);

    // Logic for conversation steps (similar to ChatSupport)
    if (step === "menu") {
      if (lower.includes("one") || lower.includes("1") || lower.includes("report")) {
        agentSay("Let's get started. What is your name?");
        setStep("issue_name");
      } else if (lower.includes("two") || lower.includes("2") || lower.includes("warranty")) {
        agentSay("Sure! Please provide your email address to check the warranty.");
        setStep("warranty_email");
      } else if (lower.includes("three") || lower.includes("3") || lower.includes("track")) {
        agentSay("Please say or enter your Ticket ID.");
        setStep("track_ticket");
      } else {
        agentSay("Please select an option by saying: Report an Issue, Check Warranty, or Track Status.");
        isProcessingRef.current = false;
      }
    }
    else if (step === "warranty_email") {
      setForm(prev => ({ ...prev, email: finalText }));
      agentSay("Please provide the serial number.");
      setStep("warranty_serial");
    }
    else if (step === "warranty_serial") {
      agentSay(`Based on our records for serial ${finalText}, the warranty status is EXPIRED (Purchase Date: 12 Jan 2023). How else can I assist you today? 1. Report Issue, 2. Check Warranty, 3. Track Status.`);
      setStep("menu");
    }
    else if (step === "track_ticket") {
      agentSay(`Ticket Status for ID ${finalText}: Customer Name: Amirul, Issue: Fan making loud noise, Status: Open, Estimated Arrival: Tomorrow 10 AM. Anything else?`);
      setStep("menu");
    }
    else if (step === "issue_name") {
      setForm(prev => ({ ...prev, name: finalText }));
      agentSay(`Nice to meet you, ${finalText}. What is your phone number?`);
      setStep("issue_phone");
    }
    else if (step === "issue_phone") {
      setForm(prev => ({ ...prev, phone: finalText }));
      agentSay("And what product are you reporting?");
      setStep("issue_product");
    }
    else if (step === "issue_product") {
      setForm(prev => ({ ...prev, product: finalText }));
      agentSay("Please say the serial number if you have it.");
      setStep("issue_serial");
    }
    else if (step === "issue_serial") {
      setForm(prev => ({ ...prev, serial: finalText }));
      agentSay("Finally, please describe the problem you're facing.");
      setStep("issue_problem");
    }
    else if (step === "issue_problem") {
      const updatedForm = { ...form, issue: finalText };
      setForm(updatedForm);
      agentSay(`I've recorded that. Please confirm: ${updatedForm.product} issue for ${updatedForm.name}. Say YES to confirm the ticket.`);
      setStep("confirm_ticket");
    }
    else if (step === "confirm_ticket") {
      if (lower.includes("yes") || lower.includes("confirm")) {
        saveDemoTicket(form);
        agentSay("Your ticket #1772971517408 has been created! Our technicians will contact you soon.");
        setStep("repair_confirm"); // end state
      } else {
        agentSay("I'm sorry, I didn't get that. Say YES to confirm or speak to a different agent.");
        isProcessingRef.current = false;
      }
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const timeText = `${mm}:${ss}`;

  const endCall = () => {
    setIsEnded(true);
    setIsListening(false);
    isProcessingRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch (e) { }
  };

  const toggleMic = () => {
    if (isEnded || isProcessing || isProcessingRef.current) return;

    const recognition = recognitionRef.current;
    if (!recognition) {
      alert("Speech Recognition not supported. Please use Chrome or Edge.");
      return;
    }

    if (!isListening) {
      setInterimTranscript("");
      setIsListening(true);
      try {
        recognition.start();
      } catch (e) {
        setIsListening(false);
      }
    } else {
      try {
        recognition.stop();
      } catch (e) { }
      setIsListening(false);
    }
  };

  return (
    <div className="page">
      <style>{css}</style>

      <div className="topBar">
        <div className="topBarInner">
          <button className="backBtn" onClick={() => navigate(-1)}>
            ‹
          </button>
          <div className="topTitle">AI Voice Support</div>
          <div style={{ width: 36 }} />
        </div>
      </div>

      <div className="wrap">
        <div className="panel">
          <div className="callInfo">
            <div className="callLeft">
              <span className="dot" style={{ background: isEnded ? "#94a3b8" : "#16a34a" }} />
              <span className="callName">TechNova Voice Agent</span>
              <span className="callTime">{timeText}</span>
            </div>
            <div className="readyPill" style={{
              background: isEnded ? "#f1f5f9" : "#d1fae5",
              color: isEnded ? "#64748b" : "#065f46",
              fontSize: '11px',
              fontWeight: 900,
              padding: '4px 10px',
              borderRadius: '20px'
            }}>
              {isEnded ? "SESSION ENDED" : "LIVE SESSION"}
            </div>
          </div>

          <div className="chatArea" ref={scrollRef}>
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === "agent" ? "agentSection" : "userSection"}>
                <div className={m.role === "agent" ? "agentTag" : "userTag"}>
                  {m.role === "agent" ? "AI AGENT" : "YOU"}
                </div>
                <div className={m.role === "agent" ? "agentBubble" : "userBubble"}>
                  {m.text}
                </div>
              </div>
            ))}

            {interimTranscript && (
              <div className="userSection">
                <div className="userTag">YOU (Speaking...)</div>
                <div className="userBubble interim">{interimTranscript}</div>
              </div>
            )}

            {isProcessing && (
              <div className="agentSection">
                <div className="agentTag">AI Processing...</div>
                <div className="agentBubble typing">. . .</div>
              </div>
            )}
          </div>

          <div className="controls">
            {!isEnded ? (
              <>
                <button
                  type="button"
                  onClick={toggleMic}
                  className="micBtn"
                  aria-label="Toggle microphone"
                  style={{
                    background: isListening ? "#ef4444" : "#0f5ea8",
                    animation: isListening ? "pulse 1.5s infinite" : "none"
                  }}
                >
                  {isListening ? "⏹" : "🎤"}
                </button>

                <div className="statusRow">
                  <div className="tapText">
                    {isProcessing
                      ? "Analyzing your voice..."
                      : isListening
                        ? "Listening... Tap button to stop"
                        : "Tap to speak with AI"}
                  </div>
                </div>

                <div className="actionsRow">
                  <button className="endBtn" onClick={endCall}>
                    🚫 End Session
                  </button>
                </div>
              </>
            ) : (
              <div className="endedBox">
                <div className="endedTitle">Call Summary Created</div>
                <div className="endedSub">The AI has automatically generated a ticket based on your conversation.</div>
                <button className="returnBtn" onClick={() => navigate("/customer")}>
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
*{ box-sizing:border-box; }

:root{
  --bg: #f8fafc;
  --nav: #0f172a;
  --panel: #ffffff;
  --panel2: #f1f5f9;
  --stroke: #e2e8f0;
  --text: #0f172a;
  --muted: #64748b;
  --primary: #2563eb;
  --primary-light: #eff6ff;
  --success: #22c55e;
  --danger: #ef4444;
}

.page{
  min-height:100vh;
  background: var(--bg);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.topBar{
  background: var(--nav);
  color:#fff;
  position: sticky;
  top:0;
  z-index:10;
}

.topBarInner{
  max-width:1100px;
  margin:0 auto;
  padding:14px 20px;
  display:flex;
  align-items:center;
  justify-content:space-between;
}

.backBtn{
  width:36px;
  height:36px;
  border-radius:12px;
  border:none;
  background:rgba(255,255,255,.1);
  color:#fff;
  font-size:24px;
  cursor:pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.topTitle{
  font-weight:900;
  font-size:16px;
  letter-spacing: -0.5px;
}

.wrap{
  max-width:980px;
  margin:0 auto;
  padding:24px 20px;
}

.panel{
  background: var(--panel);
  border-radius:24px;
  border:1px solid var(--stroke);
  box-shadow:0 20px 50px rgba(0,0,0,0.05);
  overflow:hidden;
  display:flex;
  flex-direction:column;
  height:calc(100vh - 120px);
  min-height:600px;
}

.callInfo{
  padding:16px 20px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  background: #fff;
  border-bottom:1px solid var(--stroke);
}

.callLeft{
  display:flex;
  align-items:center;
  gap:12px;
}

.dot{
  width:10px;
  height:10px;
  border-radius:999px;
  background:var(--success);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
}

.callName{
  font-size:14px;
  font-weight:900;
  color: var(--text);
}

.callTime{
  font-size:14px;
  color:var(--muted);
  font-variant-numeric: tabular-nums;
}

.chatArea{
  flex:1;
  padding:24px;
  overflow:auto;
  display:flex;
  flex-direction:column;
  gap:20px;
  background: #f8fafc;
}

.agentSection{ align-self:flex-start; max-width:85%; }
.userSection{ align-self:flex-end; max-width:85%; text-align:right; }

.agentTag, .userTag{
  font-size:10px;
  letter-spacing:1px;
  font-weight:900;
  margin-bottom:8px;
  text-transform: uppercase;
}

.agentTag{ color:var(--primary); }
.userTag{ color:var(--muted); }

.agentBubble{
  background:#fff;
  padding:16px 20px;
  border-radius:0 20px 20px 20px;
  font-size:14px;
  line-height:1.5;
  color:var(--text);
  box-shadow: 0 2px 5px rgba(0,0,0,0.03);
  border: 1px solid var(--stroke);
}

.userBubble{
  background:var(--primary);
  padding:16px 20px;
  border-radius:20px 0 20px 20px;
  font-size:14px;
  line-height:1.5;
  color:#fff;
  text-align:left;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}

.userBubble.interim{
  background: #eff6ff;
  color: var(--primary);
  border: 1px dashed var(--primary);
  box-shadow: none;
}

.typing{
  font-weight: bold;
  letter-spacing: 3px;
  font-size: 20px;
  animation: blink 1.5s infinite;
  padding-bottom: 20px !important;
}

@keyframes blink {
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.controls{
  background: #fff;
  border-top:1px solid var(--stroke);
  padding:24px;
  display:flex;
  flex-direction: column;
  align-items: center;
  gap:16px;
}

.micBtn{
  width:72px;
  height:72px;
  border-radius:999px;
  border:none;
  background:var(--primary);
  color:#fff;
  font-size:28px;
  cursor:pointer;
  display: grid;
  place-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);
}

.micBtn:hover{ transform: scale(1.05); }

.statusRow{
  height: 24px;
  display: flex;
  align-items: center;
}

.tapText{
  color:var(--muted);
  font-size:13px;
  font-weight: 500;
}

.actionsRow{
  width: 100%;
  max-width: 400px;
}

.endBtn{
  width: 100%;
  border: 1px solid var(--stroke);
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  color: var(--danger);
  font-weight: 900;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.endBtn:hover{ background: #fff1f2; border-color: #fecaca; }

.endedBox{
  text-align: center;
  padding: 20px;
}

.endedTitle{ font-weight: 900; font-size: 22px; color: var(--text); letter-spacing: -0.5px; }
.endedSub{ font-size: 14px; color: var(--muted); margin: 10px 0 24px; line-height: 1.5; max-width: 320px; }

.returnBtn{
  background: var(--nav);
  color: #fff;
  border: none;
  padding: 14px 28px;
  border-radius: 14px;
  font-weight: 900;
  cursor: pointer;
  font-size: 15px;
  transition: transform 0.2s;
}

.returnBtn:hover{ transform: translateY(-2px); }

@media (max-width:768px){
  .wrap{ padding:0; }
  .panel{
    height:calc(100vh - 64px);
    border-radius:0;
    box-shadow:none;
    border:none;
  }
  .chatArea{ padding: 16px; }
  .agentSection, .userSection{ max-width: 90%; }
}
`;