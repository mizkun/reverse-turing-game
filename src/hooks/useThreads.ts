import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import type { Thread } from "../types";

export function useThreads(roomId: string) {
  const [threads, setThreads] = useState<(Thread & { id: string })[]>([]);

  useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, `rooms/${roomId}/threads`),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setThreads(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Thread) }))
      );
    });
    return unsub;
  }, [roomId]);

  return threads;
}
