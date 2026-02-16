import config from "./config.js";
import FastEmbedProvider from "./embeddings/fastEmbed.js";
import OllamaProvider from "./embeddings/ollama.js";
import GeminiVertexProvider from "./embeddings/geminiVertex.js";
import OpenRouterProvider from "./embeddings/openrouter.js";
import type EmbeddingProviderBase from "./embeddings/providerBase.js";

// Lazy load embedding provider
let embeddingProvider: EmbeddingProviderBase | undefined;

function getEmbeddingProvider(): EmbeddingProviderBase {
    if (!embeddingProvider) {
        const provider = config.EMBEDDING_PROVIDER.toLowerCase();
        
        switch (provider) {
            case "openrouter":
                embeddingProvider = new OpenRouterProvider();
                break;
            case "gemini":
                embeddingProvider = new GeminiVertexProvider();
                break;
            case "ollama":
                embeddingProvider = new OllamaProvider();
                break;
            case "fastembed":
            default:
                embeddingProvider = new FastEmbedProvider();
                break;
        }
        
        console.error(`Using embedding provider: ${provider}`);
    }
    return embeddingProvider;
}

/**
 * Embed a single text
 * @param text - Text to embed
 * @returns Embedding vector
 */
async function embedText(text: string): Promise<number[]> {
    const provider = getEmbeddingProvider();
    const vectors = await provider.embedTexts([text]);
    return vectors[0];
}

export { embedText };
