# Memory Qdrant MCP

An MCP (Model Context Protocol) server that provides memory management capabilities using Qdrant vector database for storing and retrieving project context, decisions, progress, and patterns.

## Features

- **Memory Management**: Log and query project memories across different categories
- **Vector Search**: Semantic search through memory entries using embeddings
- **Multiple Providers**: Support for Gemini, Ollama, and FastEmbed embedding providers
- **MCP Integration**: Full MCP stdio server implementation
- **REST API**: Additional HTTP endpoints for direct access
- **Workspace Management**: Automatic project detection and memory bank initialization
- **Import/Export**: Markdown-based memory bank import and export functionality
- **Conversation Analysis**: Automatic logging of relevant information from conversations
- **Performance Optimization**: Connection pooling, LRU caching, and cache invalidation for improved performance
- **End-to-End Testing**: Comprehensive test suite with MCP Inspector for protocol compliance

## Performance Features

- **Connection Pooling**: Configurable Qdrant client connection pool for better concurrent performance
- **LRU Caching**: Least Recently Used cache implementation for:
  - Embeddings (reduces API calls for repeated text)
  - Query results (faster repeated searches)
  - Context and pattern data (improved retrieval speed)
- **Cache Invalidation**: Automatic cache clearing when data is modified to ensure consistency
- **Configurable Cache Sizes**: Adjustable TTL and size limits for different cache types
- **Cache Statistics**: Built-in cache performance monitoring and statistics

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

  **Option 1: Simple Docker run**
  ```bash
  docker run -p 6333:6333 qdrant/qdrant
  ```

  **Option 2: Docker Compose (Recommended for production)**
  Create a `docker-compose.yml` file:
  ```yaml
  services:
    qdrant:
      image: qdrant/qdrant:latest
      container_name: qdrant
      restart: unless-stopped
      ports:
        - "6333:6333"
        - "6334:6334"
      environment:
        QDRANT__SERVICE__CORS: "true"
      volumes:
        - qdrant_data:/qdrant/storage

  volumes:
    qdrant_data:
      driver: local
  ```

  Then run:
  ```bash
  docker-compose up -d
  ```

- **Environment Variables**: Copy `.env.example` to `.env` and configure:
  ```bash
  cp .env.example .env
  ```

  **Embedding Provider** (choose one):
  ```env
  # Option 1: Google Gemini (fast, recommended - uses Gemini for both embedding and summarization)
  GEMINI_API_KEY=your_gemini_api_key_here

  # Option 2: Ollama (local, free, slower)
  OLLAMA_BASE_URL=http://localhost:11434

  # Option 3: OpenRouter + Gemini/Ollama (OpenRouter for summarization, Gemini/Ollama for embedding)
  OPENROUTER_API_KEY=your_openrouter_api_key_here
  ```

  **Model Configuration** (optional, defaults provided):
  ```env
  EMBEDDING_MODEL=models/gemini-embedding-001  # Gemini embedding model (use nomic-embed-text:v1.5 for Ollama)
  SUMMARIZER_MODEL=openai/gpt-oss-20b:free      # OpenRouter default (auto-switches to Gemini if no OpenRouter key)
  DEFAULT_TOP_K_MEMORY_QUERY=3                  # Search result limit
  ```

  **Required**:
  ```env
  QDRANT_URL=http://localhost:6333
  ```

## MCP Configuration

### For VSCode GitHub Copilot

