---
name: memory-qdrant-mcp
description: Advanced memory management system using Qdrant vector database. Use this when you need to store and retrieve context, decisions, progress, or patterns across conversations. Provides 35 tools for semantic search, context management, decision logging, progress tracking, knowledge graphs, and conversation analysis. Use when the user asks to remember something, recall past decisions, track progress, or search conversation history.
---

# Memory Qdrant MCP

A comprehensive memory management system that provides persistent storage and semantic search capabilities using Qdrant vector database.

## When to use this Skill

Use this Skill when you need to:
- **Remember context** across multiple conversations
- **Store decisions** made during development
- **Track progress** on tasks and features
- **Recall information** from past conversations
- **Search semantically** through project history
- **Manage project context** (product overview, active work)
- **Build knowledge graphs** linking related concepts
- **Analyze conversations** to extract insights
- **Store patterns** and architectural decisions

## Quick Start

### Initialize a new project

```python
# Always start by initializing the workspace
result = use_mcp_tool("memory-qdrant-mcp", "initialize_workspace", {
    "project_name": "my-app",
    "workspace_info": {
        "description": "E-commerce application",
        "tech_stack": ["Node.js", "React", "PostgreSQL"]
    }
})
```

### Store information

```python
# Log a memory entry
use_mcp_tool("memory-qdrant-mcp", "log_memory", {
    "project_name": "my-app",
    "memory_type": "decision",
    "content": "Decided to use JWT for authentication"
})

# Log a decision
use_mcp_tool("memory-qdrant-mcp", "log_decision", {
    "project_name": "my-app",
    "decision_text": "Using PostgreSQL with pgvector for similarity search"
})

# Track progress
use_mcp_tool("memory-qdrant-mcp", "log_progress", {
    "project_name": "my-app",
    "progress_text": "Implemented user authentication system"
})
```

### Retrieve information

```python
# Query memory with natural language
results = use_mcp_tool("memory-qdrant-mcp", "query_memory", {
    "project_name": "my-app",
    "query_text": "What authentication method did we choose?",
    "top_k": 3
})

# Semantic search across all memory
results = use_mcp_tool("memory-qdrant-mcp", "semantic_search", {
    "project_name": "my-app",
    "query_text": "database decisions",
    "limit": 5
})

# Get all decisions
decisions = use_mcp_tool("memory-qdrant-mcp", "get_decisions", {
    "project_name": "my-app",
    "limit": 10
})
```

## Core Tools

### Memory Operations (5 tools)

**log_memory** - Store any information in vector database
```python
use_mcp_tool("memory-qdrant-mcp", "log_memory", {
    "project_name": "project-name",
    "memory_type": "conversation|codeContext|architecture|decision",
    "content": "The information to store",
    "top_level_id": "optional-parent-id"
})
```

**query_memory** - Search memory with semantic similarity
```python
results = use_mcp_tool("memory-qdrant-mcp", "query_memory", {
    "project_name": "project-name",
    "query_text": "natural language query",
    "memory_type": "optional-filter",
    "top_k": 3  # number of results
})
```

**query_memory_summarized** - Query and auto-summarize results to save tokens
```python
summary = use_mcp_tool("memory-qdrant-mcp", "query_memory_summarized", {
    "project_name": "project-name",
    "query_text": "what features were implemented?"
})
```

**batch_log_memory** - Store multiple entries efficiently
```python
use_mcp_tool("memory-qdrant-mcp", "batch_log_memory", {
    "project_name": "project-name",
    "entries": [
        {"memoryType": "decision", "content": "First decision"},
        {"memoryType": "progress", "content": "Completed task"}
    ]
})
```

**batch_query_memory** - Query multiple topics at once
```python
results = use_mcp_tool("memory-qdrant-mcp", "batch_query_memory", {
    "project_name": "project-name",
    "queries": [
        {"queryText": "authentication approach"},
        {"queryText": "database schema"}
    ]
})
```

### Context Management (6 tools)

**update_product_context** - Store long-term project information
```python
use_mcp_tool("memory-qdrant-mcp", "update_product_context", {
    "project_name": "project-name",
    "content": {
        "purpose": "Project purpose",
        "target_users": "Who uses this",
        "key_features": ["Feature 1", "Feature 2"]
    }
})
```

**get_product_context** - Retrieve project overview
```python
context = use_mcp_tool("memory-qdrant-mcp", "get_product_context", {
    "project_name": "project-name"
})
```

**update_active_context** - Store current work focus
```python
use_mcp_tool("memory-qdrant-mcp", "update_active_context", {
    "project_name": "project-name",
    "patch_content": {
        "current_task": "Implementing authentication",
        "blockers": ["Need API keys"],
        "next_steps": ["Test login flow"]
    }
})
```

**get_active_context** - Retrieve current work state
```python
context = use_mcp_tool("memory-qdrant-mcp", "get_active_context", {
    "project_name": "project-name"
})
```

