// Qdrant client initialization and helper functions
import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from "uuid";
import config from "./config.js";
import type { MemoryType } from "./types.js";

const MEMORY_TYPES: MemoryType[] = [
    "productContext", 
    "activeContext", 
    "systemPatterns", 
    "decisionLog", 
    "progress", 
    "contextHistory", 
    "customData"
];

// Map string to Qdrant distance
const DISTANCE_MAP: Record<string, string> = {
    Cosine: "Cosine",
    Euclid: "Euclid",
    Dot: "Dot",
};

const client = new QdrantClient({
    url: config.QDRANT_URL,
    port: 443,
    apiKey: process.env.QDRANT_API_KEY || undefined,
    // @ts-ignore - checkCompatibility may not be in the types but is valid
    checkCompatibility: false
});

async function initMemoryBank(projectName: string): Promise<string> {
    const collectionName = `memory_bank_${projectName}`;

    // Check if collection exists
    const existingCollections = await client.getCollections();
    const exists = existingCollections.collections.some(c => c.name === collectionName);

    if (!exists) {
        await client.createCollection(collectionName, {
            vectors: { 
                size: config.VECTOR_DIM as number, 
                distance: (DISTANCE_MAP[config.DISTANCE_METRIC] || "Cosine") as "Cosine"
            }
        });

        // Insert placeholder points for each memory type
        const points = MEMORY_TYPES.map(memType => ({
            id: uuidv4(),
            vector: Array(config.VECTOR_DIM).fill(0),
            payload: {
                type: memType,
                content: `Initial placeholder for ${memType}`,
                timestamp: new Date().toISOString(),
                project: projectName,
            }
        }));

        await client.upsert(collectionName, { points });
    }

    return collectionName;
}

export { initMemoryBank, client };
