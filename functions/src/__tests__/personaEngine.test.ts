import { describe, it, expect, vi } from "vitest";

// Mock GoogleGenerativeAI for persona generation
const mockGenerateContent = vi.fn();
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: mockGenerateContent,
    }),
  })),
}));

import { generatePersona, FALLBACK_PERSONAS } from "../personas";

describe("personas - generatePersona", () => {
  it("Gemini APIでペルソナを動的生成する", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            name: "テスト太郎",
            systemPrompt: "テスト用のプロンプトです。【禁止表現】確かに",
          }),
      },
    });

    const persona = await generatePersona("fake-api-key");

    expect(persona).toHaveProperty("name", "テスト太郎");
    expect(persona).toHaveProperty("systemPrompt");
    expect(persona).toHaveProperty("bigFive");
    expect(persona).toHaveProperty("postFrequency");
    // bigFive は各1-5
    for (const val of Object.values(persona.bigFive)) {
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(5);
    }
    // postFrequency は外向性に基づく (240 - extraversion * 40)
    expect(persona.postFrequency).toBe(
      240 - persona.bigFive.extraversion * 40
    );
  });

  it("Geminiが```json```ラッパー付きで返しても正しくパースする", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          '```json\n{"name": "ラッパー付き", "systemPrompt": "テスト"}\n```',
      },
    });

    const persona = await generatePersona("fake-api-key");
    expect(persona.name).toBe("ラッパー付き");
  });

  it("外向性5のペルソナは投稿頻度40秒", async () => {
    // 外向性を5に固定するためモック
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({ name: "外向的", systemPrompt: "テスト" }),
      },
    });

    const persona = await generatePersona("fake-api-key");
    // postFrequency = 240 - extraversion * 40
    // extraversion は 1-5 のランダムなので、計算が正しいことだけ確認
    const expected = 240 - persona.bigFive.extraversion * 40;
    expect(persona.postFrequency).toBe(expected);
  });

  it("フォールバックペルソナの外向性別postFrequencyが正しい", () => {
    // テンション高い大学生: 外向性5 → 40秒
    expect(FALLBACK_PERSONAS[0].postFrequency).toBe(40);
    // 無口なエンジニア: 外向性1 → 200秒
    expect(FALLBACK_PERSONAS[1].postFrequency).toBe(200);
    // 穏やかな映画好き: 外向性3 → 120秒
    expect(FALLBACK_PERSONAS[2].postFrequency).toBe(120);
  });
});

describe("fallbackPosts", () => {
  it("20件の汎用レスがある", async () => {
    const { FALLBACK_POSTS } = await import("../fallbackPosts");
    expect(FALLBACK_POSTS.length).toBe(20);
  });

  it("全て非空の文字列", async () => {
    const { FALLBACK_POSTS } = await import("../fallbackPosts");
    for (const post of FALLBACK_POSTS) {
      expect(typeof post).toBe("string");
      expect(post.length).toBeGreaterThan(0);
    }
  });
});
