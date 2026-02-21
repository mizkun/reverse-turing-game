import { describe, it, expect, vi } from "vitest";

// Mock GoogleGenerativeAI
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => "テストの返信です" },
      }),
    }),
  })),
}));

import { generatePost } from "../aiEngine";

describe("aiEngine - generatePost", () => {
  it("ペルソナのsystemPromptとスレッドコンテキストで投稿を生成する", async () => {
    const result = await generatePost(
      "fake-api-key",
      "あなたは大学生です。",
      "雑談スレ",
      [{ postNumber: 1, authorId: "abc123", content: "こんにちは" }]
    );
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("投稿がない場合でも生成できる", async () => {
    const result = await generatePost(
      "fake-api-key",
      "あなたはエンジニアです。",
      "今日の飯スレ",
      []
    );
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
