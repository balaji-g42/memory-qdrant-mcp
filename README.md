# Memory Qdrant MCP

An MCP (Model Context Protocol) server that provides memory management capabilities using Qdrant vector database for storing and retrieving project context, decisions, progress, and patterns.

## Features

- **Memory Management**: Log and query project memories across different categories
- **Vector Search**: Semantic search through memory entries using embeddings
- **Multiple Providers**: Support for Gemini, Ollama, and FastEmbed embedding providers
- **MCP Integration**: Full MCP stdio server implementation
- **REST API**: Additional HTTP endpoints for direct access

## Installation

### Using npx (Recommended)

```bash
npx memory-qdrant-mcp
```

This will download and run the server automatically.

### Manual Installation

```bash
npm install -g memory-qdrant-mcp
memory-qdrant-mcp
```

### From Source

```bash
git clone <repository-url>
cd memory-qdrant-mcp
npm install
npm run build  # if needed
node server/index.js
```

## Prerequisites

- **Qdrant Database**: The server requires a running Qdrant instance
  ```bash
  docker run -p 6333:6333 qdrant/qdrant
  ```

- **Environment Variables**: Create a `.env` file or set environment variables:
  ```env
  QDRANT_URL=http://localhost:6333
  EMBEDDING_PROVIDER=gemini  # or 'ollama' or 'fastembed'
  GEMINI_API_KEY=your_gemini_api_key  # if using Gemini
  ```

## MCP Configuration

To use with Roo or other MCP clients, add to your MCP settings:

```json
{
  "mcpServers": {
    "memory-qdrant-mcp": {
      "command": "npx",
      "args": ["memory-qdrant-mcp"]
    }
  }
}
```

## Available Tools

### log_memory
Log a memory entry to the vector database.

**Parameters:**
- `project_name` (string): Name of the project
- `memory_type` (string): Type of memory (productContext, activeContext, systemPatterns, decisionLog, progress)
- `content` (string): Content to log
- `top_level_id` (string, optional): Optional top level ID

### query_memory
Query memory entries from the vector database.

**Parameters:**
- `project_name` (string): Name of the project
- `query_text` (string): Query text for semantic search
- `memory_type` (string, optional): Optional memory type filter
- `top_k` (number, optional): Number of results to return (default: 3)

### log_decision
Log a decision entry.

**Parameters:**
- `project_name` (string): Name of the project
- `decision_text` (string): Decision text
- `top_level_id` (string, optional): Optional top level ID

### log_progress
Log a progress entry.

**Parameters:**
- `project_name` (string): Name of the project
- `progress_text` (string): Progress text
- `top_level_id` (string, optional): Optional top level ID

### summarize_text
Summarize the given text.

**Parameters:**
- `text` (string): Text to summarize

## Publishing to npm

To publish your own version:

1. Update `package.json` with your information:
   - Change `name` to a unique package name
   - Update `author`, `repository`, `homepage`
   - Ensure version is appropriate

2. Login to npm:
   ```bash
   npm login
   ```

3. Publish:
   ```bash
   npm publish
   ```

4. Users can then install and run:
   ```bash
   npx your-package-name
   ```

## Development

### Project Structure

```
memory-qdrant-mcp/
├── server/
│   ├── index.js              # Main MCP server
│   ├── mcp_tools/            # MCP tool implementations
│   │   ├── memoryBankTools.js
│   │   ├── store.js
│   │   └── summarizer.js
│   ├── embeddings/           # Embedding providers
│   │   ├── providerBase.js
│   │   ├── geminiVertex.js
│   │   ├── ollama.js
│   │   └── fastEmbed.js
│   └── config.js             # Configuration
├── memory-bank/              # Project documentation
├── package.json
└── README.md
```

### Adding New Tools

1. Implement the tool in `server/mcp_tools/`
2. Register it in `server/index.js`
3. Update this README

## License

MIT