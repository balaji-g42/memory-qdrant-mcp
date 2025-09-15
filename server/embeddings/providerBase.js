// Base class for embedding providers
import { summarizeText } from "../mcp_tools/summarizer.js";
import { SUMMARIZATION_PROMPT, MAX_TEXT_LENGTH_FOR_EMBEDDING } from "../constants.js";
import axios from "axios";
import config from "../config.js";

class EmbeddingProviderBase {
    async embedTexts(texts) {
        throw new Error("embedTexts() must be implemented by subclass");
    }

    providerName() {
        throw new Error("providerName() must be implemented by subclass");
    }

    // Helper method to preprocess text before embedding
    async preprocessText(text) {
        if (text.length > MAX_TEXT_LENGTH_FOR_EMBEDDING) {
            return await this.summarizeForEmbedding(text);
        }
        return text;
    }

    // Embedding-specific summarization with custom prompt
    async summarizeForEmbedding(text) {
        const SUMMARIZER_MODEL = process.env.SUMMARIZER_MODEL || "openai/gpt-oss-20b:free";
        const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";

        // Use OpenRouter if key exists
        if (OPENROUTER_KEY) {
            try {
                const response = await axios.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                        model: SUMMARIZER_MODEL,
                        messages: [
                            { role: "system", content: SUMMARIZATION_PROMPT },
                            { role: "user", content: text }
                        ],
                        temperature: 0.2,
                        max_tokens: 500
                    },
                    {
                        headers: {
                            "Authorization": `Bearer ${OPENROUTER_KEY}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                const summary = response.data?.choices?.[0]?.message?.content;
                if (summary) return summary;
            } catch (err) {
                console.error("OpenRouter summarization failed, falling back to Gemini:", err.message);
            }
        }

        // Fallback to Gemini free model
        try {
            const { GoogleGenerativeAI } = await import("google.generativeai");
            if (!config.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

            const genai = new GoogleGenerativeAI(config.GEMINI_API_KEY);
            const model = genai.getGenerativeModel({ model: "gemini-pro" });

            const result = await model.generateContent(`${SUMMARIZATION_PROMPT}\n\nText to summarize:\n${text}`);
            const response = await result.response;
            const summary = response.text();

            if (summary) return summary;
        } catch (err) {
            console.error("Gemini summarization failed:", err.message);
        }

        // If all fails, return original text
        return text;
    }
}

export default EmbeddingProviderBase;