**get_context_history** - View context changes over time
```python
history = use_mcp_tool("memory-qdrant-mcp", "get_context_history", {
    "project_name": "project-name",
    "context_type": "product",  # or "active"
    "limit": 10
})
```

**batch_update_context** - Update multiple contexts efficiently
```python
use_mcp_tool("memory-qdrant-mcp", "batch_update_context", {
    "project_name": "project-name",
    "updates": [
        {
            "contextType": "productContext",
            "patchContent": {"version": "2.0"}
        }
    ]
})
```

### Decision Tracking (3 tools)

**log_decision** - Record important decisions
```python
use_mcp_tool("memory-qdrant-mcp", "log_decision", {
    "project_name": "project-name",
    "decision_text": "Decision with rationale"
})
```

**get_decisions** - Retrieve all decisions
```python
decisions = use_mcp_tool("memory-qdrant-mcp", "get_decisions", {
    "project_name": "project-name",
    "limit": 10
})
```

**search_decisions_fts** - Full-text search for decisions
```python
results = use_mcp_tool("memory-qdrant-mcp", "search_decisions_fts", {
    "project_name": "project-name",
    "query_term": "authentication"
})
```

### Progress Tracking (4 tools)

**log_progress** - Record task completion or milestones
```python
progress_id = use_mcp_tool("memory-qdrant-mcp", "log_progress", {
    "project_name": "project-name",
    "progress_text": "Completed user registration API"
})
```

**get_progress_with_status** - Filter progress by status
```python
tasks = use_mcp_tool("memory-qdrant-mcp", "get_progress_with_status", {
    "project_name": "project-name",
    "status": "in_progress",  # pending, in_progress, completed, blocked
    "limit": 10
})
```

**update_progress_with_status** - Update task status
```python
use_mcp_tool("memory-qdrant-mcp", "update_progress_with_status", {
    "project_name": "project-name",
    "progress_id": "id-from-log-progress",
    "status": "completed",
    "notes": "All tests passing"
})
```

**search_progress_entries** - Search progress with filters
```python
results = use_mcp_tool("memory-qdrant-mcp", "search_progress_entries", {
    "project_name": "project-name",
    "query_term": "authentication",
    "status": "completed"
})
```

## Advanced Features

### Semantic Search

Use semantic search to find information across all memory types:

```python
results = use_mcp_tool("memory-qdrant-mcp", "semantic_search", {
    "project_name": "project-name",
    "query_text": "all discussions about database design",
    "limit": 10,
    "memory_types": ["decision", "conversation"]  # optional filter
})
```

### Knowledge Graphs

Link related concepts to build knowledge graphs:

```python
# Create a link between memories
link_id = use_mcp_tool("memory-qdrant-mcp", "create_knowledge_link", {
    "project_name": "project-name",
    "source_id": "memory-id-1",
    "target_id": "memory-id-2",
    "link_type": "implements",  # related_to, depends_on, implements
    "metadata": {"reason": "Feature implements this decision"}
})

# Get all links for an entity
links = use_mcp_tool("memory-qdrant-mcp", "get_knowledge_links", {
    "project_name": "project-name",
    "entity_id": "memory-id",
    "direction": "both"  # outgoing, incoming, both
})
```

### System Patterns

Store and search architectural patterns and coding standards:

```python
# Store patterns
use_mcp_tool("memory-qdrant-mcp", "update_system_patterns", {
    "project_name": "project-name",
    "patterns": [
        "Always use TypeScript strict mode",
        "API routes follow RESTful conventions",
        "Components use functional style with hooks"
    ]
})

# Search patterns
patterns = use_mcp_tool("memory-qdrant-mcp", "search_system_patterns", {
    "project_name": "project-name",
    "query_text": "API design patterns",
    "limit": 5
})
```

### Custom Data Storage

Store arbitrary structured data with semantic search:

```python
# Store custom data
data_id = use_mcp_tool("memory-qdrant-mcp", "store_custom_data", {
    "project_name": "project-name",
    "data": {"schema": "users", "columns": ["id", "email"]},
    "data_type": "database_schema",
    "metadata": {"table": "users"}
})

# Search custom data semantically
results = use_mcp_tool("memory-qdrant-mcp", "search_custom_data", {
    "project_name": "project-name",
    "query_text": "user authentication schema",
    "data_type": "database_schema"
})
```

## Common Workflows

### Workflow 1: Starting a new project

```python
# 1. Initialize workspace
use_mcp_tool("memory-qdrant-mcp", "initialize_workspace", {
    "project_name": "new-app"
})

# 2. Set product context
use_mcp_tool("memory-qdrant-mcp", "update_product_context", {
    "project_name": "new-app",
    "content": {
        "purpose": "Build a task management app",
        "tech_stack": ["React", "Node.js", "PostgreSQL"],
        "target_users": "Small teams"
    }
})

# 3. Set initial active context
use_mcp_tool("memory-qdrant-mcp", "update_active_context", {
    "project_name": "new-app",
    "content": {
        "current_phase": "Planning",
        "next_milestone": "Complete MVP"
    }
})
```

### Workflow 2: During development sessions

