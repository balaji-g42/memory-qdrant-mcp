import { z } from "zod";
import {
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
    initializeWorkspace,
    syncMemory,
    exportMemoryToMarkdown,
    importMemoryFromMarkdown,
    analyzeConversation
} from "./memoryBankTools.js";

// Structured context tool implementations for ConPort-style memory management

/**
 * Get product context for a project
 */
async function getProductContext(projectName) {
    return await getStructuredContext(projectName, "productContext");
}

/**
 * Update product context for a project
 */
async function updateProductContext(projectName, content, patchContent) {
    if (patchContent) {
        return await updateStructuredContext(projectName, "productContext", patchContent);
    } else if (content) {
        return await logStructuredMemory(projectName, "productContext", content);
    } else {
        throw new Error("Either content or patchContent must be provided");
    }
}

/**
 * Get active context for a project
 */
async function getActiveContext(projectName) {
    return await getStructuredContext(projectName, "activeContext");
}

/**
 * Update active context for a project
 */
async function updateActiveContext(projectName, content, patchContent) {
    if (patchContent) {
        return await updateStructuredContext(projectName, "activeContext", patchContent);
    } else if (content) {
        return await logStructuredMemory(projectName, "activeContext", content);
    } else {
        throw new Error("Either content or patchContent must be provided");
    }
}

/**
 * Log a decision with structured format
 */
async function logDecisionStructured(projectName, summary, rationale, tags = []) {
    const decisionContent = {
        summary,
        rationale,
        tags,
        timestamp: new Date().toISOString()
    };

    return await logStructuredMemory(projectName, "decisionLog", decisionContent);
}

/**
 * Get decisions with structured format
 */
async function getDecisionsStructured(projectName, limit = 10, tags_filter_include_all = [], tags_filter_include_any = []) {
    // For now, return basic decisions - tags filtering would need more complex implementation
    return await getDecisions(projectName, limit, tags_filter_include_all, tags_filter_include_any);
}

/**
 * Search decisions using full-text search
 */
async function searchDecisionsFTSStructured(projectName, queryTerm, limit = 10) {
    return await searchDecisionsFTS(projectName, queryTerm, limit);
}

/**
 * Perform semantic search across all memory types
 */
async function semanticSearchStructured(projectName, queryText, limit = 10, memoryTypes = null) {
    return await semanticSearch(projectName, queryText, limit, memoryTypes);
}

/**
 * Create a knowledge link between two entities
 */
async function createKnowledgeLinkStructured(projectName, sourceId, targetId, linkType, description = "") {
    return await createKnowledgeLink(projectName, sourceId, targetId, linkType, description);
}

/**
 * Get knowledge links for an entity
 */
async function getKnowledgeLinksStructured(projectName, entityId, linkType = null, direction = "both") {
    return await getKnowledgeLinks(projectName, entityId, linkType, direction);
}

/**
 * Get history of changes for a context type
 */
async function getContextHistoryStructured(projectName, contextType, limit = 10) {
    return await getContextHistory(projectName, contextType, limit);
}

/**
 * Batch log multiple memory entries
 */
async function batchLogMemoryStructured(projectName, entries) {
    return await batchLogMemory(projectName, entries);
}

/**
 * Batch query memory with multiple queries
 */
async function batchQueryMemoryStructured(projectName, queries) {
    return await batchQueryMemory(projectName, queries);
}

/**
 * Batch update multiple structured contexts
 */
async function batchUpdateStructuredContextStructured(projectName, updates) {
    return await batchUpdateStructuredContext(projectName, updates);
}

/**
 * Get system patterns for a project
 */
async function getSystemPatternsStructured(projectName, limit = 50) {
    return await getSystemPatterns(projectName, limit);
}

/**
 * Update system patterns for a project
 */
async function updateSystemPatternsStructured(projectName, patterns) {
    return await updateSystemPatterns(projectName, patterns);
}

/**
 * Search system patterns using semantic search
 */
async function searchSystemPatternsStructured(projectName, queryText, limit = 10) {
    return await searchSystemPatterns(projectName, queryText, limit);
}

/**
 * Get progress entries with status information
 */
async function getProgressWithStatusStructured(projectName, status = null, limit = 50) {
    return await getProgressWithStatus(projectName, status, limit);
}

/**
 * Update progress with status tracking
 */
async function updateProgressWithStatusStructured(projectName, content, status = "in_progress", category = "general", priority = "medium") {
    return await updateProgressWithStatus(projectName, content, status, category, priority);
}

/**
 * Search progress entries using semantic search
 */
async function searchProgressEntriesStructured(projectName, queryText, status = null, limit = 10) {
    return await searchProgressEntries(projectName, queryText, status, limit);
}

/**
 * Store custom data with metadata
 */
async function storeCustomDataStructured(projectName, data, dataType, metadata = {}) {
    return await storeCustomData(projectName, data, dataType, metadata);
}

/**
 * Get custom data by ID
 */
async function getCustomDataStructured(projectName, dataId) {
    return await getCustomData(projectName, dataId);
}

/**
 * Query custom data with filters
 */
async function queryCustomDataStructured(projectName, dataType = null, metadataFilter = {}, limit = 50) {
    return await queryCustomData(projectName, dataType, metadataFilter, limit);
}

/**
 * Search custom data using semantic search
 */
async function searchCustomDataStructured(projectName, queryText, dataType = null, limit = 10) {
    return await searchCustomData(projectName, queryText, dataType, limit);
}

/**
 * Update custom data
 */
async function updateCustomDataStructured(projectName, dataId, newData, newMetadata = {}) {
    return await updateCustomData(projectName, dataId, newData, newMetadata);
}

/**
 * Initialize workspace and detect project structure
 */
async function initializeWorkspaceStructured(projectName, workspaceInfo = {}) {
    return await initializeWorkspace(projectName, workspaceInfo);
}

/**
 * Sync memory with external sources (proactive logging)
 */
async function syncMemoryStructured(projectName, syncSources = []) {
    return await syncMemory(projectName, syncSources);
}

/**
 * Export memory data to markdown format
 */
async function exportMemoryToMarkdownStructured(projectName, memoryTypes = null) {
    return await exportMemoryToMarkdown(projectName, memoryTypes);
}

/**
 * Import memory data from markdown
 */
async function importMemoryFromMarkdownStructured(projectName, markdownContent) {
    return await importMemoryFromMarkdown(projectName, markdownContent);
}

/**
 * Analyze conversation and automatically log relevant information
 */
async function analyzeConversationStructured(projectName, conversationText, metadata = {}) {
    return await analyzeConversation(projectName, conversationText, metadata);
}

export {
    getProductContext,
    updateProductContext,
    getActiveContext,
    updateActiveContext,
    logDecisionStructured,
    getDecisionsStructured,
    searchDecisionsFTSStructured,
    semanticSearchStructured,
    createKnowledgeLinkStructured,
    getKnowledgeLinksStructured,
    getContextHistoryStructured,
    batchLogMemoryStructured,
    batchQueryMemoryStructured,
    batchUpdateStructuredContextStructured,
    getSystemPatternsStructured,
    updateSystemPatternsStructured,
    searchSystemPatternsStructured,
    getProgressWithStatusStructured,
    updateProgressWithStatusStructured,
    searchProgressEntriesStructured,
    storeCustomDataStructured,
    getCustomDataStructured,
    queryCustomDataStructured,
    searchCustomDataStructured,
    updateCustomDataStructured,
    initializeWorkspaceStructured,
    syncMemoryStructured,
    exportMemoryToMarkdownStructured,
    importMemoryFromMarkdownStructured,
    analyzeConversationStructured
};