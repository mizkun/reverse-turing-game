import { useEffect, useState } from "react";
import type { Room } from "../types";

interface Props {
  room: Room;
  hasReported: boolean;
}

export function StatusBar({ room, hasReported }: Props) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!room.roundEndsAt) return;

    const update = () => {
      const raw = room.roundEndsAt!;
      const end =
        typeof (raw as any).toDate === "function"
          ? (raw as any).toDate().getTime()
          : new Date(raw as unknown as string).getTime();
      const diff = Math.max(0, end - Date.now());
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${min}:${sec.toString().padStart(2, "0")}`);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [room.roundEndsAt]);

  const active = room.activeIds?.length ?? 0;
  const eliminated = room.eliminatedIds?.length ?? 0;

  return (
    <div className="status-bar">
      <span>
        生存ID: {active}/{active + eliminated}
      </span>
      <span>排除済み: {eliminated}</span>
      <span>{hasReported ? "🔫 通報済み" : "🔫 残り弾: 1"}</span>
      <span>⏱ {timeLeft || "--:--"}</span>
    </div>
  );
}
