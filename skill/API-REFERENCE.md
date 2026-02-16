# API Reference

Complete reference for all 35 Memory Qdrant MCP tools.

## Core Memory Operations

### log_memory

Store any information in the vector database with semantic search capability.

**Parameters:**
- `project_name` (string, required): Name of the project
- `memory_type` (string, required): Type of memory (e.g., 'conversation', 'codeContext', 'architecture', 'decision')
- `content` (string, required): The information to store
- `top_level_id` (string, optional): Parent ID for hierarchical organization

**Returns:** String - The ID of the logged memory entry

**Example:**
```python
memory_id = use_mcp_tool("memory-qdrant-mcp", "log_memory", {
    "project_name": "my-app",
    "memory_type": "decision",
    "content": "Decided to use PostgreSQL for the database",
    "top_level_id": "epic-123"
})
# Returns: "mem_abc123..."
```

### query_memory

Search memory entries using semantic similarity.

**Parameters:**
- `project_name` (string, required): Name of the project
- `query_text` (string, required): Natural language query
- `memory_type` (string, optional): Filter by specific memory type
- `top_k` (number, optional, default: 3): Number of results to return

**Returns:** Array of memory entries with scores

**Example:**
```python
results = use_mcp_tool("memory-qdrant-mcp", "query_memory", {
    "project_name": "my-app",
    "query_text": "What database did we choose?",
    "memory_type": "decision",
    "top_k": 5
})
# Returns: [
#   {"id": "mem_123", "content": "...", "score": 0.95, "memory_type": "decision"},
#   ...
# ]
```

### query_memory_summarized

Query memory and automatically summarize results to reduce token usage.

**Parameters:**
- `project_name` (string, required): Name of the project
- `query_text` (string, required): Natural language query
- `memory_type` (string, optional): Filter by specific memory type
- `top_k` (number, optional, default: 3): Number of results to retrieve before summarizing

**Returns:** String - Summarized text

**Example:**
```python
summary = use_mcp_tool("memory-qdrant-mcp", "query_memory_summarized", {
    "project_name": "my-app",
    "query_text": "summarize all authentication decisions"
})
# Returns: "The team decided to use JWT with refresh tokens..."
```

### batch_log_memory

Log multiple memory entries efficiently in one operation.

**Parameters:**
- `project_name` (string, required): Name of the project
- `entries` (array, required): Array of entry objects
  - Each entry: `{"memoryType": string, "content": string, "topLevelId": string (optional)}`

**Returns:** Array of IDs for the logged entries

**Example:**
```python
ids = use_mcp_tool("memory-qdrant-mcp", "batch_log_memory", {
    "project_name": "my-app",
    "entries": [
        {"memoryType": "decision", "content": "Using React for frontend"},
        {"memoryType": "decision", "content": "Using Node.js for backend"}
    ]
})
# Returns: ["mem_123", "mem_456"]
```

### batch_query_memory

Execute multiple memory queries efficiently in one operation.

**Parameters:**
- `project_name` (string, required): Name of the project
- `queries` (array, required): Array of query objects
  - Each query: `{"queryText": string, "memoryType": string (optional), "topK": number (optional)}`

**Returns:** Array of result arrays, one for each query

**Example:**
```python
results = use_mcp_tool("memory-qdrant-mcp", "batch_query_memory", {
    "project_name": "my-app",
    "queries": [
        {"queryText": "authentication approach"},
        {"queryText": "database schema design"}
    ]
})
# Returns: [[...results for query 1], [...results for query 2]]
```

## Context Management

### get_product_context

Retrieve the product context (long-term project information).

**Parameters:**
- `project_name` (string, required): Name of the project

**Returns:** Object - Product context data

**Example:**
```python
context = use_mcp_tool("memory-qdrant-mcp", "get_product_context", {
    "project_name": "my-app"
})
# Returns: {"purpose": "E-commerce platform", "tech_stack": [...], ...}
```

### update_product_context

Update the product context with new or modified information.

