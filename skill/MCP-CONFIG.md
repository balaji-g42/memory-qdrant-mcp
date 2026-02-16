# MCP Configuration Guide

This guide shows how to configure the Memory Qdrant MCP server across different platforms and AI assistants.

## Configuration Files Reference

The `skill/` folder contains example configuration files for different platforms:

- **`claude-config.example.json`** - For Claude Desktop and CLI
- **`vscode-mcp-config.example.json`** - For VS Code MCP extension
- **`cursor-config.example.json`** - For Cursor IDE

Copy the appropriate file and update with your API keys.

## Environment Variables

The MCP server requires these environment variables:

### Required

```env
QDRANT_URL=https://your-qdrant-instance.com
QDRANT_API_KEY=your_qdrant_api_key
```

### Optional (Provider Configuration)

```env
# Embedding provider: openrouter, gemini, ollama, fastembed (default)
EMBEDDING_PROVIDER=openrouter
EMBEDDING_MODEL=qwen/qwen3-embedding-8b

# Summarizer provider: openrouter (default), gemini, ollama
SUMMARIZER_PROVIDER=openrouter
SUMMARIZER_MODEL=openai/gpt-oss-20b:free

# Provider API keys (only needed for providers you use)
OPENROUTER_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
OLLAMA_API_URL=http://localhost:11434
OLLAMA_API_KEY=your_key_for_cloud_ollama

# Performance tuning (optional)
DEFAULT_TOP_K_MEMORY_QUERY=3
CACHE_TTL_SECONDS=3600
EMBEDDING_CACHE_SIZE=500
QUERY_CACHE_SIZE=200
```

## Platform-Specific Configurations

### Claude.ai

1. Download the skill as a zip file
2. Go to Settings → Features → Skills
3. Upload the zip file

The skill will be available for use in your claude.ai conversations.

**Note:** Skills in claude.ai are per-user, not organization-wide.

### Claude Desktop

Create or edit `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "memory-qdrant-mcp": {
      "command": "npx",
      "args": ["-y", "memory-qdrant-mcp"],
      "env": {
        "QDRANT_URL": "https://qdrant.geekscodebase.me",
        "QDRANT_API_KEY": "your-qdrant-api-key",
        "EMBEDDING_PROVIDER": "openrouter",
        "EMBEDDING_MODEL": "qwen/qwen3-embedding-8b",
        "SUMMARIZER_PROVIDER": "openrouter",
        "SUMMARIZER_MODEL": "openai/gpt-oss-20b:free",
        "OPENROUTER_API_KEY": "your-openrouter-api-key"
      }
    }
  }
}
```

### VS Code with GitHub Copilot

Create or edit the MCP settings file:

**Windows:** `%APPDATA%\Code\User\globalStorage\github.copilot-chat\settings\mcp.json`
**macOS:** `~/Library/Application Support/Code/User/globalStorage/github.copilot-chat/settings/mcp.json`
**Linux:** `~/.config/Code/User/globalStorage/github.copilot-chat/settings/mcp.json`

```json
{
  "mcpServers": {
    "memory-qdrant-mcp": {
      "command": "node",
      "args": ["${workspaceFolder}/node_modules/memory-qdrant-mcp/dist/index.js"],
      "env": {
        "QDRANT_URL": "${env:QDRANT_URL}",
        "QDRANT_API_KEY": "${env:QDRANT_API_KEY}",
        "EMBEDDING_PROVIDER": "openrouter",
        "OPENROUTER_API_KEY": "${env:OPENROUTER_API_KEY}"
      }
    }
  }
}
```

**Using environment variables from system:**
Set these in your system environment or `.env` file:
```env
QDRANT_URL=https://qdrant.geekscodebase.me
QDRANT_API_KEY=your_key
OPENROUTER_API_KEY=your_key
```

### Cursor IDE

Add to Cursor Settings (Settings → Features → MCP Servers):

```json
{
  "mcpServers": {
    "memory-qdrant-mcp": {
      "command": "npx",
      "args": ["-y", "memory-qdrant-mcp"],
      "env": {
        "QDRANT_URL": "https://qdrant.geekscodebase.me",
        "QDRANT_API_KEY": "your-qdrant-api-key",
        "EMBEDDING_PROVIDER": "openrouter",
        "OPENROUTER_API_KEY": "your-openrouter-api-key"
      }
    }
  }
}
```

### Claude Code

