import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { callJoinAsDetective, callVerifySpyToken } from "../firebase";
import { useAuth } from "../hooks/useAuth";

export function EntryPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "spy" | "detective"
  >("idle");

  const spyTokenParam = searchParams.get("spy");

  const handleCheck = async () => {
    if (!roomId || !user || checked) return;
    setChecked(true);
    setStatus("loading");

    try {
      if (spyTokenParam) {
        // Spy path
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
        // Detective path
        await callJoinAsDetective({ roomId });
        setStatus("detective");
      }

      setTimeout(() => {
        navigate(`/room/${roomId}/board`);
      }, 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "エラーが発生しました";
      alert(message);
      setChecked(false);
      setStatus("idle");
    }
  };

  if (authLoading) return null;

  return (
    <div className="entry-page">
      <div className="recaptcha-container">
        {status === "idle" && (
          <div className="recaptcha-box" onClick={handleCheck}>
            <span className="recaptcha-check">☐</span>
            <span className="recaptcha-label">私はAIです</span>
          </div>
        )}

        {status === "loading" && (
          <div className="recaptcha-box checked">
            <span className="recaptcha-check">✓</span>
            <span className="recaptcha-label">認証中...</span>
          </div>
        )}

        {status === "spy" && (
          <div className="entry-result spy">
            <p>潜入に成功しました。</p>
            <p className="entry-sub">
              あなたはスパイです。AIのフリをして生き残ってください。
            </p>
          </div>
        )}

        {status === "detective" && (
          <div className="entry-result detective">
            <p>あなたは人間であることが確認されました。</p>
            <p className="entry-sub">
              観察モードで入場します。人間を見つけて通報してください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
