import { GoogleGenerativeAI } from "@google/generative-ai";

export const getGeminiModel = (model = "gemini-flash-latest") => {
  const key = process.env.GEMINI_API_KEY;
  if (!key)
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model });
};

// Retries a Gemini call up to 2 extra times on transient 503/overload errors
export const generateWithRetry = async (model, prompt, maxRetries = 2) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      lastError = err;
      const isRetryable =
        err.message?.includes("503") || err.message?.includes("overloaded");
      if (!isRetryable || attempt === maxRetries) throw err;
      // Wait a bit longer each retry (500ms, then 1000ms)
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError;
};
