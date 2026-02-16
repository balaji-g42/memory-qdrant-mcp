import EmbeddingProviderBase from "./providerBase.js";
import config from "../config.js";
import axios from "axios";

class OllamaProvider extends EmbeddingProviderBase {
    constructor() {
        super();
        this.baseURL = config.OLLAMA_BASE_URL || "http://localhost:11434";
        this.model = config.EMBEDDING_MODEL || "nomic-embed-text:v1.5";
    }

    async embedTexts(texts) {
        const embeddings = [];

        for (const text of texts) {
            try {
                const processedText = await this.preprocessText(text);

                // Handle chunked text (array of strings)
                if (Array.isArray(processedText)) {
                    const chunkEmbeddings = [];
                    for (const chunk of processedText) {
                        // Truncate chunk if still too long
                        const truncatedChunk = chunk.length > 8000 ? chunk.substring(0, 8000) : chunk;

                        const response = await axios.post(`${this.baseURL}/api/embeddings`, {
                            model: this.model,
                            prompt: truncatedChunk
                        }, {
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

                    const response = await axios.post(`${this.baseURL}/api/embeddings`, {
                        model: this.model,
                        prompt: truncatedText
                    }, {
                        timeout: 30000 // 30 second timeout
                    });

                    if (response.data && response.data.embedding) {
                        embeddings.push(response.data.embedding);
                    } else {
                        throw new Error("Invalid response format from Ollama API");
                    }
                }
            } catch (error) {
                console.error(`Ollama embedding failed for text: ${error.message}`);
                // Fallback to normalized random embedding if Ollama fails
                const fallback = Array.from({length: config.VECTOR_DIM}, () => Math.random() - 0.5);
                const mag = Math.sqrt(fallback.reduce((s, v) => s + v * v, 0));
                embeddings.push(fallback.map(v => v / mag));
            }
        }

        return embeddings;
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
        return "OllamaProvider";
    }
}

export default OllamaProvider;
