import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import type { Post } from "../types";

export function usePosts(roomId: string, threadId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!roomId) return;

    const postsRef = collection(db, `rooms/${roomId}/posts`);
    const q = threadId
      ? query(
          postsRef,
          where("threadId", "==", threadId),
          orderBy("createdAt", "asc")
        )
      : query(postsRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ ...d.data() } as Post));
      setPosts(data);
    });
    return unsub;
  }, [roomId, threadId]);

  return posts;
}
