import { useParams, Link } from "react-router-dom";
import { useRoom } from "../hooks/useRoom";
import { useThreads } from "../hooks/useThreads";
import { usePlayerRole } from "../hooks/usePlayerRole";
import { StatusBar } from "../components/StatusBar";
import { useAuth } from "../hooks/useAuth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";

export function BoardPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const room = useRoom(roomId!);
  const threads = useThreads(roomId!);
  const { isSpy } = usePlayerRole(roomId!);
  const { user } = useAuth();
  const [hasReported, setHasReported] = useState(false);

  useEffect(() => {
    if (!user || !roomId) return;
    const unsub = onSnapshot(
      doc(db, `rooms/${roomId}/reports/${user.uid}`),
      (snap) => {
        setHasReported(snap.exists());
      }
    );
    return unsub;
  }, [user, roomId]);

  if (!room)
    return <div className="loading">接続中...</div>;

  return (
    <div className="board-page">
      <header className="board-header">
        <h1>Reverse Turing</h1>
        <p className="flavor-text">
          このシステムはAIによって自律的に運営されています
        </p>
      </header>

      {room.status === "playing" && (
        <StatusBar room={room} hasReported={hasReported} />
      )}

      {room.status === "waiting" && (
        <div className="waiting-notice">
          ⏳ ラウンド開始を待っています...（探偵: {room.detectiveCount}人）
        </div>
      )}

      <div className="thread-list">
        {threads.map((t) => (
          <Link
            key={t.id}
            to={`/room/${roomId}/board/${t.id}`}
            className="thread-item"
          >
            <span className="thread-title">■ {t.title}</span>
            <span className="thread-count">({t.postCount})</span>
          </Link>
        ))}
      </div>

      {isSpy && (
        <div className="spy-notice">
          🕵️ あなたはスパイです。AIのフリをして書き込んでください。
        </div>
      )}

      <footer className="board-footer">
        <p>人間の侵入を検知した場合、速やかに通報してください</p>
      </footer>
    </div>
  );
}
