#!/usr/bin/env node

// server/index.js
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
    updateCustomDataStructured
} from "./mcp_tools/contextTools.js";

// Create server instance
const server = new McpServer({
    name: "memory-qdrant-mcp",
    version: "1.0.0",
    capabilities: {
        tools: {},
    },
});

// Register weather tools
server.tool(
    "log_memory",
    "Log a memory entry to the vector database",
    {
        project_name: z.string().describe("Name of the project"),
        memory_type: z.string().describe("Type of memory (e.g., productContext, activeContext)"),
        content: z.string().describe("Content to log"),
        top_level_id: z.string().optional().describe("Optional top level ID")
    },
    async ({ project_name, memory_type, content, top_level_id }) => {
        const memoryId = await logMemory(project_name, memory_type, content, top_level_id);
        return {
            content: [
                {
                    type: "text",
                    text: `Memory logged with ID: ${memoryId}`,
                },
            ],
        };
    },
);

server.tool(
    "query_memory",
    "Query memory entries from the vector database",
    {
        project_name: z.string().describe("Name of the project"),
        query_text: z.string().describe("Query text"),
        memory_type: z.string().optional().describe("Optional memory type filter"),
        top_k: z.number().optional().default(3).describe("Number of results to return")
    },
    async ({ project_name, query_text, memory_type, top_k }) => {
        const results = await queryMemory(project_name, query_text, memory_type, top_k);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "log_decision",
    "Log a decision entry",
    {
        project_name: z.string().describe("Name of the project"),
        decision_text: z.string().describe("Decision text"),
        top_level_id: z.string().optional().describe("Optional top level ID")
    },
    async ({ project_name, decision_text, top_level_id }) => {
        const decisionId = await logDecision(project_name, decision_text, top_level_id);
        return {
            content: [
                {
                    type: "text",
                    text: `Decision logged with ID: ${decisionId}`,
                },
            ],
        };
    },
);

server.tool(
    "log_progress",
    "Log a progress entry",
    {
        project_name: z.string().describe("Name of the project"),
        progress_text: z.string().describe("Progress text"),
        top_level_id: z.string().optional().describe("Optional top level ID")
    },
    async ({ project_name, progress_text, top_level_id }) => {
        const progressId = await logProgress(project_name, progress_text, top_level_id);
        return {
            content: [
                {
                    type: "text",
                    text: `Progress logged with ID: ${progressId}`,
                },
            ],
        };
    },
);

server.tool(
    "summarize_text",
    "Summarize the given text",
    {
        text: z.string().describe("Text to summarize")
    },
    async ({ text }) => {
        const summary = await summarizeText(text);
        return {
            content: [
                {
                    type: "text",
                    text: summary,
                },
            ],
        };
    },
);

// ConPort-style structured context tools
server.tool(
    "get_product_context",
    "Get the product context for a project",
    {
        project_name: z.string().describe("Name of the project")
    },
    async ({ project_name }) => {
        const context = await getProductContext(project_name);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(context, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "update_product_context",
    "Update the product context for a project",
    {
        project_name: z.string().describe("Name of the project"),
        content: z.record(z.any()).optional().describe("Full content to replace"),
        patch_content: z.record(z.any()).optional().describe("Partial content to merge")
    },
    async ({ project_name, content, patch_content }) => {
        const resultId = await updateProductContext(project_name, content, patch_content);
        return {
            content: [
                {
                    type: "text",
                    text: `Product context updated with ID: ${resultId}`,
                },
            ],
        };
    },
);

server.tool(
    "get_active_context",
    "Get the active context for a project",
    {
        project_name: z.string().describe("Name of the project")
    },
    async ({ project_name }) => {
        const context = await getActiveContext(project_name);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(context, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "update_active_context",
    "Update the active context for a project",
    {
        project_name: z.string().describe("Name of the project"),
        content: z.record(z.any()).optional().describe("Full content to replace"),
        patch_content: z.record(z.any()).optional().describe("Partial content to merge")
    },
    async ({ project_name, content, patch_content }) => {
        const resultId = await updateActiveContext(project_name, content, patch_content);
        return {
            content: [
                {
                    type: "text",
                    text: `Active context updated with ID: ${resultId}`,
                },
            ],
        };
    },
);

server.tool(
    "get_decisions",
    "Get decisions for a project",
    {
        project_name: z.string().describe("Name of the project"),
        limit: z.number().optional().default(10).describe("Maximum number of decisions to return"),
        tags_filter_include_all: z.array(z.string()).optional().default([]).describe("Tags that must all be present"),
        tags_filter_include_any: z.array(z.string()).optional().default([]).describe("Tags where at least one must be present")
    },
    async ({ project_name, limit, tags_filter_include_all, tags_filter_include_any }) => {
        const decisions = await getDecisionsStructured(project_name, limit, tags_filter_include_all, tags_filter_include_any);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(decisions, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "search_decisions_fts",
    "Search decisions using full-text search",
    {
        project_name: z.string().describe("Name of the project"),
        query_term: z.string().describe("Search query term"),
        limit: z.number().optional().default(10).describe("Maximum number of results to return")
    },
    async ({ project_name, query_term, limit }) => {
        const results = await searchDecisionsFTSStructured(project_name, query_term, limit);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "semantic_search",
    "Perform semantic search across all memory types using embeddings",
    {
        project_name: z.string().describe("Name of the project"),
        query_text: z.string().describe("Natural language query for semantic search"),
        limit: z.number().optional().default(10).describe("Maximum number of results to return"),
        memory_types: z.array(z.string()).optional().describe("Optional filter for specific memory types")
    },
    async ({ project_name, query_text, limit, memory_types }) => {
        const results = await semanticSearchStructured(project_name, query_text, limit, memory_types);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "create_knowledge_link",
    "Create a knowledge link between two memory entities",
    {
        project_name: z.string().describe("Name of the project"),
        source_id: z.string().describe("ID of the source entity"),
        target_id: z.string().describe("ID of the target entity"),
        link_type: z.string().describe("Type of relationship (e.g., 'related_to', 'depends_on', 'implements')"),
        description: z.string().optional().describe("Optional description of the relationship")
    },
    async ({ project_name, source_id, target_id, link_type, description }) => {
        const linkId = await createKnowledgeLinkStructured(project_name, source_id, target_id, link_type, description);
        return {
            content: [
                {
                    type: "text",
                    text: `Knowledge link created with ID: ${linkId}`,
                },
            ],
        };
    },
);

server.tool(
    "get_knowledge_links",
    "Get knowledge links for a specific entity",
    {
        project_name: z.string().describe("Name of the project"),
        entity_id: z.string().describe("ID of the entity to get links for"),
        link_type: z.string().optional().describe("Optional filter for specific link types"),
        direction: z.enum(["incoming", "outgoing", "both"]).optional().default("both").describe("Direction of links to retrieve")
    },
    async ({ project_name, entity_id, link_type, direction }) => {
        const links = await getKnowledgeLinksStructured(project_name, entity_id, link_type, direction);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(links, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "get_context_history",
    "Get history of changes for a context type",
    {
        project_name: z.string().describe("Name of the project"),
        context_type: z.string().describe("Type of context (e.g., 'productContext', 'activeContext')"),
        limit: z.number().optional().default(10).describe("Maximum number of history entries to return")
    },
    async ({ project_name, context_type, limit }) => {
        const history = await getContextHistoryStructured(project_name, context_type, limit);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(history, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "batch_log_memory",
    "Log multiple memory entries in a single operation",
    {
        project_name: z.string().describe("Name of the project"),
        entries: z.array(z.object({
            memoryType: z.enum(["productContext", "activeContext", "systemPatterns", "decisionLog", "progress"]).describe("Type of memory"),
            content: z.string().describe("Content to log"),
            topLevelId: z.string().optional().describe("Optional custom ID for the entry")
        })).describe("Array of memory entries to log")
    },
    async ({ project_name, entries }) => {
        const ids = await batchLogMemoryStructured(project_name, entries);
        return {
            content: [
                {
                    type: "text",
                    text: `Batch logged ${ids.length} entries with IDs: ${ids.join(", ")}`,
                },
            ],
        };
    },
);

server.tool(
    "batch_query_memory",
    "Perform multiple memory queries in a single operation",
    {
        project_name: z.string().describe("Name of the project"),
        queries: z.array(z.object({
            queryText: z.string().describe("Query text"),
            memoryType: z.string().optional().describe("Optional memory type filter"),
            topK: z.number().optional().default(5).describe("Number of results per query")
        })).describe("Array of queries to execute")
    },
    async ({ project_name, queries }) => {
        const results = await batchQueryMemoryStructured(project_name, queries);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "batch_update_context",
    "Update multiple structured contexts in a single operation",
    {
        project_name: z.string().describe("Name of the project"),
        updates: z.array(z.object({
            contextType: z.enum(["productContext", "activeContext"]).describe("Type of context to update"),
            patchContent: z.record(z.any()).describe("Content to merge into the context")
        })).describe("Array of context updates to apply")
    },
    async ({ project_name, updates }) => {
        const ids = await batchUpdateStructuredContextStructured(project_name, updates);
        return {
            content: [
                {
                    type: "text",
                    text: `Batch updated ${ids.length} contexts with IDs: ${ids.join(", ")}`,
                },
            ],
        };
    },
);

server.tool(
    "get_system_patterns",
    "Get system patterns and conventions for a project",
    {
        project_name: z.string().describe("Name of the project"),
        limit: z.number().optional().default(50).describe("Maximum number of patterns to return")
    },
    async ({ project_name, limit }) => {
        const patterns = await getSystemPatternsStructured(project_name, limit);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(patterns, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "update_system_patterns",
    "Add or update system patterns and conventions for a project",
    {
        project_name: z.string().describe("Name of the project"),
        patterns: z.array(z.string()).describe("Array of pattern strings to add/update")
    },
    async ({ project_name, patterns }) => {
        const ids = await updateSystemPatternsStructured(project_name, patterns);
        return {
            content: [
                {
                    type: "text",
                    text: `Updated ${ids.length} system patterns with IDs: ${ids.join(", ")}`,
                },
            ],
        };
    },
);

server.tool(
    "search_system_patterns",
    "Search system patterns using semantic search",
    {
        project_name: z.string().describe("Name of the project"),
        query_text: z.string().describe("Natural language query for finding relevant patterns"),
        limit: z.number().optional().default(10).describe("Maximum number of results to return")
    },
    async ({ project_name, query_text, limit }) => {
        const results = await searchSystemPatternsStructured(project_name, query_text, limit);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "get_progress_with_status",
    "Get progress entries with status information",
    {
        project_name: z.string().describe("Name of the project"),
        status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional().describe("Optional status filter"),
        limit: z.number().optional().default(50).describe("Maximum number of entries to return")
    },
    async ({ project_name, status, limit }) => {
        const progress = await getProgressWithStatusStructured(project_name, status, limit);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(progress, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "update_progress_with_status",
    "Update progress with status tracking",
    {
        project_name: z.string().describe("Name of the project"),
        content: z.string().describe("Progress content"),
        status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional().default("in_progress").describe("Status of the progress item"),
        category: z.string().optional().default("general").describe("Category of the progress item"),
        priority: z.enum(["low", "medium", "high", "critical"]).optional().default("medium").describe("Priority level")
    },
    async ({ project_name, content, status, category, priority }) => {
        const progressId = await updateProgressWithStatusStructured(project_name, content, status, category, priority);
        return {
            content: [
                {
                    type: "text",
                    text: `Progress updated with ID: ${progressId}`,
                },
            ],
        };
    },
);

server.tool(
    "search_progress_entries",
    "Search progress entries using semantic search",
    {
        project_name: z.string().describe("Name of the project"),
        query_text: z.string().describe("Natural language query for finding relevant progress entries"),
        status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional().describe("Optional status filter"),
        limit: z.number().optional().default(10).describe("Maximum number of results to return")
    },
    async ({ project_name, query_text, status, limit }) => {
        const results = await searchProgressEntriesStructured(project_name, query_text, status, limit);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "store_custom_data",
    "Store custom data with metadata",
    {
        project_name: z.string().describe("Name of the project"),
        data: z.any().describe("The custom data to store (any JSON-serializable value)"),
        data_type: z.string().describe("Type/category of the custom data"),
        metadata: z.record(z.any()).optional().default({}).describe("Additional metadata for the data")
    },
    async ({ project_name, data, data_type, metadata }) => {
        const dataId = await storeCustomDataStructured(project_name, data, data_type, metadata);
        return {
            content: [
                {
                    type: "text",
                    text: `Custom data stored with ID: ${dataId}`,
                },
            ],
        };
    },
);

server.tool(
    "get_custom_data",
    "Get custom data by ID",
    {
        project_name: z.string().describe("Name of the project"),
        data_id: z.string().describe("ID of the custom data to retrieve")
    },
    async ({ project_name, data_id }) => {
        const data = await getCustomDataStructured(project_name, data_id);
        return {
            content: [
                {
                    type: "text",
                    text: data ? JSON.stringify(data, null, 2) : "Custom data not found",
                },
            ],
        };
    },
);

server.tool(
    "query_custom_data",
    "Query custom data with filters",
    {
        project_name: z.string().describe("Name of the project"),
        data_type: z.string().optional().describe("Optional data type filter"),
        metadata_filter: z.record(z.any()).optional().default({}).describe("Optional metadata filters"),
        limit: z.number().optional().default(50).describe("Maximum number of results to return")
    },
    async ({ project_name, data_type, metadata_filter, limit }) => {
        const results = await queryCustomDataStructured(project_name, data_type, metadata_filter, limit);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "search_custom_data",
    "Search custom data using semantic search",
    {
        project_name: z.string().describe("Name of the project"),
        query_text: z.string().describe("Natural language query for finding relevant custom data"),
        data_type: z.string().optional().describe("Optional data type filter"),
        limit: z.number().optional().default(10).describe("Maximum number of results to return")
    },
    async ({ project_name, query_text, data_type, limit }) => {
        const results = await searchCustomDataStructured(project_name, query_text, data_type, limit);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "update_custom_data",
    "Update existing custom data",
    {
        project_name: z.string().describe("Name of the project"),
        data_id: z.string().describe("ID of the data to update"),
        data: z.any().describe("New data to store"),
        metadata: z.record(z.any()).optional().default({}).describe("Updated metadata")
    },
    async ({ project_name, data_id, data, metadata }) => {
        const success = await updateCustomDataStructured(project_name, data_id, data, metadata);
        return {
            content: [
                {
                    type: "text",
                    text: success ? "Custom data updated successfully" : "Failed to update custom data",
                },
            ],
        };
    },
);

server.tool(
    "initialize_workspace",
    "Initialize workspace and detect project structure",
    {
        project_name: z.string().describe("Name of the project"),
        workspace_info: z.object({
            files: z.array(z.string()).optional().default([]).describe("List of files in the workspace"),
            directories: z.array(z.string()).optional().default([]).describe("List of directories in the workspace")
        }).optional().default({}).describe("Workspace information for detection")
    },
    async ({ project_name, workspace_info }) => {
        const result = await initializeWorkspaceStructured(project_name, workspace_info);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "sync_memory",
    "Sync memory with external sources (proactive logging)",
    {
        project_name: z.string().describe("Name of the project"),
        sync_sources: z.array(z.object({
            name: z.string().describe("Name of the sync source"),
            type: z.string().describe("Type of sync source (e.g., 'git', 'api')"),
            config: z.record(z.any()).optional().default({}).describe("Source-specific configuration")
        })).optional().default([]).describe("Array of sync source configurations")
    },
    async ({ project_name, sync_sources }) => {
        const result = await syncMemoryStructured(project_name, sync_sources);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "export_memory_to_markdown",
    "Export memory data to markdown format",
    {
        project_name: z.string().describe("Name of the project"),
        memory_types: z.array(z.string()).optional().describe("Types of memory to export (optional - exports all if not specified)")
    },
    async ({ project_name, memory_types }) => {
        const markdown = await exportMemoryToMarkdownStructured(project_name, memory_types);
        return {
            content: [
                {
                    type: "text",
                    text: markdown,
                },
            ],
        };
    },
);

server.tool(
    "import_memory_from_markdown",
    "Import memory data from markdown",
    {
        project_name: z.string().describe("Name of the project"),
        markdown_content: z.string().describe("Markdown content to import")
    },
    async ({ project_name, markdown_content }) => {
        const result = await importMemoryFromMarkdownStructured(project_name, markdown_content);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "analyze_conversation",
    "Analyze conversation and automatically log relevant information",
    {
        project_name: z.string().describe("Name of the project"),
        conversation_text: z.string().describe("Conversation text to analyze"),
        metadata: z.object({
            conversationId: z.string().optional().describe("Unique conversation identifier"),
            participants: z.array(z.string()).optional().default([]).describe("List of conversation participants"),
            source: z.string().optional().describe("Source of the conversation")
        }).optional().default({}).describe("Additional metadata about the conversation")
    },
    async ({ project_name, conversation_text, metadata }) => {
        const result = await analyzeConversationStructured(project_name, conversation_text, metadata);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    },
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Memory MCP server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
