import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  callVerifyHost,
  callStartRound,
  callRevealResults,
  callTickAiPosts,
} from "../firebase";
import { useRoom } from "../hooks/useRoom";
import { QRCodeSVG } from "qrcode.react";

export function HostPage() {
  const { hostToken } = useParams<{ hostToken: string }>();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [spyUrls, setSpyUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hostToken) return;
    callVerifyHost({ hostToken })
      .then((result) => {
        const data = result.data as { roomId: string; room: { settings: { spySlots: number } } };
        setRoomId(data.roomId);
        // Reconstruct spy URLs (tokens not available here, shown at creation)
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "ホスト認証に失敗しました");
        setLoading(false);
      });
  }, [hostToken]);

  const room = useRoom(roomId || "");

  // Tick AI posts every 10 seconds while playing
  useEffect(() => {
    if (!roomId || !room || room.status !== "playing") return;
    const interval = setInterval(() => {
      callTickAiPosts({ roomId }).catch(() => {});
    }, 10000);
    // Fire immediately on start
    callTickAiPosts({ roomId }).catch(() => {});
    return () => clearInterval(interval);
  }, [roomId, room?.status]);

  const handleStart = async () => {
    if (!roomId || !hostToken) return;
    try {
      await callStartRound({ roomId, hostToken });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "開始に失敗しました");
    }
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

  if (loading) return <div className="loading">認証中...</div>;
  if (error)
    return <div className="error">エラー: {error}</div>;
  if (!room || !roomId)
    return <div className="loading">ルーム読み込み中...</div>;

  const detectiveUrl = `${window.location.origin}/room/${roomId}`;

  return (
    <div className="host-page">
      <h1>🎮 ホスト管理</h1>

      <div className="host-info">
        <p>
          ルームID: <strong>{roomId}</strong>
        </p>
        <p>
          ステータス: <strong>{room.status}</strong>
        </p>
        <p>
          探偵数: <strong>{room.detectiveCount}</strong>
        </p>
        <p>
          生存ID: <strong>{room.activeIds?.length ?? 0}</strong> / 排除済み:{" "}
          <strong>{room.eliminatedIds?.length ?? 0}</strong>
        </p>
      </div>

      <div className="host-section">
        <h2>探偵参加URL</h2>
        <p className="url-display">{detectiveUrl}</p>
        <div className="qr-container">
          <QRCodeSVG value={detectiveUrl} size={200} />
        </div>
      </div>

      <div className="host-actions">
        {room.status === "waiting" && (
          <button className="btn-start" onClick={handleStart}>
            🚀 ラウンド開始
          </button>
        )}

        {room.status === "playing" && (
          <button className="btn-reveal" onClick={handleReveal}>
            🏁 ラウンド終了（結果公開）
          </button>
        )}

        {room.status === "revealed" && (
          <p>✅ ラウンド終了済み</p>
        )}
      </div>
    </div>
  );
}