Create `.claude/skills/memory-qdrant-mcp/` directory in your project or home directory:

```bash
# Project-specific
mkdir -p .claude/skills/memory-qdrant-mcp

# Global (all projects)
mkdir -p ~/.claude/skills/memory-qdrant-mcp
```

Copy the `SKILL.md` file to this directory. Claude Code will automatically discover and use the skill.

Environment variables can be set in:
- `.env` file in project root
- System environment variables
- Claude Code settings

### Roo

Add to your Roo MCP settings:

```json
{
  "mcpServers": {
    "memory-qdrant-mcp": {
      "command": "npx",
      "args": ["-y", "memory-qdrant-mcp"],
      "env": {
        "QDRANT_URL": "http://localhost:6333",
        "QDRANT_API_KEY": "your-key",
        "EMBEDDING_PROVIDER": "fastembed"
      }
    }
  }
}
```

### Claude API

Use the Skills API to upload the skill:

```bash
# Upload the skill
curl -X POST https://api.anthropic.com/v1/skills \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-beta: skills-2025-10-02" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "memory-qdrant-mcp",
    "skill_data": "base64_encoded_skill_zip"
  }'
```

Then use in API calls:

```python
import anthropic

client = anthropic.Anthropic(api_key="your-api-key")

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4096,
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    tools=[
        {"type": "code-execution", "container": {"skills": ["memory-qdrant-mcp"]}}
    ],
    messages=[
        {"role": "user", "content": "Remember that we decided to use PostgreSQL"}
    ]
)
```

## Provider Configuration Examples

### OpenRouter (Recommended)

Best for cloud-based embeddings and summarization with free tier options.

```env
EMBEDDING_PROVIDER=openrouter
EMBEDDING_MODEL=qwen/qwen3-embedding-8b
SUMMARIZER_PROVIDER=openrouter
SUMMARIZER_MODEL=openai/gpt-oss-20b:free
OPENROUTER_API_KEY=sk-or-v1-...
```

**Pros:**
- Free tier available
- High-quality models
- No infrastructure needed

**Cons:**
- Requires internet connection
- API rate limits

### Gemini

Good for both embeddings and summarization with generous free tier.

```env
EMBEDDING_PROVIDER=gemini
EMBEDDING_MODEL=models/text-embedding-004
SUMMARIZER_PROVIDER=gemini
SUMMARIZER_MODEL=gemini-pro
GEMINI_API_KEY=AIzaSy...
```

**Pros:**
- Generous free tier
- Good quality
- Fast response

**Cons:**
- Google account required
- Rate limits on free tier

### Ollama (Local)

Best for privacy and offline usage.

```env
EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text:v1.5
SUMMARIZER_PROVIDER=ollama
SUMMARIZER_MODEL=llama2
OLLAMA_API_URL=http://localhost:11434
```

**Pros:**
- Completely local and private
- No API costs
- No internet required

**Cons:**
- Requires local setup
- Hardware requirements (GPU recommended)
- Slower than cloud options

### Ollama Cloud

Use cloud Ollama with API key.

```env
EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text:v1.5
SUMMARIZER_PROVIDER=ollama
SUMMARIZER_MODEL=llama2
OLLAMA_API_URL=https://cloud.ollama.com
OLLAMA_API_KEY=your_ollama_cloud_key
```

### FastEmbed (Local Fallback)

Used automatically as fallback when other providers fail. No configuration needed.

```env
EMBEDDING_PROVIDER=fastembed
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
```

**Pros:**
- Completely local
- No API key required
- Fast
- Automatic fallback

**Cons:**
- Smaller model (lower quality than cloud options)
- Only for embeddings (not summarization)

### Mixed Providers

Use different providers for different purposes:

```env
# OpenRouter for embeddings (better quality)
EMBEDDING_PROVIDER=openrouter
EMBEDDING_MODEL=qwen/qwen3-embedding-8b
OPENROUTER_API_KEY=sk-or-v1-...

# Gemini for summarization (generous free tier)
SUMMARIZER_PROVIDER=gemini
SUMMARIZER_MODEL=gemini-pro
GEMINI_API_KEY=AIzaSy...
```

## Qdrant Setup

### Cloud Qdrant