**Parameters:**
- `project_name` (string, required): Name of the project
- `content` (object, optional): Full replacement content
- `patch_content` (object, optional): Partial content to merge

**Note:** Provide either `content` (full replace) OR `patch_content` (merge), not both.

**Returns:** String - ID of the updated context entry

**Example:**
```python
# Full replace
use_mcp_tool("memory-qdrant-mcp", "update_product_context", {
    "project_name": "my-app",
    "content": {
        "purpose": "Task management app",
        "users": "Small teams"
    }
})

# Partial update (merge)
use_mcp_tool("memory-qdrant-mcp", "update_product_context", {
    "project_name": "my-app",
    "patch_content": {
        "version": "2.0",
        "new_feature": "Real-time collaboration"
    }
})
```

### get_active_context

Retrieve the active context (current work focus).

**Parameters:**
- `project_name` (string, required): Name of the project

**Returns:** Object - Active context data

**Example:**
```python
context = use_mcp_tool("memory-qdrant-mcp", "get_active_context", {
    "project_name": "my-app"
})
# Returns: {"current_task": "Auth implementation", "blockers": [...], ...}
```

### update_active_context

Update the active context with current work information.

**Parameters:**
- `project_name` (string, required): Name of the project
- `content` (object, optional): Full replacement content
- `patch_content` (object, optional): Partial content to merge

**Note:** Provide either `content` (full replace) OR `patch_content` (merge), not both.

**Returns:** String - ID of the updated context entry

**Example:**
```python
use_mcp_tool("memory-qdrant-mcp", "update_active_context", {
    "project_name": "my-app",
    "patch_content": {
        "current_task": "Testing authentication flow",
        "completed_today": ["User registration", "Login endpoint"]
    }
})
```

### get_context_history

Retrieve history of context changes over time.

**Parameters:**
- `project_name` (string, required): Name of the project
- `context_type` (enum, required): Type of context - "product" or "active"
- `limit` (number, optional, default: 10): Maximum number of history entries

**Returns:** Array of historical context entries

**Example:**
```python
history = use_mcp_tool("memory-qdrant-mcp", "get_context_history", {
    "project_name": "my-app",
    "context_type": "active",
    "limit": 20
})
# Returns: [{timestamp, content, ...}, ...]
```

### batch_update_context

Update multiple context types efficiently in one operation.

**Parameters:**
- `project_name` (string, required): Name of the project
- `updates` (array, required): Array of update objects
  - Each update: `{"contextType": "productContext"|"activeContext", "patchContent": object}`

**Returns:** Object with result IDs

**Example:**
```python
use_mcp_tool("memory-qdrant-mcp", "batch_update_context", {
    "project_name": "my-app",
    "updates": [
        {
            "contextType": "productContext",
            "patchContent": {"version": "2.0"}
        },
        {
            "contextType": "activeContext",
            "patchContent": {"sprint": "Sprint 15"}
        }
    ]
})
```

## Decision Tracking

### log_decision

Record an important decision with rationale.

**Parameters:**
- `project_name` (string, required): Name of the project
- `decision_text` (string, required): The decision and its rationale
- `top_level_id` (string, optional): Parent ID for grouping

**Returns:** String - Decision ID

**Example:**
```python
decision_id = use_mcp_tool("memory-qdrant-mcp", "log_decision", {
    "project_name": "my-app",
    "decision_text": "Using JWT tokens because they're stateless and scale well"
})
```

### get_decisions

Retrieve all logged decisions with optional filtering.

**Parameters:**
- `project_name` (string, required): Name of the project
- `limit` (number, optional, default: 10): Maximum number of decisions
- `tags_filter_include_all` (array of strings, optional): Tags that must all be present
- `tags_filter_include_any` (array of strings, optional): Tags where at least one must be present

**Returns:** Array of decision entries

**Example:**
```python
decisions = use_mcp_tool("memory-qdrant-mcp", "get_decisions", {
    "project_name": "my-app",
    "limit": 20
})
```

### search_decisions_fts

