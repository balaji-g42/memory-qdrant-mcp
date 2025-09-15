import { initMemoryBank } from "./init.js";
import { v4 as uuidv4 } from "uuid";
import { QdrantClient } from "@qdrant/js-client-rest";
import config from "../config.js";
import { embeddingCache, queryCache, contextCache, patternCache, cacheKeys, cacheUtils } from "../cache.js";

// Embedding providers
import FastEmbedProvider from "../embeddings/fastEmbed.js";
import OllamaProvider from "../embeddings/ollama.js";
import GeminiVertexProvider from "../embeddings/geminiVertex.js";

// Initialize Qdrant client
const client = new QdrantClient({
    url: config.QDRANT_URL
});

// Lazy load embedding provider - correct priority: Gemini > Ollama > FastEmbed
// OPENROUTER_API_KEY only affects summarization, not embeddings
let embeddingProvider;
function getEmbeddingProvider() {
    if (!embeddingProvider) {
        if (config.GEMINI_API_KEY) {
            console.log("Using Gemini for embeddings");
            embeddingProvider = new GeminiVertexProvider();
        } else if (config.OLLAMA_BASE_URL) {
            console.log("Using Ollama for embeddings");
            embeddingProvider = new OllamaProvider();
        } else {
            console.log("Using FastEmbed (no embedding provider configured)");
            embeddingProvider = new FastEmbedProvider();
        }
    }
    return embeddingProvider;
}

/**
 * Cached embedding generation with performance optimization
 * @param {string[]} texts - Array of texts to embed
 * @returns {number[][]} Array of embeddings
 */
async function getCachedEmbeddings(texts) {
    const provider = getEmbeddingProvider();
    const results = [];
    const uncachedTexts = [];
    const uncachedIndices = [];

    // Check cache for each text
    texts.forEach((text, index) => {
        const cacheKey = cacheKeys.embedding(text);
        const cached = cacheUtils.getCached(embeddingCache, cacheKey);
        if (cached) {
            results[index] = cached;
        } else {
            uncachedTexts.push(text);
            uncachedIndices.push(index);
        }
    });

    // Generate embeddings for uncached texts
    if (uncachedTexts.length > 0) {
        const newEmbeddings = await provider.embedTexts(uncachedTexts);

        // Cache and store results
        uncachedTexts.forEach((text, i) => {
            const embedding = newEmbeddings[i];
            const cacheKey = cacheKeys.embedding(text);
            cacheUtils.setCached(embeddingCache, cacheKey, embedding);
            results[uncachedIndices[i]] = embedding;
        });
    }

    return results;
}

const MEMORY_TYPES = ["productContext", "activeContext", "systemPatterns", "decisionLog", "progress", "contextHistory"];

// ConPort structured context types
const STRUCTURED_CONTEXT_TYPES = ["productContext", "activeContext"];
const DECISION_TYPE = "decisionLog";
const PROGRESS_TYPE = "progress";
const SYSTEM_PATTERN_TYPE = "systemPatterns";
const CUSTOM_DATA_TYPE = "customData";

// ----- Log memory entry -----
async function logMemory(projectName, memoryType, content, topLevelId = null) {
    if (!MEMORY_TYPES.includes(memoryType)) {
        throw new Error(`Invalid memory type: ${memoryType}`);
    }

    const collectionName = await initMemoryBank(projectName);

    // Embed content with caching
    const vectors = await getCachedEmbeddings([content]);
    const vector = vectors[0];

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

    // Invalidate relevant caches
    cacheUtils.invalidateProjectCache(projectName);

    return pointId;
}

