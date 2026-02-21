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
          orderBy("createdAt", "desc")
        )
      : query(postsRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ ...d.data() } as Post));
      setPosts(data.reverse()); // reverse to show oldest first
    });
    return unsub;
  }, [roomId, threadId]);

  return posts;
}
