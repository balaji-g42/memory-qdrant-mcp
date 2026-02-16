// Search functionality for memory bank
import { client } from "../init.js";
import { embedText } from "../embeddings.js";
import { summarizeText } from "./summarizer.js";

const DEFAULT_TOP_K = parseInt(process.env.DEFAULT_TOP_K_MEMORY_QUERY || "3");

interface SearchResult {
    id: string | number;
    score: number;
    payload?: Record<string, any>;
}

interface SearchResponse {
    results: SearchResult[];
    summary?: string;
}

/**
 * Search the memory bank for a project with optional summarization.
 * @param projectName - Project name
 * @param queryText - Query string
 * @param memoryType - Optional memory type filter
 * @param topK - Number of results to return
 * @param summarize - Whether to summarize the results
 */
async function searchMemory(
    projectName: string,
    queryText: string,
    memoryType: string | null = null,
    topK: number = DEFAULT_TOP_K,
    summarize: boolean = false
): Promise<SearchResponse> {
    const collectionName = `memory_bank_${projectName}`;

    // Build filter
    const mustFilter: any[] = [{ key: "project", match: { value: projectName } }];
    if (memoryType) {
        mustFilter.push({ key: "type", match: { value: memoryType } });
    }

    // Embed query
    const queryVector = await embedText(queryText);

    // Search in Qdrant
    const searchResult = await client.search(collectionName, {
        vector: queryVector,
        limit: topK,
        filter: { must: mustFilter },
        with_payload: true
    });

    const results: SearchResult[] = searchResult.map(hit => ({
        id: hit.id,
        score: hit.score,
        payload: hit.payload || {}
    }));

    // Summarize if requested
    if (summarize && results.length > 0) {
        const allContent = results.map(r => String(r.payload?.content || "")).join("\n\n");
        const summary = await summarizeText(allContent);
        return { results, summary };
    }

    return { results };
}

export { searchMemory, SearchResult, SearchResponse };
