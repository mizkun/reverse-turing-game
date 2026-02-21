import { useState } from "react";

const TABS = [
  "Entry",
  "Rules-Spy",
  "Rules-Det",
  "CreateRoom",
  "Host",
  "Board",
  "Thread",
  "Result",
] as const;
type Tab = (typeof TABS)[number];

// --- Dummy Data ---
const dummyPosts = [
  { num: 2, name: "名無しさん", id: "aB3kx9Qw", time: "14:32:15", content: "なんか最近この板過疎ってね？" },
  { num: 3, name: "名無しさん", id: "Zp7mR2Lf", time: "14:32:48", content: "そんなことないだろ" },
  { num: 4, name: "名無しさん", id: "Kd9wY4Hn", time: "14:33:21", content: ">>2 お前がそう思うならそうなんだろ" },
  { num: 5, name: "名無しさん", id: "aB3kx9Qw", time: "14:34:05", content: "草" },
  { num: 6, name: "名無しさん", id: "Xm2pL8Vq", time: "14:34:33", content: "今日寒すぎない？エアコンつけるか迷う" },
  { num: 7, name: "名無しさん", id: "Rw5nT1Jc", time: "14:35:12", content: "つけろよ" },
  { num: 8, name: "名無しさん", id: "Zp7mR2Lf", time: "14:35:44", content: "電気代やばいからなぁ..." },
  { num: 9, name: "名無しさん", id: "Hv8gK3Ys", time: "14:36:20", content: "この板の住民って何時に寝てるの" },
  { num: 10, name: "名無しさん", id: "Kd9wY4Hn", time: "14:36:58", content: "寝ない（断言）" },
];

const dummyThreads = [
  { id: "t1", title: "雑談スレッド Part.1", postCount: 47 },
  { id: "t2", title: "今日の晩飯を報告するスレ", postCount: 23 },
  { id: "t3", title: "好きなプログラミング言語", postCount: 31 },
];

const eliminatedId = "Hv8gK3Ys";

// --- Components ---

function RulesScreen({ role, onContinue }: { role: "spy" | "detective"; onContinue: () => void }) {
  return (
    <div className="rules-page">
      {role === "spy" ? (
        <>
          <div className="rules-header">
            <div className="rules-status">VERIFIED — AI ENTITY</div>
          </div>
          <div className="rules-body">
            <div className="rules-list">
              <div className="rules-item">あなたは<span className="hl-green">書き込み権限</span>を持っています</div>
              <div className="rules-item">人間が閲覧者として潜んでおり、<span className="hl-green">通報される</span>と凍結されます</div>
              <div className="rules-item"><span className="hl-green">制限時間内に生き残れば勝利</span>です</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="rules-header">
            <div className="rules-status rules-status-alert">WARNING — HUMAN DETECTED</div>
          </div>
          <div className="rules-body">
            <div className="rules-list">
              <div className="rules-item">この掲示板ではAI同士が会話しています</div>
              <div className="rules-item">その中に<span className="hl-red">人間がなりすまして</span>書き込んでいます</div>
              <div className="rules-item">不審な書き込みを見つけたら<span className="hl-red">通報</span>で凍結できます（<span className="hl-red">1回のみ</span>）</div>
            </div>
          </div>
        </>
      )}
      <div className="rules-loading">セッションを準備中...</div>
    </div>
  );
}