Full-text search through decisions.

**Parameters:**
- `project_name` (string, required): Name of the project
- `query_term` (string, required): Search term (exact text matching)
- `limit` (number, optional, default: 10): Maximum results

**Returns:** Array of matching decisions

**Example:**
```python
results = use_mcp_tool("memory-qdrant-mcp", "search_decisions_fts", {
    "project_name": "my-app",
    "query_term": "authentication"
})
```

## Progress Tracking

### log_progress

Record progress, task completion, or milestones.

**Parameters:**
- `project_name` (string, required): Name of the project
- `progress_text` (string, required): Description of the progress
- `top_level_id` (string, optional): Parent ID for grouping

**Returns:** String - Progress entry ID

**Example:**
```python
progress_id = use_mcp_tool("memory-qdrant-mcp", "log_progress", {
    "project_name": "my-app",
    "progress_text": "Completed user registration API endpoint with validation"
})
```

### get_progress_with_status

Retrieve progress entries filtered by status.

**Parameters:**
- `project_name` (string, required): Name of the project
- `status` (enum, optional): Status filter - "pending", "in_progress", "completed", "blocked"
- `limit` (number, optional, default: 10): Maximum results

**Returns:** Array of progress entries

**Example:**
```python
tasks = use_mcp_tool("memory-qdrant-mcp", "get_progress_with_status", {
    "project_name": "my-app",
    "status": "in_progress",
    "limit": 5
})
```

### update_progress_with_status

Update the status of a progress entry.

**Parameters:**
- `project_name` (string, required): Name of the project
- `progress_id` (string, required): ID of the progress entry to update
- `status` (enum, required): New status - "pending", "in_progress", "completed", "blocked"
- `notes` (string, optional): Additional notes about the status change

**Returns:** String - Update result ID

**Example:**
```python
use_mcp_tool("memory-qdrant-mcp", "update_progress_with_status", {
    "project_name": "my-app",
    "progress_id": "prog_123",
    "status": "completed",
    "notes": "All unit tests passing, code reviewed"
})
```

### search_progress_entries

Search progress entries with text and optional status filter.

**Parameters:**
- `project_name` (string, required): Name of the project
- `query_term` (string, required): Search term
- `status` (enum, optional): Status filter - "pending", "in_progress", "completed", "blocked"
- `limit` (number, optional, default: 10): Maximum results

**Returns:** Array of matching progress entries

**Example:**
```python
results = use_mcp_tool("memory-qdrant-mcp", "search_progress_entries", {
    "project_name": "my-app",
    "query_term": "authentication",
    "status": "completed"
})
```

## Search Tools

### semantic_search

Perform semantic search across all memory types using embeddings.

**Parameters:**
- `project_name` (string, required): Name of the project
- `query_text` (string, required): Natural language query
- `limit` (number, optional, default: 10): Maximum results
- `memory_types` (array of strings, optional): Filter by specific memory types

**Returns:** Array of matching entries across all memory types

**Example:**
```python
results = use_mcp_tool("memory-qdrant-mcp", "semantic_search", {
    "project_name": "my-app",
    "query_text": "all discussions about database performance",
    "limit": 15,
    "memory_types": ["decision", "conversation"]
})
```

## Knowledge Graph

### create_knowledge_link

Create a relationship link between two memory entities.

**Parameters:**
- `project_name` (string, required): Name of the project
- `source_id` (string, required): ID of the source entity
- `target_id` (string, required): ID of the target entity
- `link_type` (string, required): Type of relationship (e.g., "related_to", "depends_on", "implements")
- `metadata` (object, optional): Additional metadata about the link

**Returns:** String - Link ID

**Example:**
```python
link_id = use_mcp_tool("memory-qdrant-mcp", "create_knowledge_link", {
    "project_name": "my-app",
    "source_id": "mem_feature_123",
    "target_id": "mem_decision_456",
    "link_type": "implements",
    "metadata": {"confidence": "high"}
})
```

### get_knowledge_links

