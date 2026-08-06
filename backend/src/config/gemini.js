import { GoogleGenerativeAI } from "@google/generative-ai";

export const getGeminiModel = (model = "gemini-flash-latest") => {
  const key = process.env.GEMINI_API_KEY;
  if (!key)
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model });
};
