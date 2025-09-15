import EmbeddingProviderBase from "./providerBase.js";

// Local placeholder embeddings (for testing or small projects)
class FastEmbedProvider extends EmbeddingProviderBase {
    async embedTexts(texts) {
        const results = [];
        for (const txt of texts) {
            const processedText = await this.preprocessText(txt);
            // Generate normalized random vector
            const vector = Array.from({length: 768}, () => Math.random() - 0.5);
            const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
            results.push(vector.map(val => val / magnitude));
        }
        return results;
    }

    providerName() {
        return "FastEmbedProvider";
    }
}

export default FastEmbedProvider;
