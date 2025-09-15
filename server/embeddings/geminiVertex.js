import EmbeddingProviderBase from "./providerBase.js";
import config from "../config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiVertexProvider extends EmbeddingProviderBase {
    constructor() {
        super();
        if (!config.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set in .env");
        this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }

    async embedTexts(texts) {
        const results = [];
        for (const txt of texts) {
            const processedText = await this.preprocessText(txt);
            const res = await this.genAI.embedContent({
                model: "models/text-embedding-004",
                content: { parts: [{ text: processedText }] }
            });
            results.push(res.embedding.values);
        }
        return results;
    }

    providerName() {
        return "GeminiVertexProvider";
    }
}

export default GeminiVertexProvider;
