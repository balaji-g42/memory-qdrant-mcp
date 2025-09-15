import EmbeddingProviderBase from "./providerBase.js";

// Local placeholder embeddings (for testing or small projects)
class FastEmbedProvider extends EmbeddingProviderBase {
    async embedTexts(texts) {
        return texts.map(txt => {
            // Generate normalized random vector
            const vector = Array.from({length: 768}, () => Math.random() - 0.5);
            const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
            return vector.map(val => val / magnitude);
        });
    }

    providerName() {
        return "FastEmbedProvider";
    }
}

export default FastEmbedProvider;
