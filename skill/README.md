# Memory Qdrant MCP Agent Skill

A Claude Agent Skill that provides persistent memory management capabilities using Qdrant vector database. This Skill enables Claude to remember context, decisions, progress, and patterns across multiple conversations.

## What is an Agent Skill?

Agent Skills are filesystem-based modules that extend Claude's capabilities. They use progressive disclosure: metadata is always available (low token cost), detailed instructions load when needed, and supporting files load on-demand.

Learn more: [Agent Skills Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)

## Skill Structure

```
skill/
├── SKILL.md              # Main skill (YAML frontmatter + instructions)
├── API-REFERENCE.md      # Complete tool reference (35 tools)
├── MCP-CONFIG.md         # Configuration guide  
├── README.md             # This file
└── *.example.json        # MCP server config templates
```

**Progressive Loading:**
- **Level 1**: SKILL.md metadata (~100 tokens, always loaded)
- **Level 2**: SKILL.md instructions (loaded when triggered)
- **Level 3+**: Supporting files (loaded as referenced)

## Installation

### Claude.ai

1. **Create zip file:**
   ```bash
   cd skill
   zip -r ../memory-qdrant-mcp-skill.zip .
   ```

2. **Upload to Claude.ai:**
   - Settings → Features → Skills
   - Upload `memory-qdrant-mcp-skill.zip`

**Note:** Skills are per-user, not organization-wide.

### Claude Code

**Project-specific:**
```bash
mkdir -p .claude/skills/memory-qdrant-mcp
cp skill/* .claude/skills/memory-qdrant-mcp/
```

**Global (all projects):**
```bash
mkdir -p ~/.claude/skills/memory-qdrant-mcp
cp skill/* ~/.claude/skills/memory-qdrant-mcp/
```

Claude Code auto-discovers filesystem-based Skills.

### Claude API

```bash
# Create and encode zip
cd skill && zip -r ../memory-qdrant-mcp.zip . && cd ..
SKILL_DATA=$(base64 memory-qdrant-mcp.zip)

# Upload via API
curl -X POST https://api.anthropic.com/v1/skills \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-beta: skills-2025-10-02" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"memory-qdrant-mcp\", \"skill_data\": \"$SKILL_DATA\"}"
```

**Use in API calls:**
```python
import anthropic

client = anthropic.Anthropic(api_key="your-key")

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4096,
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    tools=[{"type": "code-execution", "container": {"skills": ["memory-qdrant-mcp"]}}],
    messages=[{"role": "user", "content": "Remember that we chose PostgreSQL"}]
)
```

### Agent SDK

Copy to SDK skills directory:
```bash
mkdir -p .claude/skills/memory-qdrant-mcp
cp skill/* .claude/skills/memory-qdrant-mcp/
```

Enable in SDK configuration:
```typescript
{
  "allowed_tools": ["Skill"],
  // SDK will auto-discover .claude/skills/
}
```

## MCP Server Configuration

This Skill works with the Memory Qdrant MCP server. Configure the server separately:

**Example configuration files included:**
- `claude-config.example.json` - For Claude Desktop
- `vscode-mcp-config.example.json` - For VS Code
- `cursor-config.example.json` - For Cursor IDE

**See [MCP-CONFIG.md](MCP-CONFIG.md) for complete setup instructions.**

## Quick Start

Once installed, Claude can use memory management automatically:

```
User: Remember that we decided to use JWT for authentication

Claude: [uses log_decision tool to store this]

---

User: What did we decide about authentication?

Claude: [uses query_memory to recall the decision]
Based on your previous decision, you chose JWT for authentication.
```

## Capabilities

This Skill provides 35 tools organized into 11 categories:

### Core Operations
- **Memory Management**: Store and retrieve any information with semantic search
- **Context Management**: Maintain product overview and active work state
- **Decision Logging**: Track important decisions with rationale
- **Progress Tracking**: Monitor tasks with status (pending/in_progress/completed/blocked)

### Advanced Features
- **Semantic Search**: Find information using natural language
- **Knowledge Graphs**: Link related concepts and decisions
- **System Patterns**: Store architectural standards and coding conventions
- **Custom Data**: Store arbitrary structured data with search
- **Batch Operations**: Efficiently process multiple items
- **Import/Export**: Backup memory to Markdown
- **Conversation Analysis**: Extract insights and action items

**See [SKILL.md](SKILL.md) for usage instructions and [API-REFERENCE.md](API-REFERENCE.md) for complete tool documentation.**

## Common Workflows

