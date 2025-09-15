import EmbeddingProviderBase from "./providerBase.js";
import config from "../config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiVertexProvider extends EmbeddingProviderBase {
    constructor() {
        super();
        if (!config.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set in .env");
        this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        this.embeddingModel = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
    }

    async embedTexts(texts) {
        const results = [];

        for (const txt of texts) {
            const processedText = await this.preprocessText(txt);
            const result = await this.embeddingModel.embedContent(processedText);
            results.push(result.embedding.values);
        }
        return results;
    }

    providerName() {
        return "GeminiVertexProvider";
    }
}

export default GeminiVertexProvider;
