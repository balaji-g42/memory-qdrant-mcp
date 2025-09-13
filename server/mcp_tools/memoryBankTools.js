import { initMemoryBank } from "./init.js";
import { v4 as uuidv4 } from "uuid";
import { QdrantClient } from "@qdrant/js-client-rest";
import config from "../config.js";

// Embedding providers
import FastEmbedProvider from "../embeddings/fastEmbed.js";
import OllamaProvider from "../embeddings/ollama.js";
import GeminiVertexProvider from "../embeddings/geminiVertex.js";

const client = new QdrantClient({ url: config.QDRANT_URL });

// Lazy load embedding provider
let embeddingProvider;
function getEmbeddingProvider() {
    if (!embeddingProvider) {
        if (config.OPENROUTER_API_KEY) {
            embeddingProvider = new OllamaProvider();
        } else if (config.GEMINI_API_KEY) {
            embeddingProvider = new GeminiVertexProvider();
        } else {
            throw new Error("No embedding provider configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY in .env");
        }
    }
    return embeddingProvider;
}

const MEMORY_TYPES = ["productContext", "activeContext", "systemPatterns", "decisionLog", "progress"];

// ----- Log memory entry -----
async function logMemory(projectName, memoryType, content, topLevelId = null) {
    if (!MEMORY_TYPES.includes(memoryType)) {
        throw new Error(`Invalid memory type: ${memoryType}`);
    }

    const collectionName = await initMemoryBank(projectName);

    // Embed content
    const vector = (await getEmbeddingProvider().embedTexts([content]))[0];

    const pointId = topLevelId || uuidv4();

    const point = {
        id: pointId,
        vector,
        payload: {
            type: memoryType,
            content,
            timestamp: new Date().toISOString(),
            project: projectName
        }
    };

    await client.upsert(collectionName, { points: [point] });
    return pointId;
}

// ----- Query memory -----
async function queryMemory(projectName, queryText, memoryType = null, topK = 5) {
    const collectionName = `memory_bank_${projectName}`;

    const vector = (await getEmbeddingProvider().embedTexts([queryText]))[0];

    // Build filter
    const mustFilter = [{ key: "project", match: { value: projectName } }];
    if (memoryType) mustFilter.push({ key: "type", match: { value: memoryType } });

    const results = await client.search(collectionName, {
        vector,
        limit: topK,
        filter: { must: mustFilter }
    });

    return results.map(hit => ({
        id: hit.id,
        score: hit.score,
        content: hit.payload.content,
        type: hit.payload.type,
        timestamp: hit.payload.timestamp
    }));
}

export { logMemory, queryMemory };
