// server/qdrantClient.js
import { client } from "./init.js";
import dotenv from "dotenv";

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || null;
const VECTOR_DIM = parseInt(process.env.VECTOR_DIM || "768");
const DISTANCE_METRIC = process.env.DISTANCE_METRIC || "Cosine";

const DISTANCE_MAP = {
    Cosine: Distance.Cosine,
    Euclid: Distance.Euclid,
    Dot: Distance.Dot,
};

// Create collection if not exists
export async function createCollectionIfNotExists(collectionName) {
    const existing = await client.getCollections();
    const names = existing.collections.map((c) => c.name);
    if (!names.includes(collectionName)) {
        await client.createCollection({
            name: collectionName,
            vectors: {
                size: VECTOR_DIM,
                distance: DISTANCE_MAP[DISTANCE_METRIC] || Distance.Cosine,
            },
        });
        console.log(`Collection '${collectionName}' created.`);
    } else {
        console.log(`Collection '${collectionName}' already exists.`);
    }
}

// Upsert vectors
export async function upsertVectors(collectionName, points) {
    await client.upsert(collectionName, { points });
}

// Search vectors
export async function searchVectors(collectionName, queryVector, topK = 5, filter = null) {
    const searchResult = await client.search(collectionName, {
        vector: queryVector,
        limit: topK,
        filter,
    });
    return searchResult;
}