import { useEffect, useState } from "react";
import {
  callCreateRoom,
  callStartRound,
  callRevealResults,
  callTickAiPosts,
} from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import { QRCodeSVG } from "qrcode.react";

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
      <a href={url} target="_blank" rel="noopener noreferrer">
        <code>{url}</code>
      </a>
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

  const roomId = result?.roomId || "";
  const hostToken = result?.hostUrl?.replace("/host/", "") || "";
  const room = useRoom(roomId);

  // Tick AI posts every 10 seconds while playing
  useEffect(() => {
    if (!roomId || !room || room.status !== "playing") return;
    const interval = setInterval(() => {
      callTickAiPosts({ roomId }).catch(() => {});
    }, 30000);
    callTickAiPosts({ roomId }).catch(() => {});
    return () => clearInterval(interval);
  }, [roomId, room?.status]);

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

  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    if (!roomId || !hostToken) return;
    setStarting(true);
    try {
      await callStartRound({ roomId, hostToken });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "開始に失敗しました");
    }
    setStarting(false);
  };

  const handleReveal = async () => {
    if (!roomId || !hostToken) return;
    if (!window.confirm("ラウンドを終了して結果を公開しますか？")) return;
    try {
      await callRevealResults({ roomId, hostToken });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "終了に失敗しました");
    }
  };

  const origin = window.location.origin;

  if (loading) return <div className="loading">接続中...</div>;

  if (result) {
    const spyUrls = result.spyUrls || [];
    const detectiveUrl = `${origin}/room/${roomId}`;

    return (
      <div className="host-page">
        <h1>ホスト管理</h1>

        <div className="host-info">
          <p>
            ルームID: <strong>{roomId}</strong>
            <button
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(roomId)}
            >
              Copy
            </button>
          </p>
          <p>
            ステータス: <strong>{room?.status ?? "読込中..."}</strong>
          </p>
          <p>
            探偵数: <strong>{room?.detectiveCount ?? 0}</strong>
          </p>
          <p>
            生存ID: <strong>{room?.activeIds?.length ?? 0}</strong> / 排除済み:{" "}
            <strong>{room?.eliminatedIds?.length ?? 0}</strong>
          </p>
        </div>

        <div className="host-section">
          <h2>スパイURL（参加者に送信）</h2>
          {spyUrls.map((url, i) => (
            <CopyRow key={i} label={`スパイ${i + 1}:`} url={`${origin}${url}`} />
          ))}
        </div>

        <div className="host-section">
          <h2>探偵URL（公開用）</h2>
          <CopyRow label="" url={detectiveUrl} />
          <div className="qr-container">
            <QRCodeSVG value={detectiveUrl} size={200} />
          </div>
        </div>

        <div className="host-actions">
          {(!room || room.status === "waiting") && (
            <button className="btn-start" onClick={handleStart} disabled={starting}>
              {starting ? "ペルソナ生成中..." : "ラウンド開始"}
            </button>
          )}

          {room?.status === "playing" && (
            <>
              <div className="round-active">
                ラウンド進行中 — AI が投稿しています
              </div>
              <button className="btn-reveal" onClick={handleReveal}>
                強制終了して結果を公開
              </button>
            </>
          )}

          {room?.status === "revealed" && <p>ラウンド終了済み</p>}
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
