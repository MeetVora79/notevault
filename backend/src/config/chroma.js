import { ChromaClient } from "chromadb";

let client = null;
let collection = null;

export const getChromaClient = () => {
  if (!client) {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      client = new ChromaClient({
        host: process.env.CHROMA_HOST,
        auth: {
          provider: "token",
          credentials: process.env.CHROMA_API_KEY,
          tokenHeaderType: "CHROMA_CLIENT_AUTH_CREDENTIALS",
        },
        tenant: process.env.CHROMA_TENANT,
        database: process.env.CHROMA_DATABASE,
      });
    } else {
      client = new ChromaClient({
        host: "localhost",
        port: 8000,
        ssl: false,
      });
    }
  }
  return client;
};

export const getNotesCollection = async () => {
  if (!collection) {
    const chroma = getChromaClient();

    // Suppress ChromaDB's DefaultEmbeddingFunction warning
    const originalWarn = console.warn;
    console.warn = () => {};

    collection = await chroma.getOrCreateCollection({
      name: process.env.CHROMA_COLLECTION || "notes",
      metadata: { "hnsw:space": "cosine" },
      embeddingFunction: {
        generate: async (texts) => texts.map(() => []),
      },
    });

    console.warn = originalWarn; // restore
  }
  return collection;
};
