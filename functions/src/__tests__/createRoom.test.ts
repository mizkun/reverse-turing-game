import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase-admin/firestore
const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
const mockDoc = vi.fn().mockReturnValue({ path: "rooms/testId" });
const mockBatch = vi.fn().mockReturnValue({
  set: mockBatchSet,
  commit: mockBatchCommit,
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    doc: mockDoc,
    batch: mockBatch,
  }),
  FieldValue: {
    serverTimestamp: () => "SERVER_TIMESTAMP",
  },
}));

vi.mock("firebase-admin/app", () => ({
  initializeApp: vi.fn(),
}));

// Mock firebase-functions
vi.mock("firebase-functions/v2/https", () => ({
  onCall: (_opts: unknown, handler: (req: unknown) => Promise<unknown>) => handler,
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

// Mock crypto to return deterministic values
vi.mock("crypto", () => ({
  randomBytes: (len: number) => Buffer.alloc(len, 1),
  randomUUID: () => "test-host-uuid",
}));

describe("createRoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("デフォルト設定でルームを作成できる", async () => {
    const { createRoom } = await import("../createRoom");
    const handler = createRoom as unknown as (req: { data: Record<string, unknown> }) => Promise<unknown>;

    const result = await handler({ data: {} });

    // batch.set が呼ばれていること（room, hostSecret, gameState, spyTokens x2, threads x3）
    // = 1 + 1 + 1 + 2 + 3 = 8 calls
    expect(mockBatchSet).toHaveBeenCalledTimes(8);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);

    // 結果に必要なフィールドがある
    const res = result as Record<string, unknown>;
    expect(res).toHaveProperty("roomId");
    expect(res).toHaveProperty("hostUrl");
    expect(res).toHaveProperty("detectiveUrl");
    expect(res).toHaveProperty("spyUrls");
    expect((res.spyUrls as string[]).length).toBe(2); // default spySlots=2
  });

  it("spySlots=3 でスパイトークンが3つ作られる", async () => {
    const { createRoom } = await import("../createRoom");
    const handler = createRoom as unknown as (req: { data: Record<string, unknown> }) => Promise<unknown>;

    const result = await handler({ data: { spySlots: 3, roundMinutes: 10 } });

    const res = result as Record<string, unknown>;
    expect((res.spyUrls as string[]).length).toBe(3);
  });

  it("spySlots が範囲外なら HttpsError を投げる", async () => {
    const { createRoom } = await import("../createRoom");
    const handler = createRoom as unknown as (req: { data: Record<string, unknown> }) => Promise<unknown>;

    await expect(handler({ data: { spySlots: 0 } })).rejects.toThrow(
      "spySlots must be 1-5"
    );
    await expect(handler({ data: { spySlots: 6 } })).rejects.toThrow(
      "spySlots must be 1-5"
    );
  });

  it("ルームデータに正しい初期値が設定される", async () => {
    const { createRoom } = await import("../createRoom");
    const handler = createRoom as unknown as (req: { data: Record<string, unknown> }) => Promise<unknown>;

    await handler({ data: { spySlots: 1, roundMinutes: 5 } });

    // 最初の batch.set がルームの作成
    const roomSetCall = mockBatchSet.mock.calls[0];
    const roomData = roomSetCall[1];
    expect(roomData.status).toBe("waiting");
    expect(roomData.settings).toEqual({ spySlots: 1, roundMinutes: 5 });
    expect(roomData.detectiveCount).toBe(0);
    expect(roomData.activeIds).toEqual([]);
    expect(roomData.eliminatedIds).toEqual([]);
    expect(roomData.result).toBeNull();
  });
});
