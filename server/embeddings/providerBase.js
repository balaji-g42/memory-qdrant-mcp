// Base class for embedding providers
class EmbeddingProviderBase {
    async embedTexts(texts) {
        throw new Error("embedTexts() must be implemented by subclass");
    }

    providerName() {
        throw new Error("providerName() must be implemented by subclass");
    }
}

export default EmbeddingProviderBase;