// ----- Query memory -----
async function queryMemory(projectName, queryText, memoryType = null, topK = 5) {
    // Check cache first
    const cacheKey = cacheKeys.query(projectName, queryText, memoryType, topK);
    const cachedResult = cacheUtils.getCached(queryCache, cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    const collectionName = `memory_bank_${projectName}`;

    // Use cached embeddings
    const vectors = await getCachedEmbeddings([queryText]);
    const vector = vectors[0];

    // Build filter
    const mustFilter = [{ key: "project", match: { value: projectName } }];
    if (memoryType) mustFilter.push({ key: "type", match: { value: memoryType } });

    const results = await client.search(collectionName, {
        vector,
        limit: topK,
        filter: { must: mustFilter }
    });

    const formattedResults = results.map(hit => ({
        id: hit.id,
        score: hit.score,
        content: hit.payload.content,
        type: hit.payload.type,
        timestamp: hit.payload.timestamp
    }));

    // Cache the results
    cacheUtils.setCached(queryCache, cacheKey, formattedResults);

    return formattedResults;
}

// ----- Log structured memory entry (for ConPort contexts) -----
async function logStructuredMemory(projectName, contextType, content, topLevelId = null) {
    if (!STRUCTURED_CONTEXT_TYPES.includes(contextType)) {
        throw new Error(`Invalid structured context type: ${contextType}`);
    }

    const collectionName = await initMemoryBank(projectName);

    // Embed content - convert to string for embedding
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    const vector = (await getEmbeddingProvider().embedTexts([contentString]))[0];

    const pointId = topLevelId || uuidv4();

    const point = {
        id: pointId,
        vector,
        payload: {
            type: contextType,
            content: typeof content === 'string' ? content : JSON.stringify(content),
            structured: true,
            timestamp: new Date().toISOString(),
            project: projectName
        }
    };

    await client.upsert(collectionName, { points: [point] });
    return pointId;
}

// ----- Get structured context -----
async function getStructuredContext(projectName, contextType) {
    if (!STRUCTURED_CONTEXT_TYPES.includes(contextType)) {
        throw new Error(`Invalid structured context type: ${contextType}`);
    }

    // Check cache first
    const cacheKey = cacheKeys.structuredContext(projectName, contextType);
    const cachedResult = cacheUtils.getCached(contextCache, cacheKey);
    if (cachedResult) {
        return cachedResult;
    }

    const collectionName = `memory_bank_${projectName}`;

    // Get the most recent entry for this context type
    const results = await client.search(collectionName, {
        vector: (await getCachedEmbeddings(["dummy"]))[0], // dummy vector for filter-only query
        limit: 1,
        filter: {
            must: [
                { key: "project", match: { value: projectName } },
                { key: "type", match: { value: contextType } },
                { key: "structured", match: { value: true } }
            ]
        },
        with_payload: true,
        with_vectors: false
    });

    let contextResult;
    if (results.length === 0) {
        contextResult = {}; // Return empty object if no context exists
    } else {
        const payload = results[0].payload;
        try {
            contextResult = typeof payload.content === 'string' ? JSON.parse(payload.content) : payload.content;
        } catch (e) {
            contextResult = payload.content; // Return as string if not valid JSON
        }
    }

    // Cache the result
    cacheUtils.setCached(contextCache, cacheKey, contextResult);

    return contextResult;
}

// ----- Update structured context with patch -----
async function updateStructuredContext(projectName, contextType, patchContent) {
    if (!STRUCTURED_CONTEXT_TYPES.includes(contextType)) {
        throw new Error(`Invalid structured context type: ${contextType}`);
    }

    // Get current context
    const currentContext = await getStructuredContext(projectName, contextType);

    // Apply patch - merge objects
    const updatedContext = { ...currentContext, ...patchContent };

    // Handle special delete sentinel
    Object.keys(patchContent).forEach(key => {
        if (patchContent[key] === "__DELETE__") {
            delete updatedContext[key];
        }
    });

    // Log the updated context with history tracking
    const pointId = await logStructuredMemory(projectName, contextType, updatedContext);

    // Store history entry
    const historyEntry = {
        contextType,
        previousVersion: currentContext,
        newVersion: updatedContext,
        changes: patchContent,
        timestamp: new Date().toISOString(),
        pointId
    };

    await logMemory(projectName, "contextHistory", JSON.stringify(historyEntry));

    // Invalidate context cache
    const cacheKey = cacheKeys.structuredContext(projectName, contextType);
    contextCache.cache.delete(cacheKey);

    return pointId;
}

// ----- Get decisions with structured format -----
async function getDecisions(projectName, limit = 10, tags_filter_include_all = [], tags_filter_include_any = []) {
    const collectionName = `memory_bank_${projectName}`;

    // Build filter
    const mustFilter = [
        { key: "project", match: { value: projectName } },
        { key: "type", match: { value: DECISION_TYPE } }
    ];

    // For now, we'll implement basic filtering - tags would need additional payload structure
    const results = await client.search(collectionName, {
        vector: (await getEmbeddingProvider().embedTexts(["decisions"]))[0],
        limit: limit,
        filter: { must: mustFilter }
    });

    return results.map(hit => ({
        id: hit.id,
        summary: hit.payload.content,
        timestamp: hit.payload.timestamp
    }));
}

// ----- Search decisions with full-text search simulation -----
async function searchDecisionsFTS(projectName, queryTerm, limit = 10) {
    const collectionName = `memory_bank_${projectName}`;

    // Use semantic search with the query term
    const vector = (await getEmbeddingProvider().embedTexts([queryTerm]))[0];

    const results = await client.search(collectionName, {
        vector,
        limit: limit,
        filter: {
            must: [
                { key: "project", match: { value: projectName } },
                { key: "type", match: { value: DECISION_TYPE } }
            ]
        }
    });

    return results.map(hit => ({
        id: hit.id,
        summary: hit.payload.content,
        score: hit.score,
        timestamp: hit.payload.timestamp
    }));
}

// ----- Semantic search across all memory types -----
async function semanticSearch(projectName, queryText, limit = 10, memoryTypes = null) {
    const collectionName = `memory_bank_${projectName}`;

    const vector = (await getEmbeddingProvider().embedTexts([queryText]))[0];

    // Build filter
    const mustFilter = [{ key: "project", match: { value: projectName } }];
    if (memoryTypes && memoryTypes.length > 0) {
        mustFilter.push({
            key: "type",
            match: { any: memoryTypes }
        });
    }

    const results = await client.search(collectionName, {
        vector,
        limit: limit,
        filter: { must: mustFilter }
    });

    return results.map(hit => ({
        id: hit.id,
        score: hit.score,
        content: hit.payload.content,
        type: hit.payload.type,
        timestamp: hit.payload.timestamp,
        structured: hit.payload.structured || false
    }));
}

// ----- Knowledge graph linking -----
async function createKnowledgeLink(projectName, sourceId, targetId, linkType, description = "") {
    const collectionName = await initMemoryBank(projectName);

    const linkContent = {
        sourceId,
        targetId,
        linkType,
        description,
        timestamp: new Date().toISOString()
    };

    const contentString = JSON.stringify(linkContent);
    const vector = (await getEmbeddingProvider().embedTexts([contentString]))[0];

    const pointId = uuidv4();

    const point = {
        id: pointId,
        vector,
        payload: {
            type: "knowledgeLink",
            content: contentString,
            sourceId,
            targetId,
            linkType,
            description,
            timestamp: new Date().toISOString(),
            project: projectName
        }
    };

    await client.upsert(collectionName, { points: [point] });
    return pointId;
}

async function getKnowledgeLinks(projectName, entityId, linkType = null, direction = "both") {
    const collectionName = `memory_bank_${projectName}`;

    // Build filter based on direction
    const mustFilter = [{ key: "project", match: { value: projectName } }];
    if (linkType) {
        mustFilter.push({ key: "linkType", match: { value: linkType } });
    }

    let shouldFilter = [];
    if (direction === "outgoing" || direction === "both") {
        shouldFilter.push({ key: "sourceId", match: { value: entityId } });
    }
    if (direction === "incoming" || direction === "both") {
        shouldFilter.push({ key: "targetId", match: { value: entityId } });
    }

    const results = await client.search(collectionName, {
        vector: (await getEmbeddingProvider().embedTexts(["knowledge links"]))[0],
        limit: 50,
        filter: {
            must: mustFilter,
            should: shouldFilter,
            minimum_should_match: 1
        }
    });

    return results.map(hit => ({
        id: hit.id,
        sourceId: hit.payload.sourceId,
        targetId: hit.payload.targetId,
        linkType: hit.payload.linkType,
        description: hit.payload.description,
        timestamp: hit.payload.timestamp
    }));
}

// ----- Get context history -----
async function getContextHistory(projectName, contextType, limit = 10) {
    if (!STRUCTURED_CONTEXT_TYPES.includes(contextType)) {
        throw new Error(`Invalid structured context type: ${contextType}`);
    }

    const collectionName = `memory_bank_${projectName}`;

    const results = await client.search(collectionName, {
        vector: (await getEmbeddingProvider().embedTexts(["context history"]))[0],
        limit: limit,
        filter: {
            must: [
                { key: "project", match: { value: projectName } },
                { key: "type", match: { value: "contextHistory" } },
                { key: "contextType", match: { value: contextType } }
            ]
        }
    });

    return results.map(hit => {
        try {
            const historyData = JSON.parse(hit.payload.content);
            return {
                id: hit.id,
                contextType: historyData.contextType,
                previousVersion: historyData.previousVersion,
                newVersion: historyData.newVersion,
                changes: historyData.changes,
                timestamp: historyData.timestamp,
                pointId: historyData.pointId
            };
        } catch (e) {
            return null;
        }
    }).filter(item => item !== null);
}

// ----- Batch operations -----

/**
 * Batch log multiple memory entries
 * @param {string} projectName - Name of the project
 * @param {Array} entries - Array of {memoryType, content, topLevelId} objects
 * @returns {Array} Array of logged entry IDs
 */
async function batchLogMemory(projectName, entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error("Entries must be a non-empty array");
    }

    const collectionName = await initMemoryBank(projectName);
    const points = [];

    // Process all entries in parallel for embedding
    const embedPromises = entries.map(entry => {
        if (!MEMORY_TYPES.includes(entry.memoryType)) {
            throw new Error(`Invalid memory type: ${entry.memoryType}`);
        }
        return getCachedEmbeddings([entry.content]);
    });

    const vectors = await Promise.all(embedPromises);

    // Create points
    entries.forEach((entry, index) => {
        const pointId = entry.topLevelId || uuidv4();
        const point = {
            id: pointId,
            vector: vectors[index][0],
            payload: {
                type: entry.memoryType,
                content: entry.content,
                timestamp: new Date().toISOString(),
                project: projectName
            }
        };
        points.push(point);
    });

    await client.upsert(collectionName, { points });
    return points.map(point => point.id);
}

