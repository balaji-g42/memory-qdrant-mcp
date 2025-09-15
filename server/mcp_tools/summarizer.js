// server/mcp_tools/summarizer.js
import axios from "axios";
import config from "../config.js";

const SUMMARIZER_MODEL = process.env.SUMMARIZER_MODEL || "openai/gpt-oss-20b:free";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";

/**
 * Summarize a given text using OpenRouter (if API key present) or Gemini free model.
 * @param {string} text - Text to summarize
 * @returns {Promise<string>} - Summarized text
 */
async function summarizeText(text) {
    if (!text) return "";

    // Use OpenRouter if key exists
    if (OPENROUTER_KEY) {
        try {
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: SUMMARIZER_MODEL,
                    messages: [
                        { role: "system", content: "Summarize the following content concisely:" },
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
            // OpenRouter summarization failed, falling back to Gemini
        }
    }

    // Fallback to Gemini free model
    try {
        const { GoogleGenerativeAI } = await import("google.generativeai");
        if (!config.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

        const genai = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        const model = genai.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContent(`Summarize the following content concisely: ${text}`);
        const response = await result.response;
        const summary = response.text();

        if (summary) return summary;
    } catch (err) {
        // Gemini summarization failed
    }

    // If all fails, return original text
    return text;
}

export { summarizeText };
