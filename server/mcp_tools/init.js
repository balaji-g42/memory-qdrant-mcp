// server/mcp_tools/init.js
import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from "uuid";
import config from "../config.js";

const MEMORY_TYPES = ["productContext", "activeContext", "systemPatterns", "decisionLog", "progress", "contextHistory", "customData"];

// Map string to Qdrant distance
const DISTANCE_MAP = {
    Cosine: "Cosine",
    Euclid: "Euclid",
    Dot: "Dot",
};

const client = new QdrantClient({ url: config.QDRANT_URL, apiKey: config.QDRANT_API_KEY || undefined });

async function initMemoryBank(projectName) {
    const collectionName = `memory_bank_${projectName}`;

    // Check if collection exists
    const existingCollections = await client.getCollections();
    const exists = existingCollections.collections.some(c => c.name === collectionName);

    if (!exists) {
        await client.createCollection(collectionName, {
            vectors: { size: config.VECTOR_DIM, distance: DISTANCE_MAP[config.DISTANCE_METRIC] || "Cosine" }
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