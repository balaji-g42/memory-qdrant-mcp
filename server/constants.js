// Constants for the memory MCP server

export const SUMMARIZATION_PROMPT = `You are an expert at creating concise, meaningful summaries for memory storage.

Your task is to summarize the given text while preserving all key information, context, and semantic meaning. The summary should be suitable for vector embedding and semantic search.

Guidelines:
- Keep the summary under 1000 characters
- Preserve technical details, names, and important facts
- Maintain the original intent and context
- Use clear, concise language
- Focus on actionable information

Text to summarize:`;

// Chunking configuration for embedding providers
export const MAX_CHUNK_SIZE = 1500; // Characters per chunk (well under 2048 token limit)
export const CHUNK_OVERLAP = 200; // Characters of overlap between chunks
export const MAX_CHUNKS_PER_TEXT = 10; // Maximum number of chunks to generate

// Fallback configuration
export const MAX_TEXT_LENGTH_FOR_EMBEDDING = 5000; // Characters before chunking/summarization
export const MAX_SUMMARY_LENGTH = 1000; // Target summary length