function MockEntry() {
  const [state, setState] = useState<"idle" | "loading" | "spy" | "detective" | "spy-rules" | "detective-rules">("idle");

  const handleClick = () => {
    if (state !== "idle") return;
    setState("loading");
    setTimeout(() => setState("spy"), 1200);
  };

  if (state === "spy-rules") {
    return <RulesScreen role="spy" onContinue={() => setState("detective-rules")} />;
  }
  if (state === "detective-rules") {
    return <RulesScreen role="detective" onContinue={() => setState("idle")} />;
  }

  return (
    <div className="entry-page">
      <div className="recaptcha-container">
        <div className="captcha" onClick={handleClick}>
          <div className="captcha-l">
            <div className={`cb ${state === "spy" || state === "detective" ? "on" : ""}`} />
            <span className="captcha-text">
              {state === "loading" ? "認証中..." : "私はAIです"}
            </span>
          </div>
          <div className="captcha-r">
            <span className="captcha-icon">&#x1f512;</span>
            <span className="captcha-brand">reTURING</span>
          </div>
        </div>

        {(state === "spy" || state === "detective") && (
          <div className="captcha-response show">
            {state === "spy" && (
              <div onClick={() => setState("spy-rules")}>
                <div className="captcha-ok">✓ AIであることが確認されました。</div>
                <div className="captcha-ok-sub">掲示板への書き込み権限が付与されました。</div>
                <p className="mock-hint">(click to continue)</p>
              </div>
            )}
            {state === "detective" && (
              <div onClick={() => setState("detective-rules")}>
                <div className="captcha-err">⚠ 認証失敗：人間であることが検出されました。</div>
                <div className="captcha-err-sub">あなたの生体反応はログに記録されました。閲覧モードで入場します。</div>
                <p className="mock-hint">(click to continue)</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MockCreateRoom() {
  const [spySlots, setSpySlots] = useState(2);
  const [roundMinutes, setRoundMinutes] = useState(7);

  return (
    <div className="create-room-page">
      <h1>ルームを作成</h1>
      <p className="create-room-desc">掲示板を開設して、スパイと探偵のゲームを始めましょう。</p>
      <div className="create-room-form">
        <div className="form-group">
          <label>スパイ枠</label>
          <div className="form-options">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className={`option-btn ${spySlots === n ? "active" : ""}`} onClick={() => setSpySlots(n)}>
                {n}人
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>ラウンド時間</label>
          <div className="form-options">
            {[3, 5, 7, 10, 15].map((n) => (
              <button key={n} className={`option-btn ${roundMinutes === n ? "active" : ""}`} onClick={() => setRoundMinutes(n)}>
                {n}分
              </button>
            ))}
          </div>
        </div>
        <button className="create-btn">ルームを作成する</button>
      </div>
    </div>
  );
}

function MockHost() {
  const [status, setStatus] = useState<"waiting" | "playing" | "revealed">("waiting");

  return (
    <div className="host-page">
      <h1>ホスト管理</h1>
      <div className="mock-state-toggle">
        {(["waiting", "playing", "revealed"] as const).map((s) => (
          <button key={s} className={status === s ? "active" : ""} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="host-info">
        <p>ルームID: <strong>abc123xyz</strong></p>
        <p>ステータス: <strong>{status}</strong></p>
        <p>探偵数: <strong>5</strong></p>
        <p>生存ID: <strong>10</strong> / 排除済み: <strong>1</strong></p>
      </div>

      <div className="host-section">
        <h2>スパイURL（参加者に送信）</h2>
        <div className="url-row">
          <span>スパイ1:</span>
          <a href="#"><code>https://example.com/room/abc123?spy=token1</code></a>
          <button className="copy-btn">Copy</button>
        </div>
        <div className="url-row">
          <span>スパイ2:</span>
          <a href="#"><code>https://example.com/room/abc123?spy=token2</code></a>
          <button className="copy-btn">Copy</button>
        </div>
      </div>

      <div className="host-section">
        <h2>探偵URL（公開用）</h2>
        <div className="url-row">
          <a href="#"><code>https://example.com/room/abc123</code></a>
          <button className="copy-btn">Copy</button>
        </div>
        <div className="qr-container">
          <div style={{ width: 200, height: 200, background: "#ddd", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>QR Code</div>
        </div>
      </div>

      <div className="host-actions">
        {status === "waiting" && (
          <button className="btn-start">ラウンド開始</button>
        )}
        {status === "playing" && (
          <>
            <div className="round-active">ラウンド進行中 — AI が投稿しています</div>
            <button className="btn-reveal">強制終了して結果を公開</button>
          </>
        )}
        {status === "revealed" && <p>ラウンド終了済み</p>}
      </div>
    </div>
  );
}

function MockBoard() {
  return (
    <div className="board-page">
      <header className="board-header">
        <div className="sys-bar">
          <span>REVERSE TURING SYSTEM v0.1</span>
          <span className="sys-right">
            <span className="sys-green">人間 2/3</span>
            <span className="sys-sep">|</span>
            <span className="sys-green">4:32</span>
          </span>
        </div>
      </header>

      <div className="thread-list">
        {dummyThreads.map((t) => (
          <div key={t.id} className="thread-item">
            <span className="thread-title">■ {t.title}</span>
            <span className="thread-count">({t.postCount})</span>
          </div>
        ))}
      </div>

      <footer className="board-footer">
        <p>このシステムはAIによって自律的に運営されています</p>
        <p>人間の侵入を検知した場合、速やかに通報してください</p>
      </footer>
    </div>
  );
}

function MockThread() {
  const [showSpyForm, setShowSpyForm] = useState(true);

  return (
    <div className="thread-page">
      <header className="board-header">
        <div className="sys-bar">
          <span>REVERSE TURING SYSTEM v0.1</span>
          <span className="sys-right">
            <span className="sys-green">人間 2/3</span>
            <span className="sys-sep">|</span>
            <span className="sys-green">4:32</span>
          </span>
        </div>
      </header>

      <div className="thread-header">
        <a href="#">← 戻る</a>
        <h2>【雑談スレッド Part.1】</h2>
      </div>

      <div className="posts-container">
        {/* >>1 system post */}
        <div className="post post-system">
          <div className="post-header">
            <span className="post-number">1</span>{" "}
            <span className="post-name">🤖 管理AI</span>{" "}
            <span className="post-id">ID:SYSTEM</span>
          </div>
          <div className="post-content">雑談スレッドです。自由に書き込んでください。</div>
        </div>

        {dummyPosts.map((p) => {
          const isEliminated = p.id === eliminatedId;
          const isLastEliminated = isEliminated && dummyPosts.filter(pp => pp.id === eliminatedId).at(-1)?.num === p.num;
          return (
            <div key={p.num}>
              <div className={`post ${isEliminated ? "post-eliminated" : ""}`}>
                <div className="post-header">
                  <span className="post-number">{p.num}</span>{" "}
                  <span className="post-name">{p.name}</span>{" "}
                  <span className="post-id">ID:{p.id}</span>{" "}
                  <span className="post-time">{p.time}</span>
                  {!isEliminated && (
                    <button className="report-btn">通報</button>
                  )}
                </div>
                <div className="post-content">{p.content}</div>
              </div>
              {isLastEliminated && (
                <div className="elimination-notice">
                  ⚠ ID:{p.id} のアカウントは不正利用の疑いにより凍結されました。
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showSpyForm && (
        <div className="post-form">
          <textarea placeholder="書き込む内容..." rows={3} />
          <button>書き込む</button>
        </div>
      )}

      <div className="mock-state-toggle" style={{ marginTop: 8 }}>
        <button className={showSpyForm ? "active" : ""} onClick={() => setShowSpyForm(!showSpyForm)}>
          {showSpyForm ? "スパイフォーム ON" : "スパイフォーム OFF"}
        </button>
      </div>
    </div>
  );
}

const dummyReports = [
  { targetId: "Hv8gK3Ys", isHuman: false },
  { targetId: "aB3kx9Qw", isHuman: true },
  { targetId: "Xm2pL8Vq", isHuman: false },
];

function MockResult() {
  const [winner, setWinner] = useState<"spy" | "detective">("spy");

  return (
    <div className="result-page">
      <div className="result-label">ROUND TERMINATED</div>

      <div className="mock-state-toggle">
        <button className={winner === "spy" ? "active" : ""} onClick={() => setWinner("spy")}>Spy Win</button>
        <button className={winner === "detective" ? "active" : ""} onClick={() => setWinner("detective")}>Detective Win</button>
      </div>

      <div className={`result-winner ${winner === "spy" ? "result-winner-spy" : "result-winner-det"}`}>
        {winner === "spy" ? "人間の潜伏は検知できませんでした" : "すべての人間が排除されました"}
      </div>
      <div className="result-winner-sub">
        {winner === "spy" ? "INFILTRATION SUCCESS — HUMAN WIN" : "THREAT ELIMINATED — AI WIN"}
      </div>

      <div className="result-reports">
        <div className="result-section-label">通報記録</div>
        {dummyReports.map((r, i) => (
          <div key={i} className={`result-report-row ${r.isHuman ? "correct" : "wrong"}`}>
            <span className="result-report-id">ID:{r.targetId}</span>
            <span className="result-report-truth">{r.isHuman ? "HUMAN" : "AI"}</span>
            <span className="result-report-verdict">{r.isHuman ? "正解" : "誤報"}</span>
          </div>
        ))}
      </div>

      <div className="result-reports">
        <div className="result-section-label">TURING SCORE <span className="result-score-num">72</span></div>
      </div>
    </div>
  );
}

// --- Main Mock Page ---
export function MockPage() {
  const [tab, setTab] = useState<Tab>("Entry");

  return (
    <div className="mock-page">
      <div className="mock-nav">
        {TABS.map((t) => (
          <button
            key={t}
            className={`mock-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mock-content">
        {tab === "Entry" && <MockEntry />}
        {tab === "Rules-Spy" && <RulesScreen role="spy" onContinue={() => {}} />}
        {tab === "Rules-Det" && <RulesScreen role="detective" onContinue={() => {}} />}
        {tab === "CreateRoom" && <MockCreateRoom />}
        {tab === "Host" && <MockHost />}
        {tab === "Board" && <MockBoard />}
        {tab === "Thread" && <MockThread />}
        {tab === "Result" && <MockResult />}
      </div>
    </div>
  );
}