/**
 * Batch query memory with multiple queries
 * @param {string} projectName - Name of the project
 * @param {Array} queries - Array of {queryText, memoryType, topK} objects
 * @returns {Array} Array of query results
 */
async function batchQueryMemory(projectName, queries) {
    if (!Array.isArray(queries) || queries.length === 0) {
        throw new Error("Queries must be a non-empty array");
    }

    try {
        // Initialize memory bank - this can fail if Qdrant is unavailable
        const collectionName = await initMemoryBank(projectName);

        // Process all queries in parallel
        const queryPromises = queries.map(async (query) => {
            const vectors = await getCachedEmbeddings([query.queryText]);
            const vector = vectors[0];

            // Build filter
            const mustFilter = [{ key: "project", match: { value: projectName } }];
            if (query.memoryType) mustFilter.push({ key: "type", match: { value: query.memoryType } });

            const results = await client.search(collectionName, {
                vector,
                limit: query.topK || 5,
                filter: { must: mustFilter }
            });

            return results.map(hit => ({
                id: hit.id,
                score: hit.score,
                content: hit.payload.content,
                type: hit.payload.type,
                timestamp: hit.payload.timestamp
            }));
        });

        return await Promise.all(queryPromises);
    } catch (error) {
        // Fallback: return empty results when Qdrant is unavailable
        console.warn(`Qdrant unavailable for batchQueryMemory: ${error.message}`);
        return queries.map(() => []);
    }
}

/**
 * Batch update multiple structured contexts
 * @param {string} projectName - Name of the project
 * @param {Array} updates - Array of {contextType, patchContent} objects
 * @returns {Array} Array of update result IDs
 */