### Initialize Project
```python
use_mcp_tool("memory-qdrant-mcp", "initialize_workspace", {
    "project_name": "my-app",
    "workspace_info": {"tech_stack": ["React", "Node.js"]}
})
```

### Store Information
```python
use_mcp_tool("memory-qdrant-mcp", "log_memory", {
    "project_name": "my-app",
    "memory_type": "decision",
    "content": "Using PostgreSQL for the database"
})
```

### Recall Context
```python
results = use_mcp_tool("memory-qdrant-mcp", "query_memory", {
    "project_name": "my-app",
    "query_text": "What database are we using?",
    "top_k": 3
})
```

### Track Progress
```python
use_mcp_tool("memory-qdrant-mcp", "log_progress", {
    "project_name": "my-app",
    "progress_text": "Completed authentication module"
})
```

## Configuration Requirements

The MCP server requires these environment variables:

**Required:**
```env
QDRANT_URL=https://your-qdrant-instance.com
QDRANT_API_KEY=your_key
```

**Optional (with defaults):**
```env
EMBEDDING_PROVIDER=openrouter  # or gemini, ollama, fastembed
EMBEDDING_MODEL=qwen/qwen3-embedding-8b
SUMMARIZER_PROVIDER=openrouter  # or gemini, ollama
SUMMARIZER_MODEL=openai/gpt-oss-20b:free
OPENROUTER_API_KEY=your_key
```

**Provider Options:**
- **OpenRouter**: Cloud, requires API key (recommended)
- **Gemini**: Google AI, requires API key
- **Ollama**: Local or cloud, optional API key
- **FastEmbed**: Local, no API key (automatic fallback)

## Testing

Test with MCP Inspector:
```bash
cd /path/to/memory-qdrant-mcp
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

Opens http://localhost:6274 for interactive tool testing.

## Best Practices

1. **Consistent Project Names**: Use same `project_name` across operations (case-sensitive)

2. **Descriptive Memory Types**: Use clear types like:
   - `conversation` - Chat discussions
   - `codeContext` - Code structure notes
   - `architecture` - Design decisions
   - `decision` - Specific decisions

3. **Update Context Regularly**: 
   - `product_context` for long-term project info
   - `active_context` for current work focus

4. **Use Batch Operations**: When processing multiple items:
   - `batch_log_memory`
   - `batch_query_memory`
   - `batch_update_context`

5. **Leverage Semantic Search**: Use `semantic_search` for broad queries, understands meaning not just keywords

6. **Track Progress with Status**: Maintain task board with status updates

7. **Export Regularly**: Backup memory to Markdown periodically

## Troubleshooting

### Skill Not Available

**Claude.ai:**
- Check Settings → Features → Skills
- Verify zip uploaded successfully
- Skills are per-user, each team member must upload

**Claude Code:**
- Check `.claude/skills/memory-qdrant-mcp/SKILL.md` exists
- Verify YAML frontmatter is valid
- Restart Claude Code

**Claude API:**
- Verify skill uploaded via Skills API
- Check skill_id in API response
- Include correct betas in API call

### MCP Server Connection Errors

- Verify MCP server is configured separately
- Check QDRANT_URL and QDRANT_API_KEY
- Test with MCP Inspector
- See [MCP-CONFIG.md](MCP-CONFIG.md)

### Memory Not Found

- Ensure `project_name` matches exactly (case-sensitive)
- Verify memory was logged successfully
- Check Qdrant collection exists

## Security

⚠️ **Only use Skills from trusted sources.** Skills can execute code and invoke tools.

**Before using:**
- Review all markdown files (SKILL.md, API-REFERENCE.md, etc.)
- Check for unexpected external URLs or network calls
- Verify no sensitive data exposure
- Test in safe environment first

**API Keys:**
- Never commit keys to version control
- Use environment variables
- Rotate keys regularly
- Use different keys for dev/prod

## Documentation

- **[SKILL.md](SKILL.md)** - Main usage instructions and workflows
- **[API-REFERENCE.md](API-REFERENCE.md)** - Complete tool reference (35 tools)
- **[MCP-CONFIG.md](MCP-CONFIG.md)** - MCP server configuration guide

## Resources

- **GitHub**: [memory-qdrant-mcp](https://github.com/balaji-g42/memory-qdrant-mcp)
- **Agent Skills Docs**: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- **MCP Protocol**: https://modelcontextprotocol.io/
- **Qdrant**: https://qdrant.tech/

## License

MIT License

## Version

2.0.0 (TypeScript)
