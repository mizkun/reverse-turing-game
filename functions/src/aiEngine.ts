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

上記の流れを読んで、自然な返信を1件だけ書いてください。本文のみ出力。レス番号やID等は不要。`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