async function batchUpdateStructuredContext(projectName, updates) {
    if (!Array.isArray(updates) || updates.length === 0) {
        throw new Error("Updates must be a non-empty array");
    }

    const results = [];

    // Process updates sequentially to avoid conflicts
    for (const update of updates) {
        if (!STRUCTURED_CONTEXT_TYPES.includes(update.contextType)) {
            throw new Error(`Invalid structured context type: ${update.contextType}`);
        }

        const resultId = await updateStructuredContext(projectName, update.contextType, update.patchContent);
        results.push(resultId);
    }

    return results;
}

// ----- System patterns management -----

/**
 * Get all system patterns for a project
 * @param {string} projectName - Name of the project
 * @param {number} limit - Maximum number of patterns to return
 * @returns {Array} Array of system patterns
 */
async function getSystemPatterns(projectName, limit = 50) {
    // Check cache first
    const cacheKey = cacheKeys.systemPatterns(projectName);
    const cachedResult = cacheUtils.getCached(patternCache, cacheKey);
    if (cachedResult) {
        return cachedResult.slice(0, limit); // Return cached results up to limit
    }

    const collectionName = `memory_bank_${projectName}`;

    const results = await client.search(collectionName, {
        vector: (await getCachedEmbeddings(["system patterns and conventions"]))[0],
        limit: limit,
        filter: {
            must: [
                { key: "project", match: { value: projectName } },
                { key: "type", match: { value: SYSTEM_PATTERN_TYPE } }
            ]
        }
    });

    const formattedResults = results.map(hit => ({
        id: hit.id,
        pattern: hit.payload.content,
        timestamp: hit.payload.timestamp
    }));

    // Cache the results
    cacheUtils.setCached(patternCache, cacheKey, formattedResults);

    return formattedResults;
}

/**
 * Update or add system patterns
 * @param {string} projectName - Name of the project
 * @param {Array} patterns - Array of pattern strings to add/update
 * @returns {Array} Array of logged pattern IDs
 */
async function updateSystemPatterns(projectName, patterns) {
    if (!Array.isArray(patterns) || patterns.length === 0) {
        throw new Error("Patterns must be a non-empty array");
    }

    const collectionName = await initMemoryBank(projectName);
    const ids = [];

    for (const pattern of patterns) {
        const vectors = await getCachedEmbeddings([pattern]);
        const vector = vectors[0];

        const pointId = uuidv4();
        const point = {
            id: pointId,
            vector,
            payload: {
                type: SYSTEM_PATTERN_TYPE,
                content: pattern,
                timestamp: new Date().toISOString(),
                project: projectName
            }
        };

        await client.upsert(collectionName, { points: [point] });
        ids.push(pointId);
    }

    // Invalidate pattern cache
    const cacheKey = cacheKeys.systemPatterns(projectName);
    patternCache.cache.delete(cacheKey);

    return ids;
}

/**
 * Search system patterns using semantic search
 * @param {string} projectName - Name of the project
 * @param {string} queryText - Query for finding relevant patterns
 * @param {number} limit - Maximum number of results to return
 * @returns {Array} Array of matching patterns with scores
 */
async function searchSystemPatterns(projectName, queryText, limit = 10) {
    const collectionName = `memory_bank_${projectName}`;

    const vector = (await getEmbeddingProvider().embedTexts([queryText]))[0];

    const results = await client.search(collectionName, {
        vector,
        limit: limit,
        filter: {
            must: [
                { key: "project", match: { value: projectName } },
                { key: "type", match: { value: SYSTEM_PATTERN_TYPE } }
            ]
        }
    });

    return results.map(hit => ({
        id: hit.id,
        pattern: hit.payload.content,
        score: hit.score,
        timestamp: hit.payload.timestamp
    }));
}

// ----- Progress tracking with status updates -----

/**
 * Get progress entries with status information
 * @param {string} projectName - Name of the project
 * @param {string} status - Optional status filter ('pending', 'in_progress', 'completed', 'blocked')
 * @param {number} limit - Maximum number of entries to return
 * @returns {Array} Array of progress entries with status
 */
async function getProgressWithStatus(projectName, status = null, limit = 50) {
    const collectionName = `memory_bank_${projectName}`;

    const mustFilter = [
        { key: "project", match: { value: projectName } },
        { key: "type", match: { value: PROGRESS_TYPE } }
    ];

    if (status) {
        mustFilter.push({ key: "status", match: { value: status } });
    }

    const results = await client.search(collectionName, {
        vector: (await getEmbeddingProvider().embedTexts(["progress tracking"]))[0],
        limit: limit,
        filter: { must: mustFilter }
    });

    return results.map(hit => ({
        id: hit.id,
        content: hit.payload.content,
        status: hit.payload.status || "unknown",
        category: hit.payload.category || "general",
        priority: hit.payload.priority || "medium",
        timestamp: hit.payload.timestamp
    }));
}

/**
 * Update progress with status tracking
 * @param {string} projectName - Name of the project
 * @param {string} content - Progress content
 * @param {string} status - Status ('pending', 'in_progress', 'completed', 'blocked')
 * @param {string} category - Category of the progress item
 * @param {string} priority - Priority level ('low', 'medium', 'high', 'critical')
 * @returns {string} ID of the logged progress entry
 */
