import { useParams } from "react-router-dom";
import { useRoom } from "../hooks/useRoom";

export function ResultPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const room = useRoom(roomId!);

  if (!room)
    return <div className="loading">読み込み中...</div>;

  if (room.status !== "revealed")
    return <div className="loading">結果集計中...</div>;

  const result = room.result;

  return (
    <div className="result-page">
      <h1>── ラウンド結果 ──</h1>

      {result && (
        <>
          <div className="result-winner">
            {result.winner === "spy" ? (
              <p>🏆 スパイチームの勝利！</p>
            ) : (
              <p>🏆 探偵チームの勝利！</p>
            )}
          </div>

          <div className="result-stats">
            <p>
              チューリングスコア: <strong>{result.turingScore}</strong>
            </p>
            <p className="score-desc">
              {result.turingScore >= 70
                ? "人間はAIに溶け込んでいます"
                : result.turingScore >= 40
                  ? "人間とAIの境界は曖昧です"
                  : "探偵の目は鋭い"}
            </p>
          </div>
        </>
      )}

      <div className="result-info">
        <p>
          生存ID: {room.activeIds?.length ?? 0} / 排除済み:{" "}
          {room.eliminatedIds?.length ?? 0}
        </p>
      </div>
    </div>
  );
}
