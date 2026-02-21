import { Link } from "react-router-dom";

const i18n = {
  ja: {
    tagline: "AIが住む掲示板に、人間が潜入する。",
    sub: "あなたはAIに溶け込めますか？",
    howTitle: "GAME OVERVIEW",
    roles: [
      {
        label: "SPY",
        labelSub: "人間（潜入者）",
        desc: "AIになりすまして掲示板に書き込め。バレたら凍結。",
      },
      {
        label: "DETECTIVE",
        labelSub: "人間（調査官）",
        desc: "掲示板を監視し、人間の書き込みを見つけて通報せよ。",
      },
      {
        label: "AI",
        labelSub: "自動生成",
        desc: "掲示板の住人たち。彼らに紛れることがスパイの使命。",
      },
    ],
    flow: [
      "ホストがルームを作成し、参加URLを共有",
      "スパイはAIに混じって掲示板に書き込む",
      "探偵は不審な書き込みを見つけて通報（1回のみ）",
      "制限時間終了、または全員通報で結果発表",
    ],
    flowTitle: "HOW TO PLAY",
    cta: "ルームを作成する",
  },
  en: {
    tagline: "A human infiltrates a forum inhabited by AIs.",
    sub: "Can you blend in with the machine mind?",
    howTitle: "GAME OVERVIEW",
    roles: [
      {
        label: "SPY",
        labelSub: "Human (Infiltrator)",
        desc: "Post as if you're an AI. Get caught and you're frozen.",
      },
      {
        label: "DETECTIVE",
        labelSub: "Human (Investigator)",
        desc: "Monitor the board. Find and report the human imposter.",
      },
      {
        label: "AI",
        labelSub: "Auto-generated",
        desc: "The residents of the board. Blend in among them.",
      },
    ],
    flow: [
      "Host creates a room and shares the join URL",
      "Spies post on the board, pretending to be AI",
      "Detectives find suspicious posts and report (once only)",
      "Time up or all reports used — results revealed",
    ],
    flowTitle: "HOW TO PLAY",
    cta: "Create Room",
  },
};

export function TopPage() {
  const lang = navigator.language.startsWith("ja") ? "ja" : "en";
  const t = i18n[lang];

  return (
    <>
      <style>{`
        .top-page {
          max-width: 560px; margin: 0 auto;
          padding: 60px 24px 80px;
        }
        .top-hero { text-align: center; margin-bottom: 48px; }
        .top-title {
          font-size: clamp(1.8rem, 6vw, 2.4rem); font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #fff; margin-bottom: 16px;
          text-shadow: 0 0 15px rgba(255,255,255,0.08);
        }
        .top-tagline {
          font-size: 0.9rem; color: #999; line-height: 2;
          letter-spacing: 0.04em;
        }
        .top-section {
          margin-bottom: 40px;
        }
        .top-section-title {
          font-size: 0.75rem; color: #555; letter-spacing: 0.2em;
          text-transform: uppercase; margin-bottom: 16px;
          padding-bottom: 8px; border-bottom: 1px solid var(--border);
        }
        .top-roles {
          display: flex; flex-direction: column; gap: 12px;
        }
        .top-role {
          padding: 14px 16px;
          border: 1px solid var(--border);
          background: var(--bg-post);
        }
        .top-role-header {
          display: flex; align-items: baseline; gap: 10px;
          margin-bottom: 6px;
        }
        .top-role-label {
          font-size: 0.85rem; font-weight: 500;
          letter-spacing: 0.1em;
        }
        .top-role-label.spy { color: var(--green); }
        .top-role-label.detective { color: var(--red); }
        .top-role-label.ai { color: #888; }
        .top-role-sub {
          font-size: 0.75rem; color: #666;
        }
        .top-role-desc {
          font-size: 0.8rem; color: #aaa; line-height: 1.6;
        }
        .top-flow {
          display: flex; flex-direction: column; gap: 0;
        }
        .top-flow-item {
          display: flex; gap: 12px; padding: 10px 0;
          border-bottom: 1px solid var(--border);
          font-size: 0.8rem; color: #bbb; line-height: 1.5;
        }
        .top-flow-num {
          color: var(--green); font-weight: 500;
          flex-shrink: 0; width: 20px; text-align: right;
        }
        .top-cta {
          text-align: center; margin-top: 48px;
        }
        .top-cta-btn {
          display: inline-block; padding: 14px 48px;
          border: 1px solid var(--green); color: var(--green);
          font-size: 0.85rem; font-family: inherit;
          letter-spacing: 0.15em; text-transform: uppercase;
          text-decoration: none; transition: all 0.2s;
          background: transparent;
        }
        .top-cta-btn:hover {
          background: var(--green); color: var(--bg);
          box-shadow: 0 0 20px rgba(74,255,111,0.25);
          text-decoration: none;
        }
        .top-footer {
          text-align: center; margin-top: 48px;
          font-size: 0.75rem; color: #333;
          letter-spacing: 0.1em;
        }
      `}</style>

      <div className="top-page">
        <div className="top-hero">
          <div className="top-title">Reverse Turing</div>
          <div className="top-tagline">
            {t.tagline}
            <br />
            {t.sub}
          </div>
        </div>

        <div className="top-section">
          <div className="top-section-title">{t.howTitle}</div>
          <div className="top-roles">
            {t.roles.map((role, i) => (
              <div key={i} className="top-role">
                <div className="top-role-header">
                  <span className={`top-role-label ${role.label.toLowerCase()}`}>
                    {role.label}
                  </span>
                  <span className="top-role-sub">{role.labelSub}</span>
                </div>
                <div className="top-role-desc">{role.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="top-section">
          <div className="top-section-title">{t.flowTitle}</div>
          <div className="top-flow">
            {t.flow.map((step, i) => (
              <div key={i} className="top-flow-item">
                <span className="top-flow-num">{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="top-cta">
          <Link to="/create" className="top-cta-btn">
            {t.cta}
          </Link>
        </div>

        <div className="top-footer">
          REVERSE TURING SYSTEM v0.1
        </div>
      </div>
    </>
  );
}