async function updateProgressWithStatus(projectName, content, status = "in_progress", category = "general", priority = "medium") {
    const collectionName = await initMemoryBank(projectName);

    const vector = (await getEmbeddingProvider().embedTexts([content]))[0];

    const pointId = uuidv4();
    const point = {
        id: pointId,
        vector,
        payload: {
            type: PROGRESS_TYPE,
            content,
            status,
            category,
            priority,
            timestamp: new Date().toISOString(),
            project: projectName
        }
    };

    await client.upsert(collectionName, { points: [point] });
    return pointId;
}

/**
 * Search progress entries using semantic search
 * @param {string} projectName - Name of the project
 * @param {string} queryText - Query for finding relevant progress entries
 * @param {string} status - Optional status filter
 * @param {number} limit - Maximum number of results to return
 * @returns {Array} Array of matching progress entries with scores
 */
async function searchProgressEntries(projectName, queryText, status = null, limit = 10) {
    const collectionName = `memory_bank_${projectName}`;

    const vector = (await getEmbeddingProvider().embedTexts([queryText]))[0];

    const mustFilter = [
        { key: "project", match: { value: projectName } },
        { key: "type", match: { value: PROGRESS_TYPE } }
    ];

    if (status) {
        mustFilter.push({ key: "status", match: { value: status } });
    }

    const results = await client.search(collectionName, {
        vector,
        limit: limit,
        filter: { must: mustFilter }
    });

    return results.map(hit => ({
        id: hit.id,
        content: hit.payload.content,
        status: hit.payload.status || "unknown",
        category: hit.payload.category || "general",
        priority: hit.payload.priority || "medium",
        score: hit.score,
        timestamp: hit.payload.timestamp
    }));
}

// ----- Custom data storage -----

/**
 * Store custom data with metadata
 * @param {string} projectName - Name of the project
 * @param {any} data - The custom data to store
 * @param {string} dataType - Type/category of the custom data
 * @param {object} metadata - Additional metadata (optional)
 * @returns {string} ID of the stored data
 */
async function storeCustomData(projectName, data, dataType, metadata = {}) {
    const collectionName = await initMemoryBank(projectName);

    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const vector = (await getEmbeddingProvider().embedTexts([dataString]))[0];

    const pointId = metadata.id || uuidv4();
    const point = {
        id: pointId,
        vector,
        payload: {
            type: CUSTOM_DATA_TYPE,
            dataType,
            data: dataString,
            metadata: JSON.stringify(metadata),
            timestamp: new Date().toISOString(),
            project: projectName,
            customDataId: pointId
        }
    };

    await client.upsert(collectionName, { points: [point] });
    return pointId;
}

/**
 * Get custom data by ID
 * @param {string} projectName - Name of the project
 * @param {string} dataId - ID of the custom data
 * @returns {object|null} The custom data object or null if not found
 */
async function getCustomData(projectName, dataId) {
    try {
        // Use queryCustomData to get all custom data, then filter by ID
        const allCustomData = await queryCustomData(projectName, null, {}, 100); // Get up to 100 items

        // Find the specific item by ID
        const foundItem = allCustomData.find(item => item.id === dataId);

        // Debug: log what we found
        console.log(`getCustomData: looking for ${dataId}, found ${allCustomData.length} items, match: ${!!foundItem}`);

        return foundItem || null;
    } catch (error) {
        // Fallback: return null when Qdrant is unavailable
        console.warn(`Qdrant unavailable for getCustomData: ${error.message}`);
        return null;
    }
}

/**
 * Query custom data with filters
 * @param {string} projectName - Name of the project
 * @param {string} dataType - Optional data type filter
 * @param {object} metadataFilter - Optional metadata filters
 * @param {number} limit - Maximum number of results
 * @returns {Array} Array of custom data objects
 */
async function queryCustomData(projectName, dataType = null, metadataFilter = {}, limit = 50) {
    const collectionName = `memory_bank_${projectName}`;

    const mustFilter = [
        { key: "project", match: { value: projectName } },
        { key: "type", match: { value: CUSTOM_DATA_TYPE } }
    ];

    if (dataType) {
        mustFilter.push({ key: "dataType", match: { value: dataType } });
    }

    // Note: Complex metadata filtering would require more advanced payload structure
    // For now, we'll use basic filtering

    const results = await client.search(collectionName, {
        vector: (await getEmbeddingProvider().embedTexts(["custom data query"]))[0],
        limit: limit,
        filter: { must: mustFilter }
    });

    return results.map(hit => {
        let parsedData;
        try {
            parsedData = JSON.parse(hit.payload.data);
        } catch (e) {
            parsedData = hit.payload.data;
        }

        let parsedMetadata = {};
        try {
            parsedMetadata = JSON.parse(hit.payload.metadata);
        } catch (e) {
            // metadata might not be JSON
        }

        return {
            id: hit.id,
            dataType: hit.payload.dataType,
            data: parsedData,
            metadata: parsedMetadata,
            timestamp: hit.payload.timestamp
        };
    });
}

/**
 * Search custom data using semantic search
 * @param {string} projectName - Name of the project
 * @param {string} queryText - Query for finding relevant custom data
 * @param {string} dataType - Optional data type filter
 * @param {number} limit - Maximum number of results
 * @returns {Array} Array of matching custom data with scores
 */
