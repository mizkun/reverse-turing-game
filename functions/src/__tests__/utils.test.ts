import { describe, it, expect } from "vitest";
import { generateId } from "../utils";

describe("generateId", () => {
  it("指定された長さのIDを生成する", () => {
    const id8 = generateId(8);
    expect(id8.length).toBe(8);

    const id16 = generateId(16);
    expect(id16.length).toBe(16);
  });

  it("英数字のみで構成される", () => {
    const id = generateId(100);
    expect(id).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("呼び出しごとに異なるIDを生成する", () => {
    const ids = new Set(Array.from({ length: 10 }, () => generateId(8)));
    expect(ids.size).toBeGreaterThan(1);
  });
});
