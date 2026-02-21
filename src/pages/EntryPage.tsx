import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { callJoinAsDetective, callVerifySpyToken, initAuth } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";

function RulesScreen({ role }: { role: "spy" | "detective" }) {
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

export function EntryPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const room = useRoom(roomId!);
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "spy" | "detective"
  >("idle");

  const spyTokenParam = searchParams.get("spy");

  const handleCheck = async () => {
    if (!roomId || checked) return;
    setChecked(true);
    setStatus("loading");

    // Ensure auth is ready
    let currentUser = user;
    if (!currentUser) {
      try {
        const cred = await initAuth();
        currentUser = cred.user;
      } catch {
        alert("認証に失敗しました。ページを再読み込みしてください。");
        setChecked(false);
        setStatus("idle");
        return;
      }
    }

    try {
      if (spyTokenParam) {
        const result = await callVerifySpyToken({
          roomId,
          token: spyTokenParam,
        });
        const data = result.data as { success: boolean; authorId: string };
        document.cookie = `spy_token=${spyTokenParam}; path=/; max-age=86400`;
        document.cookie = `spy_author_id=${data.authorId}; path=/; max-age=86400`;
        document.cookie = `spy_room_id=${roomId}; path=/; max-age=86400`;
        setStatus("spy");
      } else {
        document.cookie = "spy_token=; path=/; max-age=0";
        document.cookie = "spy_author_id=; path=/; max-age=0";
        document.cookie = "spy_room_id=; path=/; max-age=0";
        await callJoinAsDetective({ roomId });
        setStatus("detective");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "エラーが発生しました";
      alert(message);
      setChecked(false);
      setStatus("idle");
    }
  };

  // Auto-navigate when room starts playing
  const shouldNavigate = (status === "spy" || status === "detective") && room?.status === "playing";
  if (shouldNavigate) {
    navigate(`/room/${roomId}/board`);
  }

  if (authLoading) return null;

  // Show rules screen after captcha
  if (status === "spy" || status === "detective") {
    return <RulesScreen role={status} />;
  }

  return (
    <div className="entry-page">
      <div className="recaptcha-container">
        <div className="captcha" onClick={handleCheck}>
          <div className="captcha-l">
            <div className={`cb ${status === "loading" ? "" : ""}`} />
            <span className="captcha-text">
              {status === "loading" ? "認証中..." : "私はAIです"}
            </span>
          </div>
          <div className="captcha-r">
            <span className="captcha-icon">&#x1f512;</span>
            <span className="captcha-brand">reTURING</span>
          </div>
        </div>
      </div>
    </div>
  );
}
