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
                // Preprocess text (summarize if too long)
                const processedText = await this.preprocessText(text);
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
            } catch (error) {
                console.error(`Ollama embedding failed for text: ${error.message}`);
                // Fallback to random embedding if Ollama fails
                embeddings.push(Array(768).fill(Math.random()));
            }
        }

        return embeddings;
    }

    providerName() {
        return "OllamaProvider";
    }
}

export default OllamaProvider;