1. Create account at [https://cloud.qdrant.io](https://cloud.qdrant.io)
2. Create a cluster
3. Get your URL and API key
4. Set in config:

```env
QDRANT_URL=https://your-cluster.cloud.qdrant.io
QDRANT_API_KEY=your_api_key
```

### Self-Hosted Qdrant (Docker)

```bash
docker run -p 6333:6333 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

Configuration:

```env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=  # Optional for local instance
```

### Qdrant with Authentication

For production setups:

```bash
docker run -p 6333:6333 \
  -e QDRANT__SERVICE__API_KEY=your_secret_key \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

Configuration:

```env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_secret_key
```

## Testing Configuration

### Using MCP Inspector

Test your configuration without an AI assistant:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This opens a web interface at `http://localhost:6274` where you can:
- See all available tools
- Test tool calls with parameters
- View responses
- Debug issues

### Using CLI

Test directly from command line:

```bash
# Start the server
npm start

# In another terminal, test with stdio
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

### Environment Variable Check

Verify your configuration is loaded:

```bash
# Create a test script
cat > test-config.js << 'EOF'
import 'dotenv/config';
import { config } from './dist/config.js';
console.log('QDRANT_URL:', config.QDRANT_URL);
console.log('EMBEDDING_PROVIDER:', config.EMBEDDING_PROVIDER);
console.log('SUMMARIZER_PROVIDER:', config.SUMMARIZER_PROVIDER);
console.log('Has QDRANT_API_KEY:', !!config.QDRANT_API_KEY);
console.log('Has OPENROUTER_API_KEY:', !!config.OPENROUTER_API_KEY);
EOF

npm run build && node test-config.js
```

## Troubleshooting

### "Cannot connect to Qdrant"

Check:
- [ ] QDRANT_URL is correct
- [ ] Qdrant service is running
- [ ] Network connectivity
- [ ] Firewall rules

Test connection:
```bash
curl $QDRANT_URL/collections
```

### "Authentication failed"

Check:
- [ ] QDRANT_API_KEY is set
- [ ] API key is valid
- [ ] API key has correct permissions

### "Embedding provider failed"

Check:
- [ ] Provider API key is set correctly
- [ ] API key is valid and has credits
- [ ] Provider service is accessible
- [ ] Model name is correct

The system will automatically fall back to FastEmbed for embeddings.

### "MCP server not showing in IDE"

Check:
- [ ] Configuration file is in correct location
- [ ] JSON syntax is valid
- [ ] Server path/command is correct
- [ ] Restart IDE after config changes

Validate JSON:
```bash
cat mcp.json | jq .
```

### "Permission denied" errors

Check:
- [ ] MCP server has execute permissions
- [ ] Node.js is installed and in PATH
- [ ] No firewall blocking local connections

Fix permissions:
```bash
chmod +x node_modules/memory-qdrant-mcp/dist/index.js
```

## Security Best Practices

### API Key Management

**DO:**
- ✅ Use environment variables
- ✅ Store keys in secure vaults
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/prod
- ✅ Restrict key permissions

**DON'T:**
- ❌ Commit keys to version control
- ❌ Share keys in chat/email
- ❌ Use production keys in development
- ❌ Hardcode keys in config files

### .env File Security

```bash
# Add to .gitignore
echo ".env" >> .gitignore

# Set restrictive permissions
chmod 600 .env

# Never commit .env.example with real keys
```

### Network Security

For production deployments:
- Use HTTPS for Qdrant connection
- Enable API key authentication on Qdrant
- Use VPC/private networks when possible
- Implement rate limiting
- Monitor API usage

## Performance Tuning

### Cache Configuration

Adjust cache sizes based on usage:

```env
# Larger caches for high-volume usage
CACHE_TTL_SECONDS=7200
EMBEDDING_CACHE_SIZE=1000
QUERY_CACHE_SIZE=500
```

### Provider Selection

**For performance:**
- Use OpenRouter (fast cloud API)
- Use FastEmbed for offline/low-latency needs

**For cost:**
- Use FastEmbed (free, local)
- Use OpenRouter free tier
- Use Gemini free tier

**For quality:**
- Use OpenRouter with premium models
- Use Gemini for summarization

### Qdrant Optimization

For large-scale deployments:

```env
# Increase connection pool
QDRANT_MAX_CONNECTIONS=20

# Use SSD storage for Qdrant
# Enable HNSW index optimization
# Use collection aliases for zero-downtime updates
```

## Next Steps

- See [SKILL.md](SKILL.md) for usage instructions
- See [API-REFERENCE.md](API-REFERENCE.md) for complete tool documentation
- See [EXAMPLES.md](EXAMPLES.md) for workflow examples
