# Memory-Qdrant MCP Tests

Comprehensive test suite for all 35 MCP tools in the memory-qdrant-mcp project.

## Test Coverage

This test suite covers all 35 MCP tools organized into the following categories:

### Core Memory Operations (3 tools)
- `log_memory` - Store memory entries
- `query_memory` - Query memory by type
- `query_memory_summarized` - Query memory with summarization

### Decision Logging (3 tools)
- `log_decision` - Log architectural decisions
- `get_decisions` - Retrieve decisions
- `search_decisions_fts` - Full-text search decisions

### Progress Tracking (4 tools)
- `log_progress` - Log project milestones
- `get_progress_with_status` - Get progress by status
- `update_progress_with_status` - Update progress status
- `search_progress_entries` - Search progress entries

### Context Management (5 tools)
- `get_product_context` - Get product context
- `update_product_context` - Update product context
- `get_active_context` - Get active context
- `update_active_context` - Update active context
- `get_context_history` - Get context history

### System Patterns (3 tools)
- `get_system_patterns` - Get system patterns
- `update_system_patterns` - Update system patterns
- `search_system_patterns` - Search system patterns

### Knowledge Links (2 tools)
- `create_knowledge_link` - Create links between memories
- `get_knowledge_links` - Get knowledge links

### Semantic Search (1 tool)
- `semantic_search` - Perform semantic search

### Text Summarization (1 tool)
- `summarize_text` - Summarize text content

### Custom Data Operations (5 tools)
- `store_custom_data` - Store custom key-value data
- `get_custom_data` - Get custom data by key
- `query_custom_data` - Query custom data
- `search_custom_data` - Search custom data
- `update_custom_data` - Update custom data

### Batch Operations (3 tools)
- `batch_log_memory` - Batch log memory entries
- `batch_query_memory` - Batch query memory
- `batch_update_context` - Batch update context

### Workspace Management (2 tools)
- `initialize_workspace` - Initialize new workspace
- `sync_memory` - Sync memory data

### Import/Export (2 tools)
- `export_memory_to_markdown` - Export to markdown
- `import_memory_from_markdown` - Import from markdown

### Conversation Analysis (1 tool)
- `analyze_conversation` - Analyze conversation patterns

## Running Tests

### Prerequisites

Make sure you have the following installed:
- Node.js 18+ 
- TypeScript 5+
- Jest and ts-jest

Install dependencies:
```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Specific Test Suite

```bash
npm test -- all-tools.test.ts
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

## Test Configuration

Tests are configured in `jest.config.js` with the following settings:
- **Test Environment**: Node.js
- **Module System**: ESM (ECMAScript Modules)
- **Test Timeout**: 30 seconds (to accommodate MCP server initialization)
- **Coverage**: Tracks coverage for all `src/**/*.ts` files

## Environment Setup

Before running tests, ensure your `.env` file is properly configured:

```env
# Qdrant Configuration
QDRANT_URL=https://qdrant.geekscodebase.me
QDRANT_API_KEY=your-api-key
DEFAULT_TOP_K_MEMORY_QUERY=3

# Embedding Configuration
EMBEDDING_PROVIDER=openrouter
EMBEDDING_MODEL=qwen/qwen3-embedding-8b

# Summarizer Configuration
SUMMARIZER_PROVIDER=openrouter
SUMMARIZER_MODEL=openai/gpt-oss-20b:free

# Provider API Keys
OPENROUTER_API_KEY=your-openrouter-key
GEMINI_API_KEY=your-gemini-key
OLLAMA_API_URL=http://localhost:11434
OLLAMA_API_KEY=
```

## Test Architecture

The test suite uses the MCP SDK client to connect to the server and test each tool:

1. **Setup**: Initializes MCP client and connects to the server
2. **Test Execution**: Calls each tool with appropriate test data
3. **Assertions**: Validates tool responses
4. **Teardown**: Closes client connection

## Logging

All application logs use `console.error()` which outputs to **stderr**. This ensures that:
- Logs don't interfere with MCP protocol communication on stdout
- Logs are visible in production environments
- Test output remains clean and readable

## Adding New Tests

When adding new MCP tools, update `tests/all-tools.test.ts`:

1. Add a new test in the appropriate category
2. Use the `client.callTool()` method with proper arguments
3. Add assertions to validate the response
4. Update this README with the new tool

## Troubleshooting

### Tests Timeout
- Increase the timeout in `jest.config.js` if needed
- Check if Qdrant is accessible at the configured URL

### Connection Errors
- Verify `.env` configuration
- Ensure the server builds successfully: `npm run build`
- Check Qdrant service status

### Failed Tool Calls
- Review tool arguments match the Zod schema in `src/index.ts`
- Check stderr logs for detailed error messages
- Verify API keys are valid

## Archived Tests

Previous JavaScript tests are preserved in `tests_backup_js/`:
- `simple-test.js`
- `test-error-handling-units.js`
- `test-gemini-error-handling.js`
- `test-memory-access.js`

These are kept for reference but are no longer actively maintained.
