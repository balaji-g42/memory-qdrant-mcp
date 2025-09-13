import EmbeddingProviderBase from "./providerBase.js";
import config from "../config.js";
import axios from "axios";

class OllamaProvider extends EmbeddingProviderBase {
    async embedTexts(texts) {
        // Replace with actual Ollama API embedding call
        // Example: POST /embeddings with API key
        const embeddings = [];
        for (const text of texts) {
            // Mock example, replace with real API call
            embeddings.push(Array(768).fill(Math.random()));
        }
        return embeddings;
    }

    providerName() {
        return "OllamaProvider";
    }
}

export default OllamaProvider;
