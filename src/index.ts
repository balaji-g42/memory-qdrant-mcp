#!/usr/bin/env node

// Main entry point for MCP server
import "dotenv/config";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { logMemory, queryMemory } from "./mcp_tools/memoryBankTools.js";
import { logDecision, logProgress } from "./mcp_tools/store.js";
import { summarizeText } from "./mcp_tools/summarizer.js";
import {
    getProductContext,
    updateProductContext,
    getActiveContext,
    updateActiveContext,
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
} from "./mcp_tools/contextTools.js";

// Log uncaught errors so startup failures are visible
process.on("unhandledRejection", (reason) => {
    console.error("UnhandledRejection:", reason);
});
process.on("uncaughtException", (err) => {
    console.error("UncaughtException:", err);
    process.exit(1);
});

// Create McpServer instance
const server = new McpServer({
    name: "memory-qdrant-mcp",
    version: "2.0.0",
});

// Register all tools using McpServer.registerTool()

// Basic memory operations
server.registerTool('log_memory', {
    description: "Log a memory entry to the vector database",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        memory_type: z.string().describe("Type of memory (e.g., productContext, activeContext)"),
        content: z.string().describe("Content to log"),
        top_level_id: z.string().optional().describe("Optional top level ID")
    })
}, async (params) => {
    const memoryId = await logMemory(
        params.project_name,
        params.memory_type as any, // Cast to avoid strict type checking
        params.content,
        params.top_level_id
    );
    return {
        content: [{
            type: "text",
            text: `Memory logged with ID: ${memoryId}`
        }]
    };
});

server.registerTool('query_memory', {
    description: "Query memory entries from the vector database",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        query_text: z.string().describe("Query text"),
        memory_type: z.string().optional().describe("Optional memory type filter"),
        top_k: z.number().optional().default(3).describe("Number of results to return")
    })
}, async (params) => {
    const results = await queryMemory(
        params.project_name,
        params.query_text,
        params.memory_type,
        params.top_k
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(results, null, 2)
        }]
    };
});

server.registerTool('log_decision', {
    description: "Log a decision entry",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        decision_text: z.string().describe("Decision text"),
        top_level_id: z.string().optional().describe("Optional top level ID")
    })
}, async (params) => {
    const decisionId = await logDecision(
        params.project_name,
        params.decision_text,
        params.top_level_id
    );
    return {
        content: [{
            type: "text",
            text: `Decision logged with ID: ${decisionId}`
        }]
    };
});

server.registerTool('log_progress', {
    description: "Log a progress entry",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        progress_text: z.string().describe("Progress text"),
        top_level_id: z.string().optional().describe("Optional top level ID")
    })
}, async (params) => {
    const progressId = await logProgress(
        params.project_name,
        params.progress_text,
        params.top_level_id
    );
    return {
        content: [{
            type: "text",
            text: `Progress logged with ID: ${progressId}`
        }]
    };
});

server.registerTool('summarize_text', {
    description: "Summarize the given text",
    inputSchema: z.object({
        text: z.string().describe("Text to summarize")
    })
}, async (params) => {
    const summary = await summarizeText(params.text);
    return {
        content: [{
            type: "text",
            text: summary
        }]
    };
});

server.registerTool('query_memory_summarized', {
    description: "Query memory entries and return summarized results to reduce token usage",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        query_text: z.string().describe("Query text"),
        memory_type: z.string().optional().describe("Optional memory type filter"),
        top_k: z.number().optional().default(3).describe("Number of results to return")
    })
}, async (params) => {
    const results = await queryMemory(
        params.project_name,
        params.query_text,
        params.memory_type,
        params.top_k
    );
    const resultsText = JSON.stringify(results, null, 2);
    const summary = await summarizeText(resultsText);
    return {
        content: [{
            type: "text",
            text: summary
        }]
    };
});

// Context management tools
server.registerTool('get_product_context', {
    description: "Get the product context for a project",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project")
    })
}, async (params) => {
    const context = await getProductContext(params.project_name);
    return {
        content: [{
            type: "text",
            text: JSON.stringify(context, null, 2)
        }]
    };
});

server.registerTool('update_product_context', {
    description: "Update the product context for a project",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        content: z.record(z.string(), z.any()).optional().describe("Full content to replace"),
        patch_content: z.record(z.string(), z.any()).optional().describe("Partial content to merge")
    })
}, async (params) => {
    const resultId = await updateProductContext(
        params.project_name,
        params.content,
        params.patch_content
    );
    return {
        content: [{
            type: "text",
            text: `Product context updated with ID: ${resultId}`
        }]
    };
});

