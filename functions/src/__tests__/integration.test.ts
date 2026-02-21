/**
 * Firebase Emulator 統合テスト (Issue #2)
 *
 * firebase emulators:exec で実行:
 *   firebase emulators:exec --only functions,firestore,auth "cd functions && npx vitest run src/__tests__/integration.test.ts"
 */
import { describe, it, expect, beforeAll } from "vitest";
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  collection,
  getDocs,
  type Firestore,
} from "firebase/firestore";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
  type Functions,
} from "firebase/functions";
import {
  getAuth,
  connectAuthEmulator,
  signInAnonymously,
  type Auth,
} from "firebase/auth";

let app: FirebaseApp;
let db: Firestore;
let functions: Functions;
let auth: Auth;

beforeAll(async () => {
  app = initializeApp({
    projectId: "reverse-turing-game",
    apiKey: "fake-api-key-for-emulator",
  });
  db = getFirestore(app);
  functions = getFunctions(app, "asia-northeast1");
  auth = getAuth(app);

  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", {
    disableWarnings: true,
  });

  await signInAnonymously(auth);
}, 15000);

describe("Issue #2: ルーム + 掲示板 統合テスト", () => {
  let roomId: string;
  let hostToken: string;
  let spyUrls: string[];

  it("createRoom: ルームを作成できる", async () => {
    const createRoom = httpsCallable(functions, "createRoom");
    const result = await createRoom({ spySlots: 2, roundMinutes: 5 });
    const data = result.data as {
      roomId: string;
      hostUrl: string;
      detectiveUrl: string;
      spyUrls: string[];
    };

    expect(data.roomId).toBeTruthy();
    expect(data.hostUrl).toContain("/host/");
    expect(data.detectiveUrl).toContain(`/room/${data.roomId}`);
    expect(data.spyUrls).toHaveLength(2);

    roomId = data.roomId;
    hostToken = data.hostUrl.replace("/host/", "");
    spyUrls = data.spyUrls;

    // Firestore にルームが作成されていることを確認
    const roomSnap = await getDoc(doc(db, "rooms", roomId));
    expect(roomSnap.exists()).toBe(true);
    const room = roomSnap.data();
    expect(room?.status).toBe("waiting");
    expect(room?.settings.spySlots).toBe(2);
    expect(room?.settings.roundMinutes).toBe(5);
    expect(room?.detectiveCount).toBe(0);
  }, 15000);

  it("createRoom: スレッドが3つ作成されている", async () => {
    const threadsSnap = await getDocs(
      collection(db, `rooms/${roomId}/threads`)
    );
    expect(threadsSnap.size).toBe(3);

    const titles = threadsSnap.docs.map((d) => d.data().title);
    expect(titles).toContain("雑談スレ");
    expect(titles).toContain("今日の飯スレ");
    expect(titles).toContain("最近見たもの");
  });

  it("verifyHost: 有効な hostToken でルーム情報を取得できる", async () => {
    const verifyHost = httpsCallable(functions, "verifyHost");
    const result = await verifyHost({ hostToken });
    const data = result.data as {
      roomId: string;
      room: Record<string, unknown>;
    };

    expect(data.roomId).toBe(roomId);
    expect(data.room).toBeTruthy();
  }, 10000);

  it("verifyHost: 無効な hostToken でエラーになる", async () => {
    const verifyHost = httpsCallable(functions, "verifyHost");
    await expect(verifyHost({ hostToken: "invalid" })).rejects.toThrow();
  }, 10000);

  it(
    "joinAsDetective: 探偵として参加できる",
    async () => {
      const joinAsDetective = httpsCallable(functions, "joinAsDetective");
      const result = await joinAsDetective({ roomId });
      const data = result.data as { success: boolean };

      expect(data.success).toBe(true);

      // detectiveCount が増えている
      const roomSnap = await getDoc(doc(db, "rooms", roomId));
      const room = roomSnap.data();
      expect(room?.detectiveCount).toBeGreaterThanOrEqual(1);
    },
    30000
  );

  it(
    "startRound: ラウンドを開始できる",
    async () => {
      const startRound = httpsCallable(functions, "startRound");
      const result = await startRound({ roomId, hostToken });
      const data = result.data as { success: boolean; roundEndsAt: string };

      expect(data.success).toBe(true);
      expect(data.roundEndsAt).toBeTruthy();

      // ステータスが playing になっている
      const roomSnap = await getDoc(doc(db, "rooms", roomId));
      const room = roomSnap.data();
      expect(room?.status).toBe("playing");
      expect(room?.roundStartedAt).toBeTruthy();
      expect(room?.roundEndsAt).toBeTruthy();
    },
    30000
  );

  it(
    "startRound: playing 中に再度開始するとエラー",
    async () => {
      const startRound = httpsCallable(functions, "startRound");
      await expect(startRound({ roomId, hostToken })).rejects.toThrow();
    },
    15000
  );

  it("startRound 後に activeIds にペルソナIDが追加されている", async () => {
    // personas コレクションはセキュリティルールでクライアント読み取り不可
    // ルームの activeIds で間接的に確認する
    const roomSnap = await getDoc(doc(db, "rooms", roomId));
    const room = roomSnap.data();
    const activeIds: string[] = room?.activeIds || [];

    // startRound により最低3体のペルソナが追加されているはず
    // + joinAsDetective で1体追加されている
    expect(activeIds.length).toBeGreaterThanOrEqual(3);
  });
});
