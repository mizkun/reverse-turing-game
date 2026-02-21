import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generatePost(
  apiKey: string,
  personaSystemPrompt: string,
  threadTitle: string,
  recentPosts: { postNumber: number; authorId: string; content: string }[]
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const context =
    recentPosts.length > 0
      ? recentPosts
          .map((p) => `>>${p.postNumber} ID:${p.authorId} ${p.content}`)
          .join("\n")
      : "(まだ投稿がありません)";

  const prompt = `${personaSystemPrompt}

---
スレッド: ${threadTitle}
直近の投稿:
${context}

上記の流れを読んで、自然な返信を1件だけ書いてください。

【絶対ルール】
- 本文のみ出力。レス番号やID等は不要
- 5chの匿名掲示板のノリで、自然な長さ（10〜100文字程度）
- 短いレスが基本。「草」「それな」くらいの時もある
- 長文禁止。最大でも2行まで
- 説明口調禁止。会話しろ`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  // Hard limit: truncate to 100 chars if model ignores instruction
  if (text.length > 100) {
    text = text.substring(0, 100);
  }
  return text;
}