Retrieve knowledge links for an entity.

**Parameters:**
- `project_name` (string, required): Name of the project
- `entity_id` (string, required): ID of the entity
- `link_type` (string, optional): Filter by link type
- `direction` (enum, optional, default: "both"): Direction - "outgoing", "incoming", "both"

**Returns:** Array of links

**Example:**
```python
links = use_mcp_tool("memory-qdrant-mcp", "get_knowledge_links", {
    "project_name": "my-app",
    "entity_id": "mem_123",
    "link_type": "implements",
    "direction": "outgoing"
})
```

## System Patterns

### get_system_patterns

Retrieve stored system patterns and standards.

**Parameters:**
- `project_name` (string, required): Name of the project
- `limit` (number, optional, default: 50): Maximum patterns to return

**Returns:** Array of pattern strings

**Example:**
```python
patterns = use_mcp_tool("memory-qdrant-mcp", "get_system_patterns", {
    "project_name": "my-app"
})
```

### update_system_patterns

Store or update system patterns.

**Parameters:**
- `project_name` (string, required): Name of the project
- `patterns` (array of strings, required): Pattern descriptions

**Returns:** Array of pattern IDs

**Example:**
```python
use_mcp_tool("memory-qdrant-mcp", "update_system_patterns", {
    "project_name": "my-app",
    "patterns": [
        "All API routes must use async/await",
        "Database queries use prepared statements",
        "Error responses follow RFC 7807 Problem Details"
    ]
})
```

### search_system_patterns

Search patterns using semantic search.

**Parameters:**
- `project_name` (string, required): Name of the project
- `query_text` (string, required): Natural language query
- `limit` (number, optional, default: 10): Maximum results

**Returns:** Array of matching patterns with scores

**Example:**
```python
results = use_mcp_tool("memory-qdrant-mcp", "search_system_patterns", {
    "project_name": "my-app",
    "query_text": "error handling standards"
})
```

## Custom Data Storage

### store_custom_data

Store arbitrary structured data with semantic search capability.

**Parameters:**
- `project_name` (string, required): Name of the project
- `data` (any, required): The data to store
- `data_type` (string, required): Type identifier for the data
- `metadata` (object, optional): Additional metadata

**Returns:** String - Data entry ID

**Example:**
```python
data_id = use_mcp_tool("memory-qdrant-mcp", "store_custom_data", {
    "project_name": "my-app",
    "data": {
        "table": "users",
        "columns": ["id", "email", "created_at"],
        "indexes": ["email"]
    },
    "data_type": "database_schema",
    "metadata": {"version": "1.0"}
})
```

### get_custom_data

Retrieve custom data by ID.

**Parameters:**
- `project_name` (string, required): Name of the project
- `data_id` (string, required): ID of the data entry

**Returns:** Object - The stored data

**Example:**
```python
data = use_mcp_tool("memory-qdrant-mcp", "get_custom_data", {
    "project_name": "my-app",
    "data_id": "data_123"
})
```

### query_custom_data

Query custom data with filters.

**Parameters:**
- `project_name` (string, required): Name of the project
- `data_type` (string, optional): Filter by data type
- `metadata_filter` (object, optional): Filter by metadata fields
- `limit` (number, optional, default: 50): Maximum results

**Returns:** Array of matching data entries

**Example:**
```python
schemas = use_mcp_tool("memory-qdrant-mcp", "query_custom_data", {
    "project_name": "my-app",
    "data_type": "database_schema",
    "metadata_filter": {"version": "1.0"}
})
```

### search_custom_data

Search custom data using semantic search.

**Parameters:**
- `project_name` (string, required): Name of the project
- `query_text` (string, required): Natural language query
- `data_type` (string, optional): Filter by data type
- `limit` (number, optional, default: 10): Maximum results

**Returns:** Array of matching data entries with scores

**Example:**
```python
results = use_mcp_tool("memory-qdrant-mcp", "search_custom_data", {
    "project_name": "my-app",
    "query_text": "user authentication schema",
    "data_type": "database_schema"
})
```

