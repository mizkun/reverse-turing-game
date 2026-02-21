import { useParams, Link, useNavigate } from "react-router-dom";
import { useRoom } from "../hooks/useRoom";
import { usePosts } from "../hooks/usePosts";
import { usePlayerRole } from "../hooks/usePlayerRole";
import { useAuth } from "../hooks/useAuth";
import { Post as PostComponent } from "../components/Post";
import { StatusBar } from "../components/StatusBar";
import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, callSubmitPost, callReportId } from "../firebase";
import type { Thread } from "../types";

export function ThreadPage() {
  const { roomId, threadId } = useParams<{
    roomId: string;
    threadId: string;
  }>();
  const room = useRoom(roomId!);
  const posts = usePosts(roomId!, threadId);
  const { isSpy, spyToken, spyAuthorId } = usePlayerRole(roomId!);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [thread, setThread] = useState<Thread | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevStatus = useRef(room?.status);

  // Load thread info
  useEffect(() => {
    if (!roomId || !threadId) return;
    const unsub = onSnapshot(
      doc(db, `rooms/${roomId}/threads/${threadId}`),
      (snap) => {
        if (snap.exists()) setThread(snap.data() as Thread);
      }
    );
    return unsub;
  }, [roomId, threadId]);

  // Check if already reported
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

  // Auto-navigate to result only when status transitions to "revealed"
  useEffect(() => {
    if (prevStatus.current === "playing" && room?.status === "revealed") {
      navigate(`/room/${roomId}/result`, { replace: true });
    }
    prevStatus.current = room?.status;
  }, [room?.status, roomId, navigate]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [posts.length]);

  const handleSubmitPost = async () => {
    if (!content.trim() || !roomId || !threadId || submitting) return;
    setSubmitting(true);
    try {
      await callSubmitPost({
        roomId,
        threadId,
        content: content.trim(),
        spyToken,
      });
      setContent("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "投稿に失敗しました";
      alert(message);
    }
    setSubmitting(false);
  };

  const handleReport = (authorId: string) => {
    setReportTarget(authorId);
  };

  const confirmReport = async () => {
    if (!reportTarget) return;
    setReportTarget(null);
    try {
      await callReportId({ roomId, targetId: reportTarget });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "通報に失敗しました";
      alert(message);
    }
  };

  if (!room || !thread)
    return <div className="loading">接続中...</div>;

  const isEliminated =
    spyAuthorId && room.eliminatedIds?.includes(spyAuthorId);

  return (
    <div className="thread-page">
      <div className="thread-sticky-header">
        <header className="board-header">
          <div className="sys-bar">
            <span>REVERSE TURING SYSTEM v0.1</span>
            {room.status === "playing" && <StatusBar room={room} />}
          </div>
        </header>
        <div className="thread-header">
          <Link to={`/room/${roomId}/board`}>← 戻る</Link>
          <h2>【{thread.title}】</h2>
        </div>
      </div>

      <div className="posts-container">
        <div className="post post-system">
          <div className="post-header">
            <span className="post-number">1</span>{" "}
            <span className="post-name">管理AI</span>{" "}
            <span className="post-id">ID:SYSTEM</span>
          </div>
          <div className="post-content">{thread.openingPost}</div>
        </div>

        {posts.map((post) => {
          const eliminated = room.eliminatedIds?.includes(post.authorId);
          return (
            <div key={`${post.threadId}-${post.postNumber}`}>
              <PostComponent
                post={post}
                headerAction={
                  !isSpy && !hasReported && room.status === "playing" && !eliminated ? (
                    <button
                      className="report-btn"
                      onClick={() => handleReport(post.authorId)}
                    >
                      通報
                    </button>
                  ) : undefined
                }
              />
              {eliminated &&
                posts.filter((p) => p.authorId === post.authorId).at(-1)
                  ?.postNumber === post.postNumber && (
                  <div className="elimination-notice">
                    ID:{post.authorId}{" "}
                    のアカウントは不正利用の疑いにより凍結されました。
                  </div>
                )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {isSpy && room.status === "playing" && !isEliminated && (
        <div className="post-form">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="書き込む内容..."
            rows={3}
          />
          <button
            onClick={handleSubmitPost}
            disabled={submitting || !content.trim()}
          >
            {submitting ? "送信中..." : "書き込む"}
          </button>
        </div>
      )}

      {isSpy && isEliminated && (
        <div className="elimination-notice">
          あなたのアカウントは凍結されました。書き込みはできません。
        </div>
      )}

      {reportTarget && (
        <div className="modal-overlay" onClick={() => setReportTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">REPORT CONFIRMATION</div>
            <div className="modal-body">
              <p>対象ID: <span className="hl-red">{reportTarget}</span></p>
              <p>通報は1回のみ実行可能です。</p>
              <p>対象のアカウントは即座に凍結されます。</p>
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={() => setReportTarget(null)}>CANCEL</button>
              <button className="modal-btn modal-btn-confirm" onClick={confirmReport}>EXECUTE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
