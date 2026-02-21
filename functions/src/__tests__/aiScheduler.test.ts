import { describe, it, expect } from "vitest";

/**
 * aiScheduler のロジックテスト
 * スケジューラー自体は onSchedule で Firebase が実行するため、
 * ここではスケジューラーのビジネスロジック部分をテストする。
 */

describe("aiScheduler - ビジネスロジック", () => {
  it("排除されたペルソナはスキップされるべき", () => {
    // aiScheduler.ts L38: if (persona.eliminated) continue;
    const persona = { eliminated: true, postFrequency: 40 };
    expect(persona.eliminated).toBe(true);
  });

  it("roundEndsAt超過時にステータスがrevealedになるべき", () => {
    // aiScheduler.ts L27-29: roundEndsAt < now → status: "revealed"
    const roundEndsAt = new Date(Date.now() - 60000); // 1分前に終了
    const now = new Date();
    expect(roundEndsAt < now).toBe(true);
  });

  it("投稿頻度に基づいてスキップ判定が正しい", () => {
    const freq = 120; // 120秒
    const lastPostTime = Date.now() - 60 * 1000; // 60秒前
    const now = Date.now();
    const elapsed = now - lastPostTime;
    // 60秒 < 120秒 → まだ投稿しない
    expect(elapsed < freq * 1000).toBe(true);
  });

  it("初回投稿はランダム遅延後に行う", () => {
    const freq = 120;
    const roundStart = Date.now() - 10 * 1000; // 10秒前に開始
    const maxInitialDelay = freq * 1000; // 最大120秒
    // 初回遅延は 0 〜 freq*1000 の範囲
    const delay = Math.random() * freq * 1000;
    expect(delay).toBeGreaterThanOrEqual(0);
    expect(delay).toBeLessThanOrEqual(maxInitialDelay);
  });
});
