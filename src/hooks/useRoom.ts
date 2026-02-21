import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import type { Room } from "../types";

export function useRoom(roomId: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, "rooms", roomId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Room;
      setRoom(data);
      if (data?.status === "revealed") {
        navigate(`/room/${roomId}/result`);
      }
    });
    return unsub;
  }, [roomId, navigate]);

  return room;
}
