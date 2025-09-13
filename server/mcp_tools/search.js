// server/mcp_tools/search.js
import { QdrantClient } from "@qdrant/js-client-rest";
import { embedText } from "./embeddings.js"; // wrapper for Gemini / Ollama embeddings
import { summarizeText } from "./summarizer.js"; // wrapper for Gemini/OpenRouter summarizer
import config from "../config.js";

const client = new QdrantClient({ url: config.QDRANT_URL });
const DEFAULT_TOP_K = parseInt(process.env.DEFAULT_TOP_K_MEMORY_QUERY || "3");

/**
 * Search the memory bank for a project with optional summarization.
 * @param {string} projectName - Project name.
 * @param {string} queryText - Query string.
 * @param {string|null} memoryType - Optional memory type filter.
 * @param {number|null} topK - Number of results to return.
 * @param {boolean} summarize - Whether to summarize the results.
 */
async function searchMemory(projectName, queryText, memoryType = null, topK = DEFAULT_TOP_K, summarize = false) {
    const collectionName = `memory_bank_${projectName}`;

    // Build filter
    const mustFilter = [{ key: "project", match: { value: projectName } }];
    if (memoryType) {
        mustFilter.push({ key: "type", match: { value: memoryType } });
    }

    // Embed query
    const queryVector = await embedText(queryText);

    // Search in Qdrant
    const searchResult = await client.search({
        collection_name: collectionName,
        vector: queryVector,
        limit: topK,
        filter: { must: mustFilter },
        with_payload: true
    });

    const results = searchResult.map(hit => ({
        id: hit.id,
        score: hit.score,
        content: hit.payload.content,
        type: hit.payload.type,
        timestamp: hit.payload.timestamp
    }));

    // Summarize if requested
    if (summarize && results.length > 0) {
        const allContent = results.map(r => r.content).join("\n\n");
        const summary = await summarizeText(allContent);
        return { results, summary };
    }

    return { results };
}

export { searchMemory };
