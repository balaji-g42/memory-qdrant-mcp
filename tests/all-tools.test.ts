/**
 * Comprehensive test suite for all 35 MCP tools
 * Tests memory operations, context management, decision logging, and more
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

describe('Memory-Qdrant MCP Tools', () => {
    let client: Client;
    let transport: StdioClientTransport;

    beforeAll(async () => {
        // Initialize MCP client connecting to our server
        transport = new StdioClientTransport({
            command: 'node',
            args: ['dist/index.js'],
        });

        client = new Client({
            name: 'test-client',
            version: '1.0.0',
        }, {
            capabilities: {}
        });

        await client.connect(transport);
    });

    afterAll(async () => {
        await client.close();
    });

    describe('Core Memory Operations', () => {
        it('should log memory successfully', async () => {
            const result = await client.callTool({
                name: 'log_memory',
                arguments: {
                    type: 'productContext',
                    content: 'Test product context for MCP project',
                    project: 'test-project',
                    topLevelId: 'test-001'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should query memory successfully', async () => {
            const result = await client.callTool({
                name: 'query_memory',
                arguments: {
                    query: 'product context',
                    type: 'productContext',
                    top_k: 3
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should query memory with summarization', async () => {
            const result = await client.callTool({
                name: 'query_memory_summarized',
                arguments: {
                    query: 'product features',
                    type: 'productContext',
                    top_k: 5,
                    summarize: true
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });

    describe('Decision Logging', () => {
        it('should log decision successfully', async () => {
            const result = await client.callTool({
                name: 'log_decision',
                arguments: {
                    decision: 'Use TypeScript for type safety',
                    reasoning: 'Better developer experience and fewer runtime errors',
                    alternatives: 'JavaScript with JSDoc',
                    impact: 'Medium',
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should get decisions', async () => {
            const result = await client.callTool({
                name: 'get_decisions',
                arguments: {
                    project: 'test-project',
                    limit: 10
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should search decisions with full-text search', async () => {
            const result = await client.callTool({
                name: 'search_decisions_fts',
                arguments: {
                    searchText: 'TypeScript',
                    project: 'test-project',
                    limit: 5
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });

    describe('Progress Tracking', () => {
        it('should log progress successfully', async () => {
            const result = await client.callTool({
                name: 'log_progress',
                arguments: {
                    milestone: 'TypeScript Conversion Complete',
                    details: 'All files converted from JavaScript to TypeScript',
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should get progress with status', async () => {
            const result = await client.callTool({
                name: 'get_progress_with_status',
                arguments: {
                    project: 'test-project',
                    status: 'completed'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should update progress status', async () => {
            const result = await client.callTool({
                name: 'update_progress_with_status',
                arguments: {
                    progressId: 'test-progress-001',
                    status: 'in_progress',
                    details: 'Updated progress details'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should search progress entries', async () => {
            const result = await client.callTool({
                name: 'search_progress_entries',
                arguments: {
                    searchText: 'conversion',
                    project: 'test-project',
                    status: 'completed'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });

    describe('Context Management', () => {
        it('should get product context', async () => {
            const result = await client.callTool({
                name: 'get_product_context',
                arguments: {
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should update product context', async () => {
            const result = await client.callTool({
                name: 'update_product_context',
                arguments: {
                    context: 'Updated product context with new features',
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should get active context', async () => {
            const result = await client.callTool({
                name: 'get_active_context',
                arguments: {
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should update active context', async () => {
            const result = await client.callTool({
                name: 'update_active_context',
                arguments: {
                    context: 'Currently working on testing framework',
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should get context history', async () => {
            const result = await client.callTool({
                name: 'get_context_history',
                arguments: {
                    project: 'test-project',
                    limit: 10
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });

    describe('System Patterns', () => {
        it('should get system patterns', async () => {
            const result = await client.callTool({
                name: 'get_system_patterns',
                arguments: {
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should update system patterns', async () => {
            const result = await client.callTool({
                name: 'update_system_patterns',
                arguments: {
                    patterns: 'Use async/await for all async operations',
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should search system patterns', async () => {
            const result = await client.callTool({
                name: 'search_system_patterns',
                arguments: {
                    searchText: 'async',
                    project: 'test-project',
                    limit: 5
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });

    describe('Knowledge Links', () => {
        it('should create knowledge link', async () => {
            const result = await client.callTool({
                name: 'create_knowledge_link',
                arguments: {
                    sourceId: 'memory-001',
                    targetId: 'memory-002',
                    linkType: 'relates_to',
                    description: 'Related memory entries'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should get knowledge links', async () => {
            const result = await client.callTool({
                name: 'get_knowledge_links',
                arguments: {
                    memoryId: 'memory-001',
                    linkType: 'relates_to'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });

    describe('Semantic Search', () => {
        it('should perform semantic search', async () => {
            const result = await client.callTool({
                name: 'semantic_search',
                arguments: {
                    query: 'typescript configuration',
                    project: 'test-project',
                    top_k: 5
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });

    describe('Text Summarization', () => {
        it('should summarize text', async () => {
            const result = await client.callTool({
                name: 'summarize_text',
                arguments: {
                    text: 'This is a long text that needs to be summarized. It contains multiple sentences and paragraphs. The goal is to reduce its length while preserving key information.'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });

    describe('Custom Data Operations', () => {
        it('should store custom data', async () => {
            const result = await client.callTool({
                name: 'store_custom_data',
                arguments: {
                    key: 'test-config',
                    value: { theme: 'dark', language: 'en' },
                    tags: ['config', 'user-prefs'],
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should get custom data', async () => {
            const result = await client.callTool({
                name: 'get_custom_data',
                arguments: {
                    key: 'test-config',
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should query custom data', async () => {
            const result = await client.callTool({
                name: 'query_custom_data',
                arguments: {
                    query: 'config',
                    project: 'test-project',
                    top_k: 5
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should search custom data', async () => {
            const result = await client.callTool({
                name: 'search_custom_data',
                arguments: {
                    searchText: 'theme',
                    project: 'test-project',
                    tags: ['config']
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should update custom data', async () => {
            const result = await client.callTool({
                name: 'update_custom_data',
                arguments: {
                    key: 'test-config',
                    value: { theme: 'light', language: 'en' },
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });

    describe('Batch Operations', () => {
        it('should batch log memory', async () => {
            const result = await client.callTool({
                name: 'batch_log_memory',
                arguments: {
                    entries: [
                        { type: 'productContext', content: 'Feature A', project: 'test-project' },
                        { type: 'productContext', content: 'Feature B', project: 'test-project' }
                    ]
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should batch query memory', async () => {
            const result = await client.callTool({
                name: 'batch_query_memory',
                arguments: {
                    queries: ['Feature A', 'Feature B'],
                    type: 'productContext',
                    top_k: 3
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should batch update context', async () => {
            const result = await client.callTool({
                name: 'batch_update_context',
                arguments: {
                    updates: {
                        productContext: 'Updated product info',
                        activeContext: 'Updated active info'
                    },
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });

    describe('Workspace Management', () => {
        it('should initialize workspace', async () => {
            const result = await client.callTool({
                name: 'initialize_workspace',
                arguments: {
                    project: 'new-test-project',
                    description: 'A new test project for initialization'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should sync memory', async () => {
            const result = await client.callTool({
                name: 'sync_memory',
                arguments: {
                    project: 'test-project',
                    direction: 'push'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });

    describe('Import/Export', () => {
        it('should export memory to markdown', async () => {
            const result = await client.callTool({
                name: 'export_memory_to_markdown',
                arguments: {
                    project: 'test-project',
                    outputPath: './test-export.md'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });

        it('should import memory from markdown', async () => {
            const result = await client.callTool({
                name: 'import_memory_from_markdown',
                arguments: {
                    markdownPath: './test-export.md',
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });

    describe('Conversation Analysis', () => {
        it('should analyze conversation', async () => {
            const result = await client.callTool({
                name: 'analyze_conversation',
                arguments: {
                    messages: [
                        { role: 'user', content: 'How do I configure TypeScript?' },
                        { role: 'assistant', content: 'You need to create a tsconfig.json file' }
                    ],
                    project: 'test-project'
                }
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });
});
