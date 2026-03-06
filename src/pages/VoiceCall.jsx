import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VoiceCall() {
  const navigate = useNavigate();

  const [seconds, setSeconds] = useState(3);
  const [isEnded, setIsEnded] = useState(false);

  // Speech states
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef(null);

  // Timer
  useEffect(() => {
    if (isEnded) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isEnded]);

  // Setup SpeechRecognition once
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
      const text = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setTranscript(text);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const timeText = `${mm}:${ss}`;

  const endCall = () => {
    setIsEnded(true);
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch (e) {}
  };

  const toggleMic = () => {
    if (isEnded) return;

    const recognition = recognitionRef.current;
    if (!recognition) {
      alert("Speech Recognition not supported. Please use Chrome or Edge.");
      return;
    }

    if (!isListening) {
      setTranscript("");
      setIsListening(true);
      try {
        recognition.start();
      } catch (e) {
        setIsListening(false);
      }
    } else {
      try {
        recognition.stop();
      } catch (e) {}
      setIsListening(false);
    }
  };

  return (
    <div className="page">
      <style>{css}</style>

      {/* Full-width top bar */}
      <div className="topBar">
        <div className="topBarInner">
          <button className="backBtn" onClick={() => navigate(-1)}>
            ‹
          </button>
          <div className="topTitle">Voice Call</div>
          <div style={{ width: 36 }} />
        </div>
      </div>

      {/* Centered call panel (nice on desktop, full width on mobile) */}
      <div className="wrap">
        <div className="panel">
          {/* Call Info */}
          <div className="callInfo">
            <div className="callLeft">
              <span className="dot" />
              <span className="callName">AI Voice Support</span>
              <span className="callTime">{timeText}</span>
            </div>
            <div className="readyPill">Ready</div>
          </div>

          {/* Chat (auto fills remaining height, scrolls when needed) */}
          <div className="chatArea">
            <div className="agentTag">AI AGENT</div>

            <div className="agentBubble">
              Hello! Welcome to TechNova Customer Support. I'm your AI
              assistant. May I know your name, please?
            </div>

            {transcript && (
              <div className="userBubble">
                <div className="userTag">YOU</div>
                <div className="userText">{transcript}</div>
              </div>
            )}
          </div>

          {/* Controls pinned to bottom of panel */}
          <div className="controls">
            {!isEnded ? (
              <>
                <button
                  type="button"
                  onClick={toggleMic}
                  className="micBtn"
                  aria-label="Toggle microphone"
                  style={{ background: isListening ? "#16a34a" : "#0f5ea8" }}
                >
                  🎤
                </button>

                <div className="tapText">
                  {isListening ? "Listening... tap to stop" : "Tap to speak"}
                </div>

                <button className="endBtn" onClick={endCall}>
                  🚫 End Call
                </button>
              </>
            ) : (
              <div className="endedBox">
                <div className="endedTitle">Call Ended</div>
                <div className="endedSub">Duration: {timeText}</div>
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
  --bg: #e6ebf0;
  --nav: #1f63a7;
  --panel: #f4f6f8;
  --panel2: #eef2f6;

  --stroke: #d4dbe3;

  --text: #1f2937;
  --muted: #6b7280;

  --primary: #1e5fa0;
  --primary-light: #e8f1fb;

  --success: #16a34a;
  --danger: #ef4444;
}

.page{
  min-height:100vh;
  background: var(--bg);
  font-family: Arial, sans-serif;
}

/* Top bar */
.topBar{
  background: var(--nav);
  color:#fff;
  position: sticky;
  top:0;
  z-index:10;
}

.topBarInner{
  max-width:980px;
  margin:0 auto;
  padding:14px 18px;
  display:flex;
  align-items:center;
  justify-content:space-between;
}

.backBtn{
  width:36px;
  height:36px;
  border-radius:10px;
  border:none;
  background:rgba(255,255,255,.2);
  color:#fff;
  font-size:20px;
  cursor:pointer;
}

.topTitle{
  font-weight:900;
  font-size:15px;
}

/* Layout wrapper */
.wrap{
  max-width:980px;
  margin:0 auto;
  padding:20px;
}

/* Chat panel */
.panel{
  background: var(--panel);
  border-radius:18px;
  border:1px solid var(--stroke);
  box-shadow:0 12px 28px rgba(0,0,0,0.08);
  overflow:hidden;

  display:flex;
  flex-direction:column;

  height:calc(100vh - 90px);
  min-height:520px;
}

/* Call info header */
.callInfo{
  padding:14px 16px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  background: var(--panel2);
  border-bottom:1px solid var(--stroke);
}

.callLeft{
  display:flex;
  align-items:center;
  gap:10px;
}

.dot{
  width:8px;
  height:8px;
  border-radius:999px;
  background:var(--success);
}

.callName{
  font-size:13px;
  font-weight:900;
}

.callTime{
  font-size:13px;
  color:var(--muted);
}

.readyPill{
  font-size:12px;
  font-weight:800;
  padding:6px 12px;
  border-radius:999px;
  background:#d1fae5;
  color:#065f46;
}

/* Chat area */
.chatArea{
  flex:1;
  padding:16px;
  overflow:auto;
}

/* AI message */
.agentTag{
  font-size:10px;
  letter-spacing:.8px;
  color:#1e5fa0;
  font-weight:900;
  margin-bottom:6px;
}

.agentBubble{
  max-width:720px;
  background:#e9eef4;
  padding:12px 14px;
  border-radius:14px;
  font-size:13px;
  line-height:1.45;
}

/* User message */
.userBubble{
  margin-top:12px;
  margin-left:auto;
  max-width:720px;
  background:var(--primary-light);
  border:1px solid #cfe2ff;
  padding:12px 14px;
  border-radius:14px;
}

.userTag{
  font-size:10px;
  letter-spacing:.8px;
  color:var(--muted);
  font-weight:900;
  margin-bottom:6px;
}

.userText{
  font-size:13px;
  line-height:1.45;
}

/* Bottom controls */
.controls{
  background: var(--panel2);
  border-top:1px solid var(--stroke);
  padding:16px;
  display:grid;
  place-items:center;
  gap:10px;
}

/* Mic button */
.micBtn{
  width:64px;
  height:64px;
  border-radius:999px;
  border:none;
  background:var(--primary);
  color:#fff;
  font-size:24px;
  cursor:pointer;
  box-shadow:0 8px 18px rgba(30,95,160,.3);
}

.tapText{
  color:var(--muted);
  font-size:12px;
}

/* End call */
.endBtn{
  width:min(520px,100%);
  border:none;
  border-radius:12px;
  padding:12px;
  background:var(--danger);
  color:#fff;
  font-weight:900;
  cursor:pointer;
}

/* Mobile */
@media (max-width:768px){
  .wrap{ padding:0; }

  .panel{
    height:calc(100vh - 64px);
    border-radius:0;
    box-shadow:none;
    border:none;
  }

  .topBarInner{ padding:14px; }
}
`;