import { describe, it, expect } from "vitest";
import { FALLBACK_PERSONAS } from "../personas";

describe("FALLBACK_PERSONAS", () => {
  it("3体のフォールバックペルソナが定義されている", () => {
    expect(FALLBACK_PERSONAS.length).toBe(3);
  });

  it("各ペルソナに必要なフィールドがある", () => {
    for (const persona of FALLBACK_PERSONAS) {
      expect(persona).toHaveProperty("bigFive");
      expect(persona).toHaveProperty("name");
      expect(persona).toHaveProperty("systemPrompt");
      expect(persona).toHaveProperty("postFrequency");

      // bigFive の5項目
      expect(persona.bigFive).toHaveProperty("openness");
      expect(persona.bigFive).toHaveProperty("conscientiousness");
      expect(persona.bigFive).toHaveProperty("extraversion");
      expect(persona.bigFive).toHaveProperty("agreeableness");
      expect(persona.bigFive).toHaveProperty("neuroticism");
    }
  });

  it("各ペルソナの systemPrompt に禁止表現リストが含まれている", () => {
    for (const persona of FALLBACK_PERSONAS) {
      expect(persona.systemPrompt).toContain("禁止表現");
    }
  });

  it("postFrequency が正の数値である", () => {
    for (const persona of FALLBACK_PERSONAS) {
      expect(persona.postFrequency).toBeGreaterThan(0);
    }
  });
});