### update_custom_data

Update existing custom data entry.

**Parameters:**
- `project_name` (string, required): Name of the project
- `data_id` (string, required): ID of the data entry to update
- `data` (any, required): Updated data
- `metadata` (object, optional): Updated metadata

**Returns:** Boolean - Success indicator

**Example:**
```python
success = use_mcp_tool("memory-qdrant-mcp", "update_custom_data", {
    "project_name": "my-app",
    "data_id": "data_123",
    "data": {"table": "users", "columns": ["id", "email", "name"]},
    "metadata": {"version": "1.1"}
})
```

## Workspace Management

### initialize_workspace

Initialize a new workspace/project in the memory system.

**Parameters:**
- `project_name` (string, required): Name of the project to initialize
- `workspace_info` (object, optional): Initial workspace information

**Returns:** Object - Initialization result

**Example:**
```python
result = use_mcp_tool("memory-qdrant-mcp", "initialize_workspace", {
    "project_name": "new-app",
    "workspace_info": {
        "description": "Mobile task management app",
        "team_size": 5,
        "tech_stack": ["React Native", "Node.js"]
    }
})
```

### sync_memory

Synchronize memory between local and remote stores.

**Parameters:**
- `project_name` (string, required): Name of the project
- `sync_sources` (array, optional): Array of sync source configurations
  - Each source: `{"name": string, "type": string, "config": object (optional)}`

**Returns:** Object - Sync result

**Example:**
```python
result = use_mcp_tool("memory-qdrant-mcp", "sync_memory", {
    "project_name": "my-app",
    "sync_sources": [
        {"name": "git", "type": "repository", "config": {"branch": "main"}}
    ]
})
```

## Import/Export

### export_memory_to_markdown

Export project memory to markdown format.

**Parameters:**
- `project_name` (string, required): Name of the project
- `include_types` (array of strings, optional): Filter by specific memory types

**Returns:** String - Markdown formatted memory

**Example:**
```python
markdown = use_mcp_tool("memory-qdrant-mcp", "export_memory_to_markdown", {
    "project_name": "my-app",
    "include_types": ["decision", "progress"]
})
# Save to file or share with user
```

### import_memory_from_markdown

Import memory from markdown format.

**Parameters:**
- `project_name` (string, required): Name of the project
- `markdown_content` (string, required): Markdown content to import

**Returns:** Object - Import result with counts

**Example:**
```python
result = use_mcp_tool("memory-qdrant-mcp", "import_memory_from_markdown", {
    "project_name": "my-app",
    "markdown_content": markdown_string
})
# Returns: {"imported": 15, "skipped": 2, "errors": 0}
```

## Analysis

### summarize_text

Summarize the given text using configured summarizer.

**Parameters:**
- `text` (string, required): Text to summarize

**Returns:** String - Summary

**Example:**
```python
summary = use_mcp_tool("memory-qdrant-mcp", "summarize_text", {
    "text": long_text_content
})
```

### analyze_conversation

Analyze a conversation and extract key insights, decisions, and action items.

**Parameters:**
- `project_name` (string, required): Name of the project
- `conversation_text` (string, required): The conversation to analyze

**Returns:** Object - Analysis with insights, decisions, and action items

**Example:**
```python
analysis = use_mcp_tool("memory-qdrant-mcp", "analyze_conversation", {
    "project_name": "my-app",
    "conversation_text": conversation_transcript
})
# Returns: {
#   "insights": [...],
#   "decisions": [...],
#   "action_items": [...],
#   "key_topics": [...]
# }
```

## Status Enums

### ProgressStatus
- `pending` - Task not yet started
- `in_progress` - Task currently being worked on
- `completed` - Task finished
- `blocked` - Task waiting on dependencies

### ContextType
- `product` - Product/project context
- `active` - Active/current work context

### LinkDirection
- `outgoing` - Links from this entity to others
- `incoming` - Links to this entity from others
- `both` - All related links
