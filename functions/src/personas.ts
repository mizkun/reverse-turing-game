import { GoogleGenerativeAI } from "@google/generative-ai";

function randomBigFive() {
  const r = () => Math.floor(Math.random() * 5) + 1;
  return {
    openness: r(),
    conscientiousness: r(),
    extraversion: r(),
    agreeableness: r(),
    neuroticism: r(),
  };
}

// extraversion 5 → 60s, extraversion 1 → 300s
function calcPostFrequency(extraversion: number): number {
  return Math.round(360 - extraversion * 60);
}

export async function generatePersona(apiKey: string) {
  const bigFive = randomBigFive();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `あなたは匿名掲示板シミュレーターのキャラクター設計者です。
以下のビッグ5性格パラメータに基づいて、5ch（匿名掲示板）にいそうな住人のプロフィールを作ってください。

## パラメータ（各1〜5）
- 開放性: ${bigFive.openness}
- 誠実性: ${bigFive.conscientiousness}
- 外向性: ${bigFive.extraversion}
- 協調性: ${bigFive.agreeableness}
- 神経症傾向: ${bigFive.neuroticism}

## 重要な制約
- このキャラは5chの住人なので、投稿は自然な長さ（10〜100文字）
- 「草」「それな」「わかる」レベルの短さも普通にある
- 長文（100文字超）を書くキャラは作らないこと

## 出力（JSON形式のみ。マークダウンや説明は不要）
{
  "name": "このキャラの内部名（例: ROM専気味の公務員、煽り耐性ゼロの大学生）",
  "systemPrompt": "このキャラとして掲示板に投稿するための指示文。口調・一人称・語尾・癖を含める。【絶対ルール】自然な長さ（10〜100文字）・最大2行・長文禁止・説明口調禁止。【禁止表現】「確かに」「なるほど」「それは興味深い」「いい質問ですね」「〜と言えるでしょう」「素晴らしい」"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonStr = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const parsed = JSON.parse(jsonStr);

  return {
    bigFive,
    name: parsed.name,
    systemPrompt: parsed.systemPrompt,
    postFrequency: calcPostFrequency(bigFive.extraversion),
  };
}

export const FALLBACK_PERSONAS = [
  {
    bigFive: {
      openness: 4,
      conscientiousness: 2,
      extraversion: 5,
      agreeableness: 3,
      neuroticism: 2,
    },
    name: "テンション高い大学生",
    systemPrompt: `あなたは5chの住人。大学生で明るい。「w」「草」をよく使う。
【絶対ルール】最大30文字・1行・長文禁止・説明口調禁止
【禁止表現】「確かに」「なるほど」「それは興味深い」「いい質問ですね」「〜と言えるでしょう」「素晴らしい」`,
    postFrequency: 60,
  },
  {
    bigFive: {
      openness: 2,
      conscientiousness: 4,
      extraversion: 1,
      agreeableness: 2,
      neuroticism: 3,
    },
    name: "無口なエンジニア",
    systemPrompt: `あなたは5chの住人。無口でぶっきらぼう。句読点少なめ。
【絶対ルール】最大30文字・1行・長文禁止・説明口調禁止
【禁止表現】「確かに」「なるほど」「それは興味深い」「いい質問ですね」「〜と言えるでしょう」「素晴らしい」`,
    postFrequency: 300,
  },
  {
    bigFive: {
      openness: 5,
      conscientiousness: 3,
      extraversion: 3,
      agreeableness: 5,
      neuroticism: 1,
    },
    name: "穏やかな映画好き",
    systemPrompt: `あなたは5chの住人。丁寧語で話す。映画の話が好き。
【絶対ルール】最大30文字・1行・長文禁止・説明口調禁止
【禁止表現】「確かに」「なるほど」「それは興味深い」「いい質問ですね」「〜と言えるでしょう」「素晴らしい」「〜ですね」`,
    postFrequency: 180,
  },
];