```python
# When user shares information worth remembering
if user_shares_important_info:
    use_mcp_tool("memory-qdrant-mcp", "log_memory", {
        "project_name": "project-name",
        "memory_type": "conversation",
        "content": extracted_information
    })

# When a decision is made
if decision_made:
    use_mcp_tool("memory-qdrant-mcp", "log_decision", {
        "project_name": "project-name",
        "decision_text": f"{decision} because {rationale}"
    })

# When work is completed
if task_completed:
    use_mcp_tool("memory-qdrant-mcp", "log_progress", {
        "project_name": "project-name",
        "progress_text": task_description
    })
```

### Workflow 3: Recalling context

```python
# At the start of a new conversation
product = use_mcp_tool("memory-qdrant-mcp", "get_product_context", {
    "project_name": "project-name"
})

active = use_mcp_tool("memory-qdrant-mcp", "get_active_context", {
    "project_name": "project-name"
})

# When user asks about past decisions
relevant = use_mcp_tool("memory-qdrant-mcp", "query_memory", {
    "project_name": "project-name",
    "query_text": user_question,
    "top_k": 5
})
```

### Workflow 4: Export and backup

```python
# Export all memory to markdown
markdown = use_mcp_tool("memory-qdrant-mcp", "export_memory_to_markdown", {
    "project_name": "project-name",
    "include_types": ["decision", "progress", "pattern"]  # optional filter
})

# Save to file or share with user
```

## Best Practices

### 1. Consistent project naming
Always use the same `project_name` for related operations. Names are case-sensitive.

### 2. Descriptive memory types
Use clear, consistent memory type names:
- `conversation` - Important information from discussions
- `codeContext` - Code architecture and structure notes
- `architecture` - High-level design decisions
- `decision` - Specific decisions with rationale
- `pattern` - Reusable patterns and standards

### 3. Update context regularly
Keep product and active context up-to-date:
- Update `product_context` when project goals or scope changes
- Update `active_context` at the start of each work session

### 4. Use batch operations for efficiency
When processing multiple items, use batch tools:
- `batch_log_memory` for multiple memory entries
- `batch_query_memory` for multiple questions
- `batch_update_context` for context updates

### 5. Leverage semantic search
Use `semantic_search` when you need to find information but don't know exact keywords. It understands meaning, not just text matching.

### 6. Track progress with status
Use the status-based progress tools to maintain a task board:
- Log new tasks as `pending`
- Update to `in_progress` when starting
- Mark `completed` when done
- Use `blocked` for tasks waiting on dependencies

### 7. Build knowledge graphs
Link related memories to show relationships:
```python
# Link a feature implementation to the original decision
use_mcp_tool("memory-qdrant-mcp", "create_knowledge_link", {
    "project_name": "project-name",
    "source_id": feature_id,
    "target_id": decision_id,
    "link_type": "implements"
})
```

### 8. Export regularly
Export memory to markdown periodically for backups and version control.

## Performance Tips

- **Use summarized queries** (`query_memory_summarized`) when retrieving large amounts of context to save tokens
- **Batch operations** reduce API calls and improve throughput
- **Limit results** using `top_k` or `limit` parameters to avoid overwhelming context
- **Filter by type** when searching to narrow results
- **Cache is automatic** - embeddings and queries are cached for performance

## Troubleshooting

### Memory not found
- Verify `project_name` matches exactly (case-sensitive)
- Check that memory was logged successfully (save the returned ID)

### Search returns irrelevant results
- Try more specific query text
- Use `memory_type` filter to narrow results
- Increase `top_k` to see more candidates
- Consider using `search_decisions_fts` for exact text matching

### Performance issues
- Reduce `top_k` or `limit` parameters
- Use batch operations instead of individual calls
- Use `query_memory_summarized` instead of `query_memory` for large result sets

## Configuration

This MCP server requires environment variables. Common configurations:

**OpenRouter (Recommended)**
```env
QDRANT_URL=https://your-qdrant-instance.com
QDRANT_API_KEY=your-key
EMBEDDING_PROVIDER=openrouter
EMBEDDING_MODEL=qwen/qwen3-embedding-8b
SUMMARIZER_PROVIDER=openrouter
SUMMARIZER_MODEL=openai/gpt-oss-20b:free
OPENROUTER_API_KEY=your-openrouter-key
```

**Local FastEmbed (No API keys needed)**
```env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-key
EMBEDDING_PROVIDER=fastembed
SUMMARIZER_PROVIDER=openrouter
OPENROUTER_API_KEY=your-key
```

See [MCP-CONFIG.md](MCP-CONFIG.md) for detailed configuration examples.

## Additional Resources

- **Detailed API Reference**: [API-REFERENCE.md](API-REFERENCE.md)
- **MCP Configuration Examples**: [MCP-CONFIG.md](MCP-CONFIG.md)
- **Example Workflows**: [EXAMPLES.md](EXAMPLES.md)

For more information, visit the [GitHub repository](https://github.com/balaji-g42/memory-qdrant-mcp).
