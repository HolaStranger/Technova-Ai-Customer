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
    --bg: #f1f5f9;
    --nav: #091a2d;
    --panel: #0b1e35;
    --panel2: #0a2038;
    --stroke: rgba(255,255,255,.10);
    --text: rgba(255,255,255,.92);
    --muted: rgba(255,255,255,.72);
  }

  .page{
    min-height:100vh;
    background: var(--bg);
    font-family: Arial, sans-serif;
  }

  .topBar{
    background: var(--nav);
    color:#fff;
    position: sticky;
    top:0;
    z-index:10;
    border-bottom: 1px solid rgba(255,255,255,0.08);
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
    background:rgba(255,255,255,.12);
    color:#fff;
    font-size:22px;
    cursor:pointer;
  }

  .topTitle{ font-weight:900; font-size:14px; }

  /* center the panel nicely */
  .wrap{
    max-width: 980px;
    margin: 0 auto;
    padding: 18px;
  }

  /* the call panel fills the viewport nicely (no giant empty space) */
  .panel{
    background: var(--panel);
    border-radius: 18px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 18px 40px rgba(15,23,42,.12);
    overflow: hidden;

    /* layout */
    display: flex;
    flex-direction: column;

    /* key part: good height on desktop */
    height: calc(100vh - 72px - 36px); /* topbar + wrap padding */
    min-height: 520px;
  }

  .callInfo{
    padding: 14px 16px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    color: var(--text);
    background: var(--panel2);
    border-bottom: 1px solid var(--stroke);
  }

  .callLeft{
    display:flex;
    align-items:center;
    gap:10px;
    flex-wrap:wrap;
  }

  .dot{
    width:8px; height:8px;
    border-radius:999px;
    background:#10b981;
    display:inline-block;
  }

  .callName{ font-size:13px; font-weight:900; }
  .callTime{ font-size:13px; opacity:.85; }

  .readyPill{
    font-size:12px;
    font-weight:800;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,.12);
    white-space: nowrap;
  }

  /* chat fills available space and scrolls */
  .chatArea{
    flex: 1;
    padding: 16px;
    overflow: auto;
  }
  .chatArea::-webkit-scrollbar{ width: 10px; }
  .chatArea::-webkit-scrollbar-thumb{
    background: rgba(255,255,255,.10);
    border-radius: 999px;
  }

  .agentTag{
    font-size:10px;
    letter-spacing:.8px;
    color:#7dd3fc;
    font-weight:900;
    margin-bottom:8px;
  }

  .agentBubble{
    max-width: 720px;
    background: rgba(255,255,255,.10);
    color: #fff;
    padding: 12px 14px;
    border-radius: 14px;
    font-size: 13px;
    line-height: 1.45;
  }

  .userBubble{
    margin-top: 12px;
    max-width: 720px;
    margin-left: auto;
    background: rgba(15, 94, 168, 0.25);
    border: 1px solid rgba(59,130,246,.25);
    color:#fff;
    padding: 12px 14px;
    border-radius: 14px;
  }
  .userTag{
    font-size:10px;
    letter-spacing:.8px;
    color: rgba(255,255,255,.80);
    font-weight:900;
    margin-bottom:6px;
  }
  .userText{
    font-size:13px;
    line-height:1.45;
    color: var(--text);
    word-break: break-word;
  }

  /* controls pinned */
  .controls{
    background: var(--panel2);
    border-top: 1px solid var(--stroke);
    padding: 16px;
    display: grid;
    place-items: center;
    gap: 10px;
  }

  .micBtn{
    width: 64px;
    height: 64px;
    border-radius: 999px;
    border: none;
    display:grid;
    place-items:center;
    color:#fff;
    font-size: 24px;
    box-shadow: 0 12px 20px rgba(15, 94, 168, 0.25);
    cursor:pointer;
  }

  .tapText{
    color: var(--muted);
    font-size: 12px;
  }

  .endBtn{
    width: min(520px, 100%);
    border:none;
    border-radius: 12px;
    padding: 12px 14px;
    background: #ef4444;
    color:#fff;
    font-weight: 900;
    cursor:pointer;
  }

  .endedBox{
    width:100%;
    text-align:center;
    color:#fff;
    padding: 8px 0;
  }
  .endedTitle{ font-weight:900; font-size:14px; }
  .endedSub{ margin-top:4px; font-size:12px; opacity:.85; }

  /* ✅ Mobile: panel becomes full screen */
  @media (max-width: 768px){
    .wrap{ padding: 0; }
    .panel{
      height: calc(100vh - 64px);
      border-radius: 0;
      box-shadow: none;
      border: none;
    }
    .topBarInner{ padding: 14px 14px; }
  }
`;