async function searchCustomData(projectName, queryText, dataType = null, limit = 10) {
    const collectionName = `memory_bank_${projectName}`;

    const vector = (await getEmbeddingProvider().embedTexts([queryText]))[0];

    const mustFilter = [
        { key: "project", match: { value: projectName } },
        { key: "type", match: { value: CUSTOM_DATA_TYPE } }
    ];

    if (dataType) {
        mustFilter.push({ key: "dataType", match: { value: dataType } });
    }

    const results = await client.search(collectionName, {
        vector,
        limit: limit,
        filter: { must: mustFilter }
    });

    return results.map(hit => {
        let parsedData;
        try {
            parsedData = JSON.parse(hit.payload.data);
        } catch (e) {
            parsedData = hit.payload.data;
        }

        let parsedMetadata = {};
        try {
            parsedMetadata = JSON.parse(hit.payload.metadata);
        } catch (e) {
            // metadata might not be JSON
        }

        return {
            id: hit.id,
            dataType: hit.payload.dataType,
            data: parsedData,
            metadata: parsedMetadata,
            score: hit.score,
            timestamp: hit.payload.timestamp
        };
    });
}

/**
 * Update custom data
 * @param {string} projectName - Name of the project
 * @param {string} dataId - ID of the data to update
 * @param {any} newData - New data to store
 * @param {object} newMetadata - Updated metadata (optional)
 * @returns {boolean} Success status
 */
async function updateCustomData(projectName, dataId, newData, newMetadata = {}) {
    const collectionName = `memory_bank_${projectName}`;

    const dataString = typeof newData === 'string' ? newData : JSON.stringify(newData);
    const vector = (await getEmbeddingProvider().embedTexts([dataString]))[0];

    const point = {
        id: dataId,
        vector,
        payload: {
            type: CUSTOM_DATA_TYPE,
            data: dataString,
            metadata: JSON.stringify(newMetadata),
            timestamp: new Date().toISOString(),
            project: projectName,
            customDataId: dataId
        }
    };

    await client.upsert(collectionName, { points: [point] });
    return true;
}

/**
 * Initialize workspace and detect project structure
 * @param {string} projectName - Name of the project
 * @param {object} workspaceInfo - Workspace information (optional)
 * @returns {object} Initialization result with detected workspace structure
 */
async function initializeWorkspace(projectName, workspaceInfo = {}) {
    try {
        const collectionName = await initMemoryBank(projectName);

        // Detect workspace structure
        const workspaceStructure = {
            projectName,
            detectedFiles: workspaceInfo.files || [],
            detectedDirectories: workspaceInfo.directories || [],
            language: detectProjectLanguage(workspaceInfo),
            framework: detectFramework(workspaceInfo),
            timestamp: new Date().toISOString()
        };

        // Store workspace detection result
        const workspaceData = JSON.stringify(workspaceStructure);
        const vector = (await getEmbeddingProvider().embedTexts([workspaceData]))[0];

        const pointId = uuidv4();
        const point = {
            id: pointId,
            vector,
            payload: {
                type: "workspaceInit",
                content: workspaceData,
                project: projectName,
                timestamp: new Date().toISOString()
            }
        };

        await client.upsert(collectionName, { points: [point] });

        // Initialize basic memory contexts if they don't exist
        await initializeBasicContexts(projectName);

        return {
            workspaceId: pointId,
            structure: workspaceStructure,
            initialized: true
        };
    } catch (error) {
        // Fallback: return workspace structure without storing when Qdrant is unavailable
        console.warn(`Qdrant unavailable for initializeWorkspace: ${error.message}`);

        const workspaceStructure = {
            projectName,
            detectedFiles: workspaceInfo.files || [],
            detectedDirectories: workspaceInfo.directories || [],
            language: detectProjectLanguage(workspaceInfo),
            framework: detectFramework(workspaceInfo),
            timestamp: new Date().toISOString()
        };

        return {
            workspaceId: null,
            structure: workspaceStructure,
            initialized: false,
            error: "Qdrant unavailable"
        };
    }
}

/**
 * Detect project language from file extensions
 * @param {object} workspaceInfo - Workspace information
 * @returns {string} Detected language
 */
function detectProjectLanguage(workspaceInfo) {
    const files = workspaceInfo.files || [];
    const extensions = files.map(f => f.split('.').pop()).filter(Boolean);

    const languageMap = {
        'js': 'JavaScript',
        'ts': 'TypeScript',
        'py': 'Python',
        'java': 'Java',
        'cpp': 'C++',
        'c': 'C',
        'cs': 'C#',
        'php': 'PHP',
        'rb': 'Ruby',
        'go': 'Go',
        'rs': 'Rust'
    };

    for (const ext of extensions) {
        if (languageMap[ext]) {
            return languageMap[ext];
        }
    }

    return 'Unknown';
}

/**
 * Detect framework from common files/directories
 * @param {object} workspaceInfo - Workspace information
 * @returns {string} Detected framework
 */
function detectFramework(workspaceInfo) {
    const files = workspaceInfo.files || [];
    const directories = workspaceInfo.directories || [];

    // Node.js frameworks
    if (files.includes('package.json')) {
        if (files.includes('next.config.js') || directories.includes('pages') || directories.includes('app')) {
            return 'Next.js';
        }
        if (files.includes('nuxt.config.js')) {
            return 'Nuxt.js';
        }
        if (directories.includes('src') && files.includes('angular.json')) {
            return 'Angular';
        }
        if (files.includes('vue.config.js') || directories.includes('src') && files.some(f => f.includes('vue'))) {
            return 'Vue.js';
        }
        return 'Node.js';
    }

    // Python frameworks
    if (files.includes('requirements.txt') || files.includes('setup.py')) {
        if (directories.includes('migrations') && files.includes('manage.py')) {
            return 'Django';
        }
        if (files.includes('app.py') && directories.includes('templates')) {
            return 'Flask';
        }
        return 'Python';
    }

    // .NET
    if (files.some(f => f.endsWith('.csproj'))) {
        return '.NET';
    }

    return 'Unknown';
}