Create or update the MCP settings file at:
- **Windows**: `%APPDATA%\Code\User\globalStorage\github.copilot-chat\settings\mcp.json`
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/settings/mcp.json`
- **Linux**: `~/.config/Code/User/globalStorage/github.copilot-chat/settings/mcp.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "memory-qdrant-mcp": {
      "command": "npx",
      "args": ["memory-qdrant-mcp"],
      "env": {
        "QDRANT_URL": "http://localhost:6333",
        "GEMINI_API_KEY": "your_gemini_api_key_here",
        "OPENROUTER_API_KEY": "your_openrouter_api_key_here",
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "EMBEDDING_MODEL": "models/gemini-embedding-001",
        "DEFAULT_TOP_K_MEMORY_QUERY": "3",
        "SUMMARIZER_MODEL": "openai/gpt-oss-20b:free"
      }
    }
  }
}
```

### For Roo

Add to your Roo MCP settings:

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

### Core Memory Tools

#### log_memory
Log a memory entry to the vector database.

**Parameters:**
- `project_name` (string): Name of the project
- `memory_type` (string): Type of memory (productContext, activeContext, systemPatterns, decisionLog, progress)
- `content` (string): Content to log
- `top_level_id` (string, optional): Optional top level ID

#### query_memory
Query memory entries from the vector database.

**Parameters:**
- `project_name` (string): Name of the project
- `query_text` (string): Query text for semantic search
- `memory_type` (string, optional): Optional memory type filter
- `top_k` (number, optional): Number of results to return (default: 3)

#### log_decision
Log a decision entry.

**Parameters:**
- `project_name` (string): Name of the project
- `decision_text` (string): Decision text
- `top_level_id` (string, optional): Optional top level ID

#### log_progress
Log a progress entry.

**Parameters:**
- `project_name` (string): Name of the project
- `progress_text` (string): Progress text
- `top_level_id` (string, optional): Optional top level ID

#### summarize_text
Summarize the given text.

**Parameters:**
- `text` (string): Text to summarize

### Workspace Management Tools

#### initialize_workspace
Initialize a new workspace with automatic project detection and memory bank setup.

**Parameters:**
- `projectName` (string): Name of the project
- `workspaceInfo` (object): Workspace information containing files and directories
  - `files` (array): List of file paths in the workspace
  - `directories` (array): List of directory paths in the workspace

#### sync_memory
Synchronize memory bank with current workspace state and log any changes.

**Parameters:**
- `projectName` (string): Name of the project
- `workspaceInfo` (object): Current workspace information
  - `files` (array): List of current file paths
  - `directories` (array): List of current directory paths

### Import/Export Tools

#### export_memory_to_markdown
Export all memory entries for a project to markdown files.

**Parameters:**
- `projectName` (string): Name of the project
- `outputPath` (string, optional): Output directory path (default: "./memory-bank")

#### import_memory_from_markdown
Import memory entries from markdown files into the vector database.

**Parameters:**
- `projectName` (string): Name of the project
- `inputPath` (string, optional): Input directory path (default: "./memory-bank")

### Analysis Tools

#### analyze_conversation
Analyze a conversation and automatically log relevant information to memory.

**Parameters:**
- `projectName` (string): Name of the project
- `conversation` (string): The conversation text to analyze
- `context` (string, optional): Additional context about the conversation

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
│   ├── cache.js              # LRU caching implementation
│   └── config.js             # Configuration
├── test/                     # Test files
│   ├── memoryBankTools.test.js
│   └── mcpServer.integration.test.js
├── babel.config.cjs          # Babel configuration for testing
├── jest.config.cjs           # Jest configuration
├── package.json
└── README.md
```

### Adding New Tools

1. Implement the tool in `server/mcp_tools/`
2. Register it in `server/index.js`
3. Update this README

## Testing

The project includes comprehensive testing using MCP Inspector for protocol compliance:

### Running MCP Inspector Tests

```bash
npx @modelcontextprotocol/inspector node server/index.js
```

This will start the MCP Inspector at `http://localhost:6274` where you can test all MCP tools interactively.

### Test Coverage

MCP Inspector tests cover:
- MCP protocol initialization and tool listing
- Memory bank operations (logging, querying)
- Workspace management and synchronization
- Import/export functionality
- Conversation analysis
- Performance optimizations (caching, connection pooling)

## License

MIT