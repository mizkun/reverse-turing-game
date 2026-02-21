import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase-admin/firestore
const mockGet = vi.fn();
const mockDocGet = vi.fn();
const mockCollectionGet = vi.fn();

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: () => ({ get: mockCollectionGet }),
    doc: () => ({ get: mockDocGet }),
  }),
}));

vi.mock("firebase-admin/app", () => ({
  initializeApp: vi.fn(),
}));

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

describe("verifyHost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hostToken がない場合エラーを投げる", async () => {
    const { verifyHost } = await import("../verifyHost");
    const handler = verifyHost as unknown as (req: { data: Record<string, unknown> }) => Promise<unknown>;

    await expect(handler({ data: {} })).rejects.toThrow(
      "hostToken is required"
    );
  });

  it("有効な hostToken でルーム情報を返す", async () => {
    const roomData = { status: "waiting", settings: { spySlots: 2, roundMinutes: 7 } };
    mockCollectionGet.mockResolvedValue({
      docs: [{ id: "room123", data: () => roomData }],
    });
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({ hostToken: "valid-token" }),
    });

    const { verifyHost } = await import("../verifyHost");
    const handler = verifyHost as unknown as (req: { data: Record<string, unknown> }) => Promise<unknown>;

    const result = await handler({ data: { hostToken: "valid-token" } });
    const res = result as Record<string, unknown>;
    expect(res.roomId).toBe("room123");
    expect(res.room).toEqual(roomData);
  });

  it("無効な hostToken でエラーを投げる", async () => {
    mockCollectionGet.mockResolvedValue({
      docs: [{ id: "room123", data: () => ({}) }],
    });
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({ hostToken: "different-token" }),
    });

    const { verifyHost } = await import("../verifyHost");
    const handler = verifyHost as unknown as (req: { data: Record<string, unknown> }) => Promise<unknown>;

    await expect(
      handler({ data: { hostToken: "invalid-token" } })
    ).rejects.toThrow("無効なホストトークンです");
  });
});