/**
 * Initialize basic memory contexts for a new project
 * @param {string} projectName - Name of the project
 */
async function initializeBasicContexts(projectName) {
    // Check if contexts already exist
    const existingProductContext = await getStructuredContext(projectName, 'productContext');
    const existingActiveContext = await getStructuredContext(projectName, 'activeContext');

    if (!existingProductContext || Object.keys(existingProductContext).length === 0) {
        await logStructuredMemory(projectName, 'productContext', {
            projectName,
            description: `Project ${projectName} initialized`,
            goals: [],
            features: [],
            technologies: [],
            status: 'initialized'
        });
    }

    if (!existingActiveContext || Object.keys(existingActiveContext).length === 0) {
        await logStructuredMemory(projectName, 'activeContext', {
            currentFocus: `Project ${projectName} workspace initialized`,
            recentChanges: ['Workspace detection completed'],
            openQuestions: [],
            nextSteps: ['Configure project settings', 'Set up development environment']
        });
    }
}

/**
 * Sync memory with external sources (proactive logging)
 * @param {string} projectName - Name of the project
 * @param {Array} syncSources - Array of sync source configurations
 * @returns {object} Sync results
 */
async function syncMemory(projectName, syncSources = []) {
    const syncResults = {
        timestamp: new Date().toISOString(),
        sources: [],
        totalEntries: 0,
        errors: []
    };

    for (const source of syncSources) {
        try {
            const result = await syncFromSource(projectName, source);
            syncResults.sources.push({
                source: source.name,
                entries: result.entries,
                success: true
            });
            syncResults.totalEntries += result.entries;
        } catch (error) {
            syncResults.errors.push({
                source: source.name,
                error: error.message
            });
        }
    }

    // Log sync operation
    await logMemory(projectName, 'systemPatterns', `Memory sync completed: ${syncResults.totalEntries} entries from ${syncResults.sources.length} sources`);

    return syncResults;
}

/**
 * Sync from a specific source (placeholder for external integrations)
 * @param {string} projectName - Name of the project
 * @param {object} source - Source configuration
 * @returns {object} Sync result for this source
 */
async function syncFromSource(projectName, source) {
    // This is a placeholder for actual sync implementations
    // Could be GitHub issues, Jira tickets, Slack messages, etc.

    const entries = [];

    // Example: sync from Git commits (placeholder)
    if (source.type === 'git') {
        // Placeholder - would actually fetch git history
        entries.push({
            type: 'progress',
            content: `Synced git history from ${source.repository}`,
            category: 'development'
        });
    }

    // Log the entries
    if (entries.length > 0) {
        await batchLogMemory(projectName, entries.map(entry => ({
            memoryType: entry.type,
            content: entry.content
        })));
    }

    return { entries: entries.length };
}

/**
 * Export memory data to markdown format
 * @param {string} projectName - Name of the project
 * @param {Array} memoryTypes - Types of memory to export
 * @returns {string} Markdown formatted export
 */
async function exportMemoryToMarkdown(projectName, memoryTypes = null) {
    try {
        const exportData = {
            projectName,
            exportDate: new Date().toISOString(),
            sections: {}
        };

        const typesToExport = memoryTypes || ['productContext', 'activeContext', 'systemPatterns', 'decisionLog', 'progress'];

        for (const type of typesToExport) {
            if (STRUCTURED_CONTEXT_TYPES.includes(type)) {
                const context = await getStructuredContext(projectName, type);
                exportData.sections[type] = context;
            } else {
                // For non-structured types, get recent entries
                const results = await queryMemory(projectName, type, type, 50);
                exportData.sections[type] = results.map(r => ({
                    content: r.content,
                    timestamp: r.timestamp
                }));
            }
        }

        // Convert to markdown
        return convertToMarkdown(exportData);
    } catch (error) {
        // Fallback: return basic markdown when Qdrant is unavailable
        console.warn(`Qdrant unavailable for exportMemoryToMarkdown: ${error.message}`);

        const exportData = {
            projectName,
            exportDate: new Date().toISOString(),
            sections: {
                error: "Qdrant database unavailable for export"
            }
        };

        return convertToMarkdown(exportData);
    }
}

/**
 * Import memory data from markdown
 * @param {string} projectName - Name of the project
 * @param {string} markdownContent - Markdown content to import
 * @returns {object} Import results
 */
async function importMemoryFromMarkdown(projectName, markdownContent) {
    const importResults = {
        imported: 0,
        errors: [],
        timestamp: new Date().toISOString()
    };

    try {
        const parsedData = parseMarkdownToMemory(markdownContent);

        for (const [type, entries] of Object.entries(parsedData.sections)) {
            if (STRUCTURED_CONTEXT_TYPES.includes(type)) {
                await logStructuredMemory(projectName, type, entries);
                importResults.imported++;
            } else {
                // Import as regular memory entries
                for (const entry of entries) {
                    await logMemory(projectName, type, entry.content);
                    importResults.imported++;
                }
            }
        }
    } catch (error) {
        importResults.errors.push(error.message);
    }

    return importResults;
}

