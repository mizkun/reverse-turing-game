import { useEffect, useState } from "react";
import type { Room } from "../types";

interface Props {
  room: Room;
}

export function StatusBar({ room }: Props) {
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

  const spySlots = room.settings?.spySlots ?? 0;
  const eliminatedSpies = (room.eliminatedIds ?? []).length;
  const survivingSpies = Math.max(0, spySlots - eliminatedSpies);

  return (
    <span className="sys-right">
      <span className="sys-green">人間 {survivingSpies}/{spySlots}</span>
      <span className="sys-sep">|</span>
      <span className="sys-green">{timeLeft || "--:--"}</span>
    </span>
  );
}
