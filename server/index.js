// server/index.js
import "dotenv/config";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { logMemory, queryMemory } from "./mcp_tools/memoryBankTools.js";
import { logDecision, logProgress } from "./mcp_tools/store.js";
import { summarizeText } from "./mcp_tools/summarizer.js";

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

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Memory MCP server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