server.registerTool('get_active_context', {
    description: "Get the active context for a project",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project")
    })
}, async (params) => {
    const context = await getActiveContext(params.project_name);
    return {
        content: [{
            type: "text",
            text: JSON.stringify(context, null, 2)
        }]
    };
});

server.registerTool('update_active_context', {
    description: "Update the active context for a project",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        content: z.record(z.string(), z.any()).optional().describe("Full content to replace"),
        patch_content: z.record(z.string(), z.any()).optional().describe("Partial content to merge")
    })
}, async (params) => {
    const resultId = await updateActiveContext(
        params.project_name,
        params.content,
        params.patch_content
    );
    return {
        content: [{
            type: "text",
            text: `Active context updated with ID: ${resultId}`
        }]
    };
});

server.registerTool('get_decisions', {
    description: "Get decisions for a project",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        limit: z.number().optional().default(10).describe("Maximum number of decisions to return"),
        tags_filter_include_all: z.array(z.string()).optional().describe("Tags that must all be present"),
        tags_filter_include_any: z.array(z.string()).optional().describe("Tags where at least one must be present")
    })
}, async (params) => {
    const decisions = await getDecisionsStructured(
        params.project_name,
        params.limit,
        params.tags_filter_include_all,
        params.tags_filter_include_any
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(decisions, null, 2)
        }]
    };
});

server.registerTool('search_decisions_fts', {
    description: "Search decisions using full-text search",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        query_term: z.string().describe("Search query term"),
        limit: z.number().optional().default(10).describe("Maximum number of results to return")
    })
}, async (params) => {
    const results = await searchDecisionsFTSStructured(
        params.project_name,
        params.query_term,
        params.limit
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(results, null, 2)
        }]
    };
});

server.registerTool('semantic_search', {
    description: "Perform semantic search across all memory types using embeddings",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        query_text: z.string().describe("Natural language query for semantic search"),
        limit: z.number().optional().default(10).describe("Maximum number of results to return"),
        memory_types: z.array(z.string()).optional().describe("Optional filter for specific memory types")
    })
}, async (params) => {
    const results = await semanticSearchStructured(
        params.project_name,
        params.query_text,
        params.limit,
        params.memory_types
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(results, null, 2)
        }]
    };
});

// Knowledge graph tools
server.registerTool('create_knowledge_link', {
    description: "Create a knowledge link between two memory entities",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        source_id: z.string().describe("ID of the source entity"),
        target_id: z.string().describe("ID of the target entity"),
        link_type: z.string().describe("Type of relationship (e.g., 'related_to', 'depends_on', 'implements')"),
        metadata: z.record(z.string(), z.any()).optional().describe("Optional metadata for the link")
    })
}, async (params) => {
    const linkId = await createKnowledgeLinkStructured(
        params.project_name,
        params.source_id,
        params.target_id,
        params.link_type,
        params.metadata as any // Cast to match expected type
    );
    return {
        content: [{
            type: "text",
            text: `Knowledge link created with ID: ${linkId}`
        }]
    };
});

server.registerTool('get_knowledge_links', {
    description: "Get knowledge links for an entity",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        entity_id: z.string().describe("ID of the entity to get links for"),
        link_type: z.string().optional().describe("Optional filter by link type"),
        direction: z.enum(['outgoing', 'incoming', 'both']).optional().default('both').describe("Direction of links to retrieve")
    })
}, async (params) => {
    const links = await getKnowledgeLinksStructured(
        params.project_name,
        params.entity_id,
        params.link_type,
        params.direction
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(links, null, 2)
        }]
    };
});

server.registerTool('get_context_history', {
    description: "Get the history of context changes for a project",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        context_type: z.enum(['product', 'active']).describe("Type of context to get history for"),
        limit: z.number().optional().default(10).describe("Maximum number of history entries to return")
    })
}, async (params) => {
    const history = await getContextHistoryStructured(
        params.project_name,
        params.context_type,
        params.limit
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(history, null, 2)
        }]
    };
});

// Batch operations
server.registerTool('batch_log_memory', {
    description: "Log multiple memory entries at once",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        entries: z.array(z.object({
            memoryType: z.string(),
            content: z.string(),
            topLevelId: z.string().optional()
        })).describe("Array of memory entries to log")
    })
}, async (params) => {
    const ids = await batchLogMemoryStructured(params.project_name, params.entries as any);
    return {
        content: [{
            type: "text",
            text: `${ids.length} memory entries logged: ${JSON.stringify(ids, null, 2)}`
        }]
    };
});

