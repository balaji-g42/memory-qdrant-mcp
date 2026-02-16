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
    analyzeConversation
} from "./memoryBankTools.js";
import type { 
    BatchLogEntry, 
    BatchQuery, 
    BatchContextUpdate, 
    SyncSource, 
    ConversationMetadata, 
    WorkspaceInfo,
    ProgressStatus,
    Priority,
    LinkDirection
} from "../types.js";

// Structured context tool implementations for ConPort-style memory management

/**
 * Get product context for a project
 */
async function getProductContext(projectName: string): Promise<any> {
    return await getStructuredContext(projectName, "productContext");
}

/**
 * Update product context for a project
 */
async function updateProductContext(projectName: string, content?: Record<string, any>, patchContent?: Record<string, any>): Promise<string> {
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
async function getActiveContext(projectName: string): Promise<any> {
    return await getStructuredContext(projectName, "activeContext");
}

/**
 * Update active context for a project
 */
async function updateActiveContext(projectName: string, content?: Record<string, any>, patchContent?: Record<string, any>): Promise<string> {
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
async function logDecisionStructured(projectName: string, summary: string, rationale: string, tags: string[] = []): Promise<string> {
    const decisionContent = {
        summary,
        rationale,
        tags,
        timestamp: new Date().toISOString()
    };

    return await logStructuredMemory(projectName, "decisionLog" as any, decisionContent);
}

/**
 * Get decisions with structured format
 */
async function getDecisionsStructured(
    projectName: string, 
    limit: number = 10, 
    tags_filter_include_all: string[] = [], 
    tags_filter_include_any: string[] = []
): Promise<any[]> {
    // For now, return basic decisions - tags filtering would need more complex implementation
    return await getDecisions(projectName, limit, tags_filter_include_all, tags_filter_include_any);
}

/**
 * Search decisions using full-text search
 */
async function searchDecisionsFTSStructured(projectName: string, queryTerm: string, limit: number = 10): Promise<any[]> {
    return await searchDecisionsFTS(projectName, queryTerm, limit);
}

/**
 * Perform semantic search across all memory types
 */
async function semanticSearchStructured(
    projectName: string, 
    queryText: string, 
    limit: number = 10, 
    memoryTypes: string[] | null = null
): Promise<any[]> {
    return await semanticSearch(projectName, queryText, limit, memoryTypes);
}

/**
 * Create a knowledge link between two entities
 */
async function createKnowledgeLinkStructured(
    projectName: string, 
    sourceId: string, 
    targetId: string, 
    linkType: string, 
    description: string = ""
): Promise<string> {
    return await createKnowledgeLink(projectName, sourceId, targetId, linkType, description);
}

/**
 * Get knowledge links for an entity
 */
async function getKnowledgeLinksStructured(
    projectName: string, 
    entityId: string, 
    linkType: string | null = null, 
    direction: LinkDirection = "both"
): Promise<any[]> {
    return await getKnowledgeLinks(projectName, entityId, linkType, direction);
}

/**
 * Get history of changes for a context type
 */
async function getContextHistoryStructured(projectName: string, contextType: string, limit: number = 10): Promise<any[]> {
    return await getContextHistory(projectName, contextType as any, limit);
}

/**
 * Batch log multiple memory entries
 */
async function batchLogMemoryStructured(projectName: string, entries: BatchLogEntry[]): Promise<string[]> {
    return await batchLogMemory(projectName, entries);
}

/**
 * Batch query memory with multiple queries
 */
async function batchQueryMemoryStructured(projectName: string, queries: BatchQuery[]): Promise<any[][]> {
    return await batchQueryMemory(projectName, queries);
}

/**
 * Batch update multiple structured contexts
 */
async function batchUpdateStructuredContextStructured(projectName: string, updates: BatchContextUpdate[]): Promise<string[]> {
    return await batchUpdateStructuredContext(projectName, updates);
}

/**
 * Get system patterns for a project
 */
async function getSystemPatternsStructured(projectName: string, limit: number = 50): Promise<any[]> {
    return await getSystemPatterns(projectName, limit);
}

/**
 * Update system patterns for a project
 */
async function updateSystemPatternsStructured(projectName: string, patterns: string[]): Promise<string[]> {
    return await updateSystemPatterns(projectName, patterns);
}

/**
 * Search system patterns using semantic search
 */
async function searchSystemPatternsStructured(projectName: string, queryText: string, limit: number = 10): Promise<any[]> {
    return await searchSystemPatterns(projectName, queryText, limit);
}

/**
 * Get progress entries with status information
 */
async function getProgressWithStatusStructured(
    projectName: string, 
    status: ProgressStatus | null = null, 
    limit: number = 50
): Promise<any[]> {
    return await getProgressWithStatus(projectName, status, limit);
}

/**
 * Update progress with status tracking
 */
async function updateProgressWithStatusStructured(
    projectName: string, 
    content: string, 
    status: ProgressStatus = "in_progress", 
    category: string = "general", 
    priority: Priority = "medium"
): Promise<string> {
    return await updateProgressWithStatus(projectName, content, status, category, priority);
}

/**
 * Search progress entries using semantic search
 */
async function searchProgressEntriesStructured(
    projectName: string, 
    queryText: string, 
    status: ProgressStatus | null = null, 
    limit: number = 10
): Promise<any[]> {
    return await searchProgressEntries(projectName, queryText, status, limit);
}

/**
 * Store custom data with metadata
 */
async function storeCustomDataStructured(
    projectName: string, 
    data: any, 
    dataType: string, 
    metadata: Record<string, any> = {}
): Promise<string> {
    return await storeCustomData(projectName, data, dataType, metadata);
}

/**
 * Get custom data by ID
 */
async function getCustomDataStructured(projectName: string, dataId: string): Promise<any | null> {
    return await getCustomData(projectName, dataId);
}

/**
 * Query custom data with filters
 */
async function queryCustomDataStructured(
    projectName: string, 
    dataType: string | null = null, 
    metadataFilter: Record<string, any> = {}, 
    limit: number = 50
): Promise<any[]> {
    return await queryCustomData(projectName, dataType, metadataFilter, limit);
}

/**
 * Search custom data using semantic search
 */
async function searchCustomDataStructured(
    projectName: string, 
    queryText: string, 
    dataType: string | null = null, 
    limit: number = 10
): Promise<any[]> {
    return await searchCustomData(projectName, queryText, dataType, limit);
}

/**
 * Update custom data
 */
async function updateCustomDataStructured(
    projectName: string, 
    dataId: string, 
    newData: any, 
    newMetadata: Record<string, any> = {}
): Promise<boolean> {
    return await updateCustomData(projectName, dataId, newData, newMetadata);
}

/**
 * Initialize workspace and detect project structure
 */
async function initializeWorkspaceStructured(projectName: string, workspaceInfo: WorkspaceInfo = {}): Promise<any> {
    return await initializeWorkspace(projectName, workspaceInfo);
}

/**
 * Sync memory with external sources (proactive logging)
 */
async function syncMemoryStructured(projectName: string, syncSources: SyncSource[] = []): Promise<any> {
    return await syncMemory(projectName, syncSources);
}

/**
 * Export memory data to markdown format
 */
async function exportMemoryToMarkdownStructured(projectName: string, memoryTypes: string[] | null = null): Promise<string> {
    return await exportMemoryToMarkdown(projectName, memoryTypes as any);
}

/**
 * Import memory data from markdown
 */
async function importMemoryFromMarkdownStructured(projectName: string, markdownContent: string): Promise<any> {
    return await importMemoryFromMarkdown(projectName, markdownContent);
}

/**
 * Analyze conversation and automatically log relevant information
 */
async function analyzeConversationStructured(
    projectName: string, 
    conversationText: string, 
    metadata: ConversationMetadata = {}
): Promise<any> {
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
