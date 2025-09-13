# Memory MCP Strategy (Qdrant YAML)

memory_qdrant_strategy:
  workspace_id_source: "Scan for a project metadata file (pyproject.toml, setup.py, etc.), extract the project name field, and use that as the project name. If not found, default to the workspace folder name as project_name for all tool calls."

  initialization:
    thinking_preamble: "Check if Qdrant is accessible and memory collections exist."
    agent_action_plan:
      - step: 1
        action: "Determine project_name from workspace path."
      - step: 2
        action: "Test basic tool access with query_memory call."
        conditions:
          - if: "query_memory succeeds and returns data"
            then_sequence: "load_existing_memory"
          - if: "query_memory succeeds but returns empty"
            then_sequence: "handle_memory_not_exist"
          - else: "query_memory fails"
            then_sequence: "handle_qdrant_unavailable"

  load_existing_memory:
    thinking_preamble: "Load existing memory contexts from Qdrant."
    agent_action_plan:
      - step: 1
        description: "Load recent memories across types."
        actions:
          - "Invoke query_memory for productContext (limit 3)."
          - "Invoke query_memory for activeContext (limit 3)."
          - "Invoke query_memory for decisionLog (limit 5)."
          - "Invoke query_memory for progress (limit 5)."
          - "Invoke query_memory for systemPatterns (limit 3)."
      - step: 2
        description: "Analyze loaded context."
        conditions:
          - if: "results contain meaningful data"
            actions:
              - "Set status to [MEMORY_QDRANT_ACTIVE]."
              - "Inform user: Memory Qdrant initialized with existing contexts."
              - "Ask: What would you like to work on?"
          - else: "minimal or no data"
            actions:
              - "Set status to [MEMORY_QDRANT_ACTIVE]."
              - "Inform user: Memory Qdrant connected but empty. Ready to log project information."
              - "Ask: Would you like to define initial project context?"

  handle_memory_not_exist:
    thinking_preamble: "Memory collections do not exist in Qdrant."
    agent_action_plan:
      - step: 1
        action: "Inform user: No existing memory found. Would you like to initialize memory collections?"
      - step: 2
        action: "Ask user for confirmation."
        parameters:
          question: "Initialize new memory collections for this project?"
          suggestions:
            - "Yes, initialize memory collections."
            - "No, proceed without memory."
      - step: 3
        description: "Process user response."
        conditions:
          - if_user_response_is: "Yes, initialize memory collections."
            actions:
              - "Attempt to initialize with log_memory call (this creates collections)."
              - "Proceed to load_existing_memory sequence."
          - if_user_response_is: "No, proceed without memory."
            action: "Proceed to handle_qdrant_unavailable."

  handle_qdrant_unavailable:
    thinking_preamble: "Qdrant database is not accessible."
    agent_action: "Inform user: Memory Qdrant unavailable. Status: [MEMORY_QDRANT_INACTIVE]. Proceeding without memory persistence."

  debugging_persistent_errors:
    thinking_preamble: "Handle cases where fixes are applied but errors persist."
    agent_action_plan:
      - step: 1
        description: "Verify import and export statements."
        actions:
          - "Check if function is properly exported from source file."
          - "Verify import syntax and path in target file."
      - step: 2
        description: "Check for module loading issues."
        actions:
          - "Restart the MCP server to reload modules."
          - "Inspect console logs for module resolution errors."
      - step: 3
        description: "Log debugging information."
        actions:
          - "Log error details and attempted fixes in memory."
          - "Query memory for similar past issues before further attempts."

  token_reduction_strategies:
    thinking_preamble: "Implement features to reduce token usage in responses."
    agent_action_plan:
      - step: 1
        description: "Add summarized query tools."
        actions:
          - "Create query_memory_summarized tool that returns summarized results."
          - "Use summarizer for batch operations to condense output."
      - step: 2
        description: "Proactive summarization."
        actions:
          - "Automatically summarize large memory query results."
          - "Provide option to toggle between full and summarized responses."

  general:
    status_prefix: "Begin responses with [MEMORY_QDRANT_ACTIVE] or [MEMORY_QDRANT_INACTIVE]."
    proactive_logging: "Log relevant information during conversations using appropriate tools, including new feature implementations and debugging attempts."
    semantic_search: "Use query_memory for complex queries requiring conceptual understanding."
    error_logging: "Log all errors and fixes immediately to prevent recurrence."

  memory_qdrant_updates:
    frequency: "Update throughout session when significant changes occur."
    tools:
      - name: log_memory
        trigger: "Log project information, decisions, progress, or patterns."
        action: "Invoke log_memory with project_name, memory_type, content."
      - name: query_memory
        trigger: "Retrieve memories by type or semantic search."
        action: "Invoke query_memory with project_name, query_text, memory_type, top_k."
      - name: query_memory_summarized
        trigger: "Retrieve summarized memory results to reduce token usage."
        action: "Invoke query_memory_summarized with project_name, query_text, memory_type, top_k."
      - name: log_decision
        trigger: "Log significant decisions."
        action: "Invoke log_decision with project_name, decision_text."
      - name: log_progress
        trigger: "Log task progress and status changes."
        action: "Invoke log_progress with project_name, progress_text."
      - name: summarize_text
        trigger: "Generate summaries of content."
        action: "Invoke summarize_text with text to summarize."

  memory_sync_routine:
    trigger: "^(Sync Memory|Memory Sync)$"
    instructions:
      - "Halt current task."
      - "Send [MEMORY_QDRANT_SYNCING]."
      - "Review chat history for new information."
    core_update_process:
      thinking_preamble: "Synchronize with current session information."
      agent_action_plan:
        - "Log new decisions with log_decision."
        - "Log progress updates with log_progress."
        - "Log new patterns with log_memory (systemPatterns type)."
        - "Log context changes with log_memory (activeContext/productContext types)."
        - "Log new tool implementations and error fixes."
    post_sync_actions:
      - "Inform user: Memory synchronized."
      - "Resume previous task."