import EmbeddingProviderBase from "./providerBase.js";
import config from "../config.js";
import axios from "axios";
import FastEmbedProvider from "./fastEmbed.js";

class OllamaProvider extends EmbeddingProviderBase {
    private baseURL: string;
    private model: string;
    private apiKey: string;
    private fastEmbedFallback: FastEmbedProvider;

    constructor() {
        super();
        this.baseURL = config.OLLAMA_API_URL;
        this.model = config.EMBEDDING_MODEL || "nomic-embed-text:v1.5";
        this.apiKey = config.OLLAMA_API_KEY;
        this.fastEmbedFallback = new FastEmbedProvider();
    }

    async embedTexts(texts: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];

        for (const text of texts) {
            try {
                const processedText = await this.preprocessText(text);

                // Handle chunked text (array of strings)
                if (Array.isArray(processedText)) {
                    const chunkEmbeddings: number[][] = [];
                    for (const chunk of processedText) {
                        // Truncate chunk if still too long
                        const truncatedChunk = chunk.length > 8000 ? chunk.substring(0, 8000) : chunk;

                        const headers = this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {};
                        const response = await axios.post(`${this.baseURL}/api/embeddings`, {
                            model: this.model,
                            prompt: truncatedChunk
                        }, {
                            headers,
                            timeout: 30000 // 30 second timeout
                        });

                        if (response.data && response.data.embedding) {
                            chunkEmbeddings.push(response.data.embedding);
                        } else {
                            throw new Error("Invalid response format from Ollama API");
                        }
                    }
                    // Average the chunk embeddings
                    const avgEmbedding = this.averageEmbeddings(chunkEmbeddings);
                    embeddings.push(avgEmbedding);
                } else {
                    // Handle single text (string)
                    // Truncate text if still too long to avoid issues
                    const truncatedText = processedText.length > 8000 ? processedText.substring(0, 8000) : processedText;

                    const headers = this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {};
                    const response = await axios.post(`${this.baseURL}/api/embeddings`, {
                        model: this.model,
                        prompt: truncatedText
                    }, {
                        headers,
                        timeout: 30000 // 30 second timeout
                    });

                    if (response.data && response.data.embedding) {
                        embeddings.push(response.data.embedding);
                    } else {
                        throw new Error("Invalid response format from Ollama API");
                    }
                }
            } catch (error) {
                const err = error as Error;
                console.error(`Ollama embedding failed for text: ${err.message}, falling back to FastEmbed`);
                // Fallback to FastEmbed if Ollama fails
                const fallbackEmbeddings = await this.fastEmbedFallback.embedTexts([text]);
                embeddings.push(fallbackEmbeddings[0]);
            }
        }

        return embeddings;
    }

    // Helper method to average multiple embeddings
    averageEmbeddings(embeddings: number[][]): number[] {
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

    providerName(): string {
        return "OllamaProvider";
    }
}

export default OllamaProvider;
