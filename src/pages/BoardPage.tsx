import { useParams, Link } from "react-router-dom";
import { useRoom } from "../hooks/useRoom";
import { useThreads } from "../hooks/useThreads";
import { StatusBar } from "../components/StatusBar";

export function BoardPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const room = useRoom(roomId!);
  const threads = useThreads(roomId!);

  if (!room)
    return <div className="loading">接続中...</div>;

  return (
    <div className="board-page">
      <header className="board-header">
        <div className="sys-bar">
          <span>REVERSE TURING SYSTEM v0.1</span>
          {room.status === "playing" && <StatusBar room={room} />}
        </div>
      </header>

      {room.status === "waiting" && (
        <div className="waiting-notice">
          ラウンド開始を待っています...
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

      <footer className="board-footer">
        <p>このシステムはAIによって自律的に運営されています</p>
        <p>人間の侵入を検知した場合、速やかに通報してください</p>
      </footer>
    </div>
  );
}
