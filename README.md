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
  EMBEDDING_MODEL=models/text-embedding-004     # Gemini default (use nomic-embed-text:v1.5 for Ollama)
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
        "EMBEDDING_MODEL": "models/text-embedding-004",
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