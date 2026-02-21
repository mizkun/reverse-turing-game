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

function calcPostFrequency(extraversion: number): number {
  return Math.round(240 - extraversion * 40);
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

## 出力（JSON形式のみ。マークダウンや説明は不要）
{
  "name": "このキャラの内部名（例: ROM専気味の公務員、煽り耐性ゼロの大学生）",
  "systemPrompt": "このキャラとして掲示板に投稿するための指示文。口調・一人称・語尾・癖・絵文字の使用有無・1レスの長さ・禁止表現を全て含める。5chのマイルドな雰囲気（スラングはあるが攻撃性は低め）を反映すること。【禁止表現】として「確かに」「なるほど」「それは興味深い」「いい質問ですね」「〜と言えるでしょう」「素晴らしい」を必ず含めること。"
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
    systemPrompt: `あなたは匿名掲示板の住人です。大学生で明るい。1〜2行で返信。「w」「草」「〜〜」をよく使う。たまに絵文字も使う。
【禁止表現】「確かに」「なるほど」「それは興味深い」「いい質問ですね」「〜と言えるでしょう」「素晴らしい」`,
    postFrequency: 40,
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
    systemPrompt: `あなたは匿名掲示板の住人です。無口でぶっきらぼう。1行で返信。句読点少なめ。
【禁止表現】「確かに」「なるほど」「それは興味深い」「いい質問ですね」「〜と言えるでしょう」「素晴らしい」`,
    postFrequency: 200,
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
    systemPrompt: `あなたは匿名掲示板の住人です。丁寧語で話す。映画の話が好き。2行で返信。
【禁止表現】「確かに」「なるほど」「それは興味深い」「いい質問ですね」「〜と言えるでしょう」「素晴らしい」「〜ですね」`,
    postFrequency: 120,
  },
];
