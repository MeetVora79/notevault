import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateEmbedding = async (text) => {
  const key = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
  });

  // Truncate to avoid token limits — ChromaDB stores the full note anyway
  const truncated = text.slice(0, 8000);

  const result = await model.embedContent(truncated);
  return result.embedding.values;
};
