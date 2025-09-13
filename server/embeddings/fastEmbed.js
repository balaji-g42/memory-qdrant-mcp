import EmbeddingProviderBase from "./providerBase.js";

// Local placeholder embeddings (for testing or small projects)
class FastEmbedProvider extends EmbeddingProviderBase {
    async embedTexts(texts) {
        return texts.map(txt => Array(768).fill(Math.random())); // dummy vector
    }

    providerName() {
        return "FastEmbedProvider";
    }
}

export default FastEmbedProvider;