server.registerTool('batch_query_memory', {
    description: "Query multiple memory entries at once",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        queries: z.array(z.object({
            queryText: z.string(),
            memoryType: z.string().optional(),
            topK: z.number().optional()
        })).describe("Array of queries to execute")
    })
}, async (params) => {
    const results = await batchQueryMemoryStructured(params.project_name, params.queries as any);
    return {
        content: [{
            type: "text",
            text: JSON.stringify(results, null, 2)
        }]
    };
});

server.registerTool('batch_update_context', {
    description: "Update multiple context types at once",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        updates: z.array(z.object({
            contextType: z.enum(['productContext', 'activeContext']),
            patchContent: z.record(z.string(), z.any())
        })).describe("Array of context updates")
    })
}, async (params) => {
    const results = await batchUpdateStructuredContextStructured(params.project_name, params.updates as any);
    return {
        content: [{
            type: "text",
            text: JSON.stringify(results, null, 2)
        }]
    };
});

// System patterns tools
server.registerTool('get_system_patterns', {
    description: "Get system patterns for a project",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        limit: z.number().optional().default(50).describe("Maximum number of patterns to return")
    })
}, async (params) => {
    const patterns = await getSystemPatternsStructured(params.project_name, params.limit);
    return {
        content: [{
            type: "text",
            text: JSON.stringify(patterns, null, 2)
        }]
    };
});

server.registerTool('update_system_patterns', {
    description: "Update system patterns for a project",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        patterns: z.array(z.string()).describe("Array of pattern strings to store")
    })
}, async (params) => {
    const resultIds = await updateSystemPatternsStructured(
        params.project_name,
        params.patterns
    );
    return {
        content: [{
            type: "text",
            text: `System patterns updated: ${JSON.stringify(resultIds, null, 2)}`
        }]
    };
});

server.registerTool('search_system_patterns', {
    description: "Search system patterns using semantic search",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        query_text: z.string().describe("Natural language query for semantic search"),
        limit: z.number().optional().default(10).describe("Maximum number of results to return")
    })
}, async (params) => {
    const results = await searchSystemPatternsStructured(
        params.project_name,
        params.query_text,
        params.limit
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(results, null, 2)
        }]
    };
});

// Progress tracking with status
server.registerTool('get_progress_with_status', {
    description: "Get progress entries filtered by status",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        status: z.enum(['pending', 'in_progress', 'completed', 'blocked']).optional().describe("Optional filter by status"),
        limit: z.number().optional().default(10).describe("Maximum number of results to return")
    })
}, async (params) => {
    const progress = await getProgressWithStatusStructured(
        params.project_name,
        params.status,
        params.limit
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(progress, null, 2)
        }]
    };
});

server.registerTool('update_progress_with_status', {
    description: "Update progress entry with status",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        progress_id: z.string().describe("ID of the progress entry to update"),
        status: z.enum(['pending', 'in_progress', 'completed', 'blocked']).describe("New status"),
        notes: z.string().optional().describe("Optional notes about the status change")
    })
}, async (params) => {
    const resultId = await updateProgressWithStatusStructured(
        params.project_name,
        params.progress_id,
        params.status,
        params.notes
    );
    return {
        content: [{
            type: "text",
            text: `Progress status updated with ID: ${resultId}`
        }]
    };
});

server.registerTool('search_progress_entries', {
    description: "Search progress entries using full-text search",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        query_term: z.string().describe("Search query term"),
        status: z.enum(['pending', 'in_progress', 'completed', 'blocked']).optional().describe("Optional filter by status"),
        limit: z.number().optional().default(10).describe("Maximum number of results to return")
    })
}, async (params) => {
    const results = await searchProgressEntriesStructured(
        params.project_name,
        params.query_term,
        params.status,
        params.limit
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(results, null, 2)
        }]
    };
});

// Custom data storage
server.registerTool('store_custom_data', {
    description: "Store custom data in the vector database",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        data: z.any().describe("The custom data to store"),
        data_type: z.string().describe("Type of custom data being stored"),
        metadata: z.record(z.string(), z.any()).optional().describe("Optional metadata")
    })
}, async (params) => {
    const dataId = await storeCustomDataStructured(
        params.project_name,
        params.data,
        params.data_type,
        params.metadata || {}
    );
    return {
        content: [{
            type: "text",
            text: `Custom data stored with ID: ${dataId}`
        }]
    };
});

