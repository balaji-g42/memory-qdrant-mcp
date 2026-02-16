import EmbeddingProviderBase from "./providerBase.js";
import config from "../config.js";

// Local placeholder embeddings (for testing or small projects)
class FastEmbedProvider extends EmbeddingProviderBase {
    async embedTexts(texts: string[]): Promise<number[][]> {
        const results: number[][] = [];
        for (const txt of texts) {
            const processedText = await this.preprocessText(txt);

            // Handle chunked text (array of strings)
            if (Array.isArray(processedText)) {
                // For chunked text, generate one embedding per chunk and average them
                const chunkEmbeddings: number[][] = [];
                for (const _chunk of processedText) {
                    const vector = Array.from({length: config.VECTOR_DIM}, () => Math.random() - 0.5);
                    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
                    chunkEmbeddings.push(vector.map(val => val / magnitude));
                }
                // Average the chunk embeddings
                const avgEmbedding = this.averageEmbeddings(chunkEmbeddings);
                results.push(avgEmbedding);
            } else {
                // Handle single text (string) - generate normalized random vector
                const vector = Array.from({length: config.VECTOR_DIM}, () => Math.random() - 0.5);
                const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
                results.push(vector.map(val => val / magnitude));
            }
        }
        return results;
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
        return "FastEmbedProvider";
    }
}

export default FastEmbedProvider;
