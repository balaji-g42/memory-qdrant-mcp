import EmbeddingProviderBase from "./providerBase.js";
import config from "../config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiVertexProvider extends EmbeddingProviderBase {
    constructor() {
        super();
        if (!config.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set in .env");
        this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        const modelName = config.EMBEDDING_MODEL || "models/gemini-embedding-001";
        this.embeddingModel = this.genAI.getGenerativeModel({ model: modelName });
    }

    async embedTexts(texts) {
        const results = [];

        for (const txt of texts) {
            const processedText = await this.preprocessText(txt);

            // Handle chunked text (array of strings)
            if (Array.isArray(processedText)) {
                const chunkEmbeddings = [];
                for (const chunk of processedText) {
                    const result = await this.embeddingModel.embedContent(chunk);
                    chunkEmbeddings.push(result.embedding.values);
                }
                // Average the chunk embeddings to get a single embedding
                const avgEmbedding = this.averageEmbeddings(chunkEmbeddings);
                results.push(avgEmbedding);
            } else {
                // Handle single text (string)
                const result = await this.embeddingModel.embedContent(processedText);
                results.push(result.embedding.values);
            }
        }
        return results;
    }

    // Helper method to average multiple embeddings
    averageEmbeddings(embeddings) {
        if (embeddings.length === 0) return [];
        if (embeddings.length === 1) return embeddings[0];

        const embeddingLength = embeddings[0].length;
        const averaged = new Array(embeddingLength).fill(0);

        for (const embedding of embeddings) {
            for (let i = 0; i < embeddingLength; i++) {
                averaged[i] += embedding[i];
            }
        }

        // Divide by number of embeddings to get average
        for (let i = 0; i < embeddingLength; i++) {
            averaged[i] /= embeddings.length;
        }

        return averaged;
    }

    providerName() {
        return "GeminiVertexProvider";
    }
}

export default GeminiVertexProvider;