server.registerTool('get_custom_data', {
    description: "Get custom data by ID",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        data_id: z.string().describe("ID of the custom data entry to retrieve")
    })
}, async (params) => {
    const data = await getCustomDataStructured(
        params.project_name,
        params.data_id
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(data, null, 2)
        }]
    };
});

server.registerTool('query_custom_data', {
    description: "Query custom data with filters",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        data_type: z.string().nullable().optional().describe("Type of custom data to query"),
        metadata_filter: z.record(z.string(), z.any()).optional().describe("Metadata filter to apply"),
        limit: z.number().optional().default(50).describe("Maximum number of results to return")
    })
}, async (params) => {
    const results = await queryCustomDataStructured(
        params.project_name,
        params.data_type || null,
        params.metadata_filter || {},
        params.limit
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(results, null, 2)
        }]
    };
});

server.registerTool('search_custom_data', {
    description: "Search custom data using semantic search",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        query_text: z.string().describe("Natural language query for semantic search"),
        data_type: z.string().nullable().optional().describe("Type of custom data to search"),
        limit: z.number().optional().default(10).describe("Maximum number of results to return")
    })
}, async (params) => {
    const results = await searchCustomDataStructured(
        params.project_name,
        params.query_text,
        params.data_type || null,
        params.limit
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(results, null, 2)
        }]
    };
});

server.registerTool('update_custom_data', {
    description: "Update existing custom data entry",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        data_id: z.string().describe("ID of the custom data entry to update"),
        data: z.any().describe("Updated data"),
        metadata: z.record(z.string(), z.any()).optional().describe("Optional updated metadata")
    })
}, async (params) => {
    const success = await updateCustomDataStructured(
        params.project_name,
        params.data_id,
        params.data,
        params.metadata || {}
    );
    return {
        content: [{
            type: "text",
            text: success ? `Custom data updated successfully` : `Failed to update custom data`
        }]
    };
});

// Workspace and memory management tools
server.registerTool('initialize_workspace', {
    description: "Initialize a new workspace/project in the memory system",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project to initialize"),
        workspace_info: z.record(z.string(), z.any()).optional().describe("Optional workspace information")
    })
}, async (params) => {
    const result = await initializeWorkspaceStructured(params.project_name, params.workspace_info || {});
    return {
        content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
        }]
    };
});

server.registerTool('sync_memory', {
    description: "Synchronize memory between local and remote stores",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        sync_sources: z.array(z.object({
            name: z.string(),
            type: z.string(),
            config: z.record(z.string(), z.any()).optional()
        })).optional().default([]).describe("Array of sync sources to use")
    })
}, async (params) => {
    const result = await syncMemoryStructured(params.project_name, params.sync_sources);
    return {
        content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
        }]
    };
});

server.registerTool('export_memory_to_markdown', {
    description: "Export project memory to Markdown format",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        include_types: z.array(z.string()).optional().describe("Optional filter for specific memory types to export")
    })
}, async (params) => {
    const markdown = await exportMemoryToMarkdownStructured(
        params.project_name,
        params.include_types
    );
    return {
        content: [{
            type: "text",
            text: markdown
        }]
    };
});

server.registerTool('import_memory_from_markdown', {
    description: "Import memory from Markdown format",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        markdown_content: z.string().describe("Markdown content to import")
    })
}, async (params) => {
    const result = await importMemoryFromMarkdownStructured(
        params.project_name,
        params.markdown_content
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
        }]
    };
});

server.registerTool('analyze_conversation', {
    description: "Analyze a conversation and extract key insights, decisions, and action items",
    inputSchema: z.object({
        project_name: z.string().describe("Name of the project"),
        conversation_text: z.string().describe("The conversation text to analyze")
    })
}, async (params) => {
    const analysis = await analyzeConversationStructured(
        params.project_name,
        params.conversation_text
    );
    return {
        content: [{
            type: "text",
            text: JSON.stringify(analysis, null, 2)
        }]
    };
});

async function main() {
    const transport = new StdioServerTransport();

    // Add error handling and logging for connection
    try {
        await server.connect(transport);
        console.error("Memory Qdrant MCP server running on stdio");
    } catch (error) {
        const err = error as Error;
        console.error("Error connecting server:", err.stack || err);
        process.exit(1);
    }
}

main().catch((error) => {
    const err = error as Error;
    console.error("Fatal error in main():", err.stack || err);
    process.exit(1);
});
