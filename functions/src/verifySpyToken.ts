import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { generateId } from "./utils";

const db = getFirestore();

export const verifySpyToken = onCall(
  { region: "asia-northeast1", minInstances: 1 },
  async (request) => {
    const { roomId, token } = request.data as {
      roomId: string;
      token: string;
    };

    const tokensSnap = await db
      .collection(`rooms/${roomId}/spyTokens`)
      .get();
    let matchedDoc = null;
    for (const d of tokensSnap.docs) {
      if (d.data().token === token) {
        matchedDoc = d;
        break;
      }
    }
    if (!matchedDoc)
      throw new HttpsError("not-found", "無効なスパイトークン");

    const tokenData = matchedDoc.data();

    // Reconnection: return existing authorId
    if (tokenData.used) {
      return { success: true, authorId: tokenData.assignedAuthorId };
    }

    // New spy: assign authorId
    const authorId = generateId(8);
    const roomRef = db.doc(`rooms/${roomId}`);
    const batch = db.batch();
    batch.update(matchedDoc.ref, { used: true, assignedAuthorId: authorId });
    batch.update(roomRef, { activeIds: FieldValue.arrayUnion(authorId) });
    batch.update(db.doc(`rooms/${roomId}/secret/gameState`), {
      spyAuthorIds: FieldValue.arrayUnion(authorId),
    });
    await batch.commit();

    return { success: true, authorId };
  }
);
