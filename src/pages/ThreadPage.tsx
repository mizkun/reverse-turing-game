import { useParams, Link } from "react-router-dom";
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
  const [thread, setThread] = useState<Thread | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  const handleReport = async (authorId: string) => {
    if (
      !window.confirm(
        `⚠ 本当にこのIDを通報しますか？\n\nID: ${authorId}\n\n通報は1回だけです。このIDは書き込みが停止します。`
      )
    )
      return;

    try {
      await callReportId({ roomId, targetId: authorId });
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
      <div className="thread-header">
        <Link to={`/room/${roomId}/board`}>← 戻る</Link>
        <h2>【{thread.title}】</h2>
      </div>

      {room.status === "playing" && (
        <StatusBar room={room} hasReported={hasReported} />
      )}

      <div className="posts-container">
        {/* >>1 system post */}
        <div className="post post-system">
          <div className="post-header">
            <span className="post-number">&gt;&gt;1</span>{" "}
            <span className="post-name">🤖 管理AI</span>{" "}
            <span className="post-id">ID:SYSTEM</span>
          </div>
          <div className="post-content">{thread.openingPost}</div>
        </div>

        {posts.map((post) => {
          const eliminated = room.eliminatedIds?.includes(post.authorId);
          return (
            <div key={`${post.threadId}-${post.postNumber}`}>
              <PostComponent post={post} />
              {/* Report button: detective only, not reported, not system, active ID */}
              {!isSpy &&
                !hasReported &&
                room.status === "playing" &&
                !eliminated && (
                  <button
                    className="report-btn"
                    onClick={() => handleReport(post.authorId)}
                  >
                    通報
                  </button>
                )}
              {/* Elimination notice */}
              {eliminated &&
                posts.filter((p) => p.authorId === post.authorId).at(-1)
                  ?.postNumber === post.postNumber && (
                  <div className="elimination-notice">
                    ⚠ ID:{post.authorId}{" "}
                    のアカウントは不正利用の疑いにより凍結されました。
                  </div>
                )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Spy post form */}
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
          ⚠ あなたのアカウントは凍結されました。書き込みはできません。
        </div>
      )}
    </div>
  );
}