/**
 * Convert memory data to markdown format
 * @param {object} exportData - Data to convert
 * @returns {string} Markdown string
 */
function convertToMarkdown(exportData) {
    let markdown = `# Memory Export - ${exportData.projectName}\n\n`;
    markdown += `**Export Date:** ${new Date(exportData.exportDate).toLocaleString()}\n\n`;

    for (const [section, data] of Object.entries(exportData.sections)) {
        markdown += `## ${section.charAt(0).toUpperCase() + section.slice(1)}\n\n`;

        if (Array.isArray(data)) {
            data.forEach((item, index) => {
                markdown += `### Entry ${index + 1}\n`;
                markdown += `${item.content}\n\n`;
                if (item.timestamp) {
                    markdown += `*${new Date(item.timestamp).toLocaleString()}*\n\n`;
                }
            });
        } else if (typeof data === 'object') {
            for (const [key, value] of Object.entries(data)) {
                markdown += `### ${key}\n`;
                if (Array.isArray(value)) {
                    markdown += value.map(v => `- ${v}`).join('\n') + '\n\n';
                } else {
                    markdown += `${value}\n\n`;
                }
            }
        }

        markdown += '---\n\n';
    }

    return markdown;
}

/**
 * Parse markdown back to memory structure
 * @param {string} markdown - Markdown content
 * @returns {object} Parsed memory data
 */
function parseMarkdownToMemory(markdown) {
    // Simple markdown parser - would need more sophisticated parsing for complex structures
    const sections = {};
    const lines = markdown.split('\n');
    let currentSection = null;
    let currentEntry = null;

    for (const line of lines) {
        if (line.startsWith('## ')) {
            currentSection = line.substring(3).toLowerCase().replace(/\s+/g, '');
            sections[currentSection] = [];
        } else if (line.startsWith('### ') && currentSection) {
            currentEntry = {};
            sections[currentSection].push(currentEntry);
        } else if (currentEntry && line.trim()) {
            if (!currentEntry.content) {
                currentEntry.content = line;
            } else {
                currentEntry.content += '\n' + line;
            }
        }
    }

    return { sections };
}

/**
 * Analyze conversation and automatically log relevant information
 * @param {string} projectName - Name of the project
 * @param {string} conversationText - Conversation text to analyze
 * @param {object} metadata - Additional metadata about the conversation
 * @returns {object} Analysis results
 */
async function analyzeConversation(projectName, conversationText, metadata = {}) {
    const analysisResults = {
        decisions: [],
        progress: [],
        questions: [],
        insights: [],
        timestamp: new Date().toISOString()
    };

    // Simple pattern matching for conversation analysis
    const lines = conversationText.split('\n');

    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        // Detect decisions
        if (lowerLine.includes('decided') || lowerLine.includes('decision') || lowerLine.includes('will')) {
            analysisResults.decisions.push({
                content: line.trim(),
                confidence: 0.8
            });
        }

        // Detect progress updates
        if (lowerLine.includes('completed') || lowerLine.includes('finished') || lowerLine.includes('done')) {
            analysisResults.progress.push({
                content: line.trim(),
                status: 'completed'
            });
        }

        // Detect questions
        if (line.includes('?') || lowerLine.includes('what') || lowerLine.includes('how') || lowerLine.includes('why')) {
            analysisResults.questions.push(line.trim());
        }

        // Detect insights or important information
        if (lowerLine.includes('important') || lowerLine.includes('note') || lowerLine.includes('remember')) {
            analysisResults.insights.push(line.trim());
        }
    }

    // Log the analysis results
    const entries = [];

    analysisResults.decisions.forEach(decision => {
        entries.push({
            memoryType: 'decisionLog',
            content: decision.content
        });
    });

    analysisResults.progress.forEach(progress => {
        entries.push({
            memoryType: 'progress',
            content: progress.content
        });
    });

    analysisResults.questions.forEach(question => {
        entries.push({
            memoryType: 'activeContext',
            content: `Question: ${question}`
        });
    });

    analysisResults.insights.forEach(insight => {
        entries.push({
            memoryType: 'systemPatterns',
            content: insight
        });
    });

    if (entries.length > 0) {
        await batchLogMemory(projectName, entries);
    }

    // Store the conversation analysis itself
    await storeCustomData(projectName, analysisResults, 'conversationAnalysis', {
        conversationId: metadata.conversationId,
        participants: metadata.participants,
        source: metadata.source
    });

    return analysisResults;
}

/**
 * Get cache performance statistics
 * @returns {object} Cache statistics
 */
function getCacheStats() {
    return cacheUtils.getStats();
}

export {
    logMemory,
    queryMemory,
    logStructuredMemory,
    getStructuredContext,
    updateStructuredContext,
    getDecisions,
    searchDecisionsFTS,
    semanticSearch,
    createKnowledgeLink,
    getKnowledgeLinks,
    getContextHistory,
    batchLogMemory,
    batchQueryMemory,
    batchUpdateStructuredContext,
    getSystemPatterns,
    updateSystemPatterns,
    searchSystemPatterns,
    getProgressWithStatus,
    updateProgressWithStatus,
    searchProgressEntries,
    storeCustomData,
    getCustomData,
    queryCustomData,
    searchCustomData,
    updateCustomData,
    initializeWorkspace,
    syncMemory,
    exportMemoryToMarkdown,
    importMemoryFromMarkdown,
    analyzeConversation,
    getCacheStats
};
