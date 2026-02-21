import { useState } from "react";
import { Link } from "react-router-dom";
import { callCreateRoom } from "../firebase";
import { useAuth } from "../hooks/useAuth";

interface CreateResult {
  roomId: string;
  hostUrl: string;
  detectiveUrl: string;
  spyUrls: string[];
}

function CopyRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="url-row">
      <span>{label}</span>
      <a href={url} target="_blank" rel="noopener noreferrer"><code>{url}</code></a>
      <button className="copy-btn" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

export function CreateRoomPage() {
  const { user, loading } = useAuth();
  const [spySlots, setSpySlots] = useState(2);
  const [roundMinutes, setRoundMinutes] = useState(7);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<CreateResult | null>(null);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await callCreateRoom({ spySlots, roundMinutes });
      const data = res.data as Record<string, unknown>;
      const resolved = (data.result ?? data.data ?? data) as CreateResult;
      setResult(resolved);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "ルーム作成に失敗しました");
    }
    setCreating(false);
  };

  const origin = window.location.origin;

  if (loading) return <div className="loading">接続中...</div>;

  if (result) {
    const spyUrls = result.spyUrls || [];
    return (
      <div className="create-room-page">
        <h1>ルーム作成完了</h1>
        <div className="create-result">
          <p>ルームID: <strong>{result.roomId}</strong>
            <button className="copy-btn" onClick={() => navigator.clipboard.writeText(result.roomId)}>Copy</button>
          </p>

          <h2>スパイURL（参加者に送信）</h2>
          {spyUrls.map((url, i) => (
            <CopyRow key={i} label={`スパイ${i + 1}:`} url={`${origin}${url}`} />
          ))}

          <h2>探偵URL（公開用）</h2>
          <CopyRow label="" url={`${origin}${result.detectiveUrl}`} />

          <Link to={result.hostUrl} className="create-btn" style={{ display: "block", textAlign: "center", marginTop: 20, textDecoration: "none" }}>
            ホスト管理画面へ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="create-room-page">
      <h1>ルームを作成</h1>
      <p className="create-room-desc">
        掲示板を開設して、スパイと探偵のゲームを始めましょう。
      </p>

      <div className="create-room-form">
        <div className="form-group">
          <label>スパイ枠</label>
          <div className="form-options">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`option-btn ${spySlots === n ? "active" : ""}`}
                onClick={() => setSpySlots(n)}
              >
                {n}人
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>ラウンド時間</label>
          <div className="form-options">
            {[3, 5, 7, 10, 15].map((n) => (
              <button
                key={n}
                className={`option-btn ${roundMinutes === n ? "active" : ""}`}
                onClick={() => setRoundMinutes(n)}
              >
                {n}分
              </button>
            ))}
          </div>
        </div>

        <button
          className="create-btn"
          onClick={handleCreate}
          disabled={creating || !user}
        >
          {creating ? "作成中..." : "ルームを作成する"}
        </button>
      </div>
    </div>
  );
}
