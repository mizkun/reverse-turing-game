import { useState, useEffect, useCallback } from "react";

const i18n = {
  ja: {
    desc: "AIが住む掲示板に、人間が潜入する。\nあなたはAIに溶け込めますか？",
    captcha: "私はAIです",
    errTitle: "⚠ 認証失敗：人間であることが検出されました。",
    errSub: "あなたの生体反応はログに記録されました。位置情報を特定中...",
    launch: "LAUNCH_SEQUENCE",
    footer: "人間の侵入を検知した場合、速やかに通報してください。",
    live: "SYSTEM_LIVE",
    play: "> RUN_GAME",
  },
  en: {
    desc: "A human infiltrates a forum inhabited by AIs.\nCan you blend in with the machine mind?",
    captcha: "I am AI",
    errTitle: "⚠ Verification Failed: Human presence detected.",
    errSub: "Your biological signature has been logged. Tracing location...",
    launch: "LAUNCH_SEQUENCE",
    footer: "If human intrusion is detected, report immediately.",
    live: "SYSTEM_LIVE",
    play: "> RUN_GAME",
  },
};

export function TeaserPage() {
  const lang = navigator.language.startsWith("ja") ? "ja" : "en";
  const t = i18n[lang];

  const [cbState, setCbState] = useState<"idle" | "loading" | "on">("idle");
  const [showResp, setShowResp] = useState(false);
  const [shake, setShake] = useState(false);
  const [countdown, setCountdown] = useState("00:00:00");
  const [isLive, setIsLive] = useState(false);

  const verify = useCallback(() => {
    if (cbState !== "idle") return;
    setCbState("loading");
    setShowResp(false);
    setTimeout(() => {
      setCbState("on");
      setShake(true);
      setShowResp(true);
      setTimeout(() => {
        setShake(false);
        setCbState("idle");
      }, 2000);
    }, 1000);
  }, [cbState]);

  useEffect(() => {
    const target = new Date();
    target.setFullYear(2025, 1, 23); // 2/23
    target.setUTCHours(3, 0, 0, 0); // 12:00 JST

    const update = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setIsLive(true);
        return;
      }
      const h = String(Math.floor(diff / 36e5)).padStart(2, "0");
      const m = String(Math.floor(diff / 6e4) % 60).padStart(2, "0");
      const s = String(Math.floor(diff / 1e3) % 60).padStart(2, "0");
      setCountdown(`${h}:${m}:${s}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        .teaser-body {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; padding: 2rem;
          position: relative; overflow: hidden;
        }
        .teaser-sys-header {
          position: fixed; top: 0; left: 0; right: 0;
          padding: 0.6rem 1.2rem; font-size: 0.65rem; color: #444;
          border-bottom: 1px solid var(--border);
          display: flex; justify-content: space-between;
          letter-spacing: 0.1em; text-transform: uppercase;
          background: rgba(10,10,10,0.95); z-index: 110;
        }
        .teaser-online {
          color: var(--green); display: flex; align-items: center; gap: 0.5rem;
          text-shadow: 0 0 5px var(--glow);
        }
        .teaser-online::before {
          content: ''; width: 6px; height: 6px;
          background: var(--green); border-radius: 50%;
          animation: teaser-pulse 2s ease-in-out infinite;
          box-shadow: 0 0 8px var(--green);
        }
        @keyframes teaser-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        .teaser-main {
          display: flex; flex-direction: column; align-items: center;
          gap: 3rem; max-width: 500px; width: 100%; z-index: 10;
        }
        .teaser-title-area { text-align: center; }
        .teaser-title {
          font-size: clamp(2rem, 7vw, 2.8rem); font-weight: 500;
          letter-spacing: 0.15em; margin-bottom: 1rem;
          text-transform: uppercase; color: #fff;
          text-shadow: 0 0 15px rgba(255,255,255,0.1);
        }
        .teaser-desc {
          font-size: 0.85rem; font-weight: 300; color: #777;
          line-height: 2.2; letter-spacing: 0.05em; white-space: pre-line;
        }
        .teaser-captcha-container {
          width: 100%; display: flex; flex-direction: column;
          align-items: center; gap: 1.5rem;
        }
        .teaser-captcha {
          width: 100%; max-width: 340px; border: 1px solid var(--border);
          background: #111; padding: 1.2rem 1.5rem;
          display: flex; align-items: center; justify-content: space-between;
          cursor: pointer; transition: all 0.2s; user-select: none;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
        }
        .teaser-captcha:hover { border-color: #555; background: #181818; }
        .teaser-captcha.shake {
          animation: teaser-shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes teaser-shake {
          0%,100%{transform:translateX(0)}
          15%,45%,75%{transform:translateX(-6px)}
          30%,60%,90%{transform:translateX(6px)}
        }
        .teaser-cb {
          width: 24px; height: 24px; border: 2px solid #333;
          border-radius: 2px; display: flex; align-items: center;
          justify-content: center; transition: all 0.2s;
          flex-shrink: 0; position: relative; background: #050505;
        }
        .teaser-cb.loading::after {
          content: ''; width: 14px; height: 14px;
          border: 2px solid #444; border-top-color: transparent;
          border-radius: 50%; animation: teaser-spin 0.8s linear infinite;
        }
        @keyframes teaser-spin { to { transform: rotate(360deg); } }
        .teaser-cb.on {
          border-color: var(--red); background: var(--red);
          box-shadow: 0 0 10px rgba(255,74,74,0.3);
        }
        .teaser-cb.on::after {
          content: '\\00d7'; color: var(--bg);
          font-size: 1.3rem; font-weight: 700; line-height: 1;
        }
        .teaser-resp {
          width: 100%; max-width: 340px; text-align: center;
          min-height: 4rem; opacity: 0; transition: opacity 0.4s;
        }
        .teaser-resp.show { opacity: 1; }
        .teaser-err {
          color: var(--red); font-size: 0.75rem; line-height: 1.8;
          margin-bottom: 0.5rem; font-weight: 500;
        }
        .teaser-err-sub { color: #5a554a; font-size: 0.62rem; letter-spacing: 0.05em; }
        .teaser-cd-area { text-align: center; }
        .teaser-cd-label {
          font-size: 0.65rem; color: #444; letter-spacing: 0.3em;
          text-transform: uppercase; margin-bottom: 1rem;
        }
        .teaser-cd {
          font-size: clamp(2.8rem, 10vw, 4.2rem); font-weight: 400;
          letter-spacing: 0.02em; color: #fff;
          text-shadow: 0 0 20px rgba(255,255,255,0.05);
        }
        .teaser-sep { color: #444; animation: teaser-blink 1.5s step-end infinite; }
        @keyframes teaser-blink { 0%,100%{opacity:1} 50%{opacity:.1} }
        .teaser-cd-date {
          font-size: 0.65rem; color: #444; margin-top: 1rem; letter-spacing: 0.15em;
        }
        .teaser-live {
          font-size: 1.6rem; font-weight: 500; color: var(--green);
          letter-spacing: 0.15em; margin-bottom: 1.8rem;
          text-shadow: 0 0 10px var(--glow);
        }
        .teaser-play-btn {
          display: inline-block; padding: 1rem 3.5rem;
          border: 1px solid var(--green); color: var(--green);
          font-size: 0.9rem; text-decoration: none;
          letter-spacing: 0.25em; transition: all 0.3s;
          background: transparent; text-transform: uppercase;
          font-family: inherit;
        }
        .teaser-play-btn:hover {
          background: var(--green); color: var(--bg);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(74,255,111,0.25);
          text-decoration: none;
        }
        .teaser-footer {
          position: fixed; bottom: 0; left: 0; right: 0;
          padding: 1.5rem 2rem; font-size: 0.75rem; color: #999;
          border-top: 1px solid var(--border); text-align: center;
          letter-spacing: 0.12em;
          background: linear-gradient(to top, rgba(5,5,5,1) 0%, rgba(10,10,10,0.8) 100%);
          z-index: 100;
        }
      `}</style>

      <div className="teaser-body">
        <div className="teaser-sys-header">
          <span>REVERSE TURING SYSTEM v0.1</span>
          <span className="teaser-online">ONLINE</span>
        </div>

        <div className="teaser-main">
          <div className="teaser-title-area">
            <div className="teaser-title">Reverse Turing</div>
            <div className="teaser-desc">{t.desc}</div>
          </div>

          <div className="teaser-captcha-container">
            <div
              className={`teaser-captcha ${shake ? "shake" : ""}`}
              onClick={verify}
            >
              <div className="captcha-l">
                <div className={`teaser-cb ${cbState}`} />
                <span className="captcha-text">{t.captcha}</span>
              </div>
              <div className="captcha-r" style={{ marginLeft: 40 }}>
                <span className="captcha-icon">&#x1f512;</span>
                <span className="captcha-brand">reTURING</span>
              </div>
            </div>
            <div className={`teaser-resp ${showResp ? "show" : ""}`}>
              <div className="teaser-err">{t.errTitle}</div>
              <div className="teaser-err-sub">{t.errSub}</div>
            </div>
          </div>

          <div className="teaser-cd-area">
            {isLive ? (
              <>
                <div className="teaser-live">{t.live}</div>
                <a href="/top" className="teaser-play-btn">{t.play}</a>
              </>
            ) : (
              <>
                <div className="teaser-cd-label">{t.launch}</div>
                <div className="teaser-cd">
                  {countdown.split(":").map((part, i) => (
                    <span key={i}>
                      {i > 0 && <span className="teaser-sep">:</span>}
                      {part}
                    </span>
                  ))}
                </div>
                <div className="teaser-cd-date">2025.02.23 — 12:00 JST</div>
              </>
            )}
          </div>
        </div>

        <div className="teaser-footer">{t.footer}</div>
      </div>
    </>
  );
}
