import config from "./config.js";
import FastEmbedProvider from "./embeddings/fastEmbed.js";
import OllamaProvider from "./embeddings/ollama.js";
import GeminiVertexProvider from "./embeddings/geminiVertex.js";

// Lazy load embedding provider
let embeddingProvider;
function getEmbeddingProvider() {
    if (!embeddingProvider) {
        if (config.OPENROUTER_API_KEY) {
            embeddingProvider = new OllamaProvider();
        } else if (config.GEMINI_API_KEY) {
            embeddingProvider = new GeminiVertexProvider();
        } else {
            embeddingProvider = new FastEmbedProvider();
        }
    }
    return embeddingProvider;
}

/**
 * Embed a single text
 * @param {string} text - Text to embed
 * @returns {number[]} - Embedding vector
 */
async function embedText(text) {
    const provider = getEmbeddingProvider();
    const vectors = await provider.embedTexts([text]);
    return vectors[0];
}

export { embedText };