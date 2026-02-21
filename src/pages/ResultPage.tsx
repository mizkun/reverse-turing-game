import { useParams } from "react-router-dom";
import { useRoom } from "../hooks/useRoom";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface ReportEntry {
  targetId: string;
  isCorrect: boolean | null;
}

export function ResultPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const room = useRoom(roomId!);
  const [reports, setReports] = useState<ReportEntry[]>([]);

  // Listen to reports in real-time so isCorrect updates are captured
  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(
      collection(db, `rooms/${roomId}/reports`),
      (snap) => {
        setReports(
          snap.docs.map((d) => ({
            targetId: d.data().targetId,
            isCorrect: d.data().isCorrect ?? null,
          }))
        );
      }
    );
    return unsub;
  }, [roomId]);

  if (!room)
    return <div className="loading">読み込み中...</div>;

  if (room.status !== "revealed")
    return <div className="loading">結果集計中...</div>;

  const result = room.result;

  return (
    <div className="result-page">
      <div className="result-label">ROUND TERMINATED</div>

      {result && (
        <>
          <div className={`result-winner ${result.winner === "spy" ? "result-winner-spy" : "result-winner-det"}`}>
            {result.winner === "spy"
              ? "人間の潜伏は検知できませんでした"
              : "すべての人間が排除されました"}
          </div>
          <div className="result-winner-sub">
            {result.winner === "spy"
              ? "INFILTRATION SUCCESS — HUMAN WIN"
              : "THREAT ELIMINATED — AI WIN"}
          </div>
        </>
      )}

      {reports.length > 0 && (
        <div className="result-reports">
          <div className="result-section-label">通報記録</div>
          {reports.map((r, i) => (
            <div key={i} className={`result-report-row ${r.isCorrect === true ? "correct" : r.isCorrect === false ? "wrong" : ""}`}>
              <span className="result-report-id">ID:{r.targetId}</span>
              <span className="result-report-truth">
                {r.isCorrect === true ? "HUMAN" : r.isCorrect === false ? "AI" : "---"}
              </span>
              <span className="result-report-verdict">
                {r.isCorrect === true ? "正解" : r.isCorrect === false ? "誤報" : "判定中"}
              </span>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="result-reports">
          <div className="result-section-label">TURING SCORE <span className="result-score-num">{result.turingScore}</span></div>
        </div>
      )}

    </div>
  );
}
