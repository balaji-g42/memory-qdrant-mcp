// Base class for embedding providers
import { summarizeText } from "../mcp_tools/summarizer.js";
import {
    SUMMARIZATION_PROMPT,
    MAX_TEXT_LENGTH_FOR_EMBEDDING,
    MAX_CHUNK_SIZE,
    CHUNK_OVERLAP,
    MAX_CHUNKS_PER_TEXT
} from "../constants.js";
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
            // Try chunking first
            const chunks = this.chunkText(text);
            if (chunks.length > 0 && chunks.length <= MAX_CHUNKS_PER_TEXT) {
                return chunks;
            }
            // Fallback to summarization if chunking produces too many chunks
            return await this.summarizeForEmbedding(text);
        }
        return text;
    }

    // Intelligent text chunking with sentence boundary detection
    chunkText(text) {
        const chunks = [];
        let start = 0;

        while (start < text.length && chunks.length < MAX_CHUNKS_PER_TEXT) {
            let end = start + MAX_CHUNK_SIZE;

            // If we're not at the end, try to find a good breaking point
            if (end < text.length) {
                // Look for sentence endings within the last 200 characters
                const searchStart = Math.max(start, end - 200);
                let breakPoint = end;

                // Look for period, exclamation, or question mark followed by space or newline
                for (let i = end - 1; i >= searchStart; i--) {
                    if ((text[i] === '.' || text[i] === '!' || text[i] === '?') &&
                        (i + 1 >= text.length || /\s/.test(text[i + 1]))) {
                        breakPoint = i + 1;
                        break;
                    }
                }

                // If no sentence ending found, look for other good break points
                if (breakPoint === end) {
                    // Look for spaces, newlines, or other natural breaks
                    for (let i = end - 1; i >= searchStart; i--) {
                        if (/\s/.test(text[i])) {
                            breakPoint = i;
                            break;
                        }
                    }
                }

                end = breakPoint;
            }

            const chunk = text.slice(start, end).trim();
            if (chunk.length > 0) {
                chunks.push(chunk);
            }

            // Move start position with overlap
            start = Math.max(start + 1, end - CHUNK_OVERLAP);
        }

        return chunks;
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
