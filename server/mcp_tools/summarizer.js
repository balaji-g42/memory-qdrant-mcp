// server/mcp_tools/summarizer.js
import axios from "axios";
import config from "../config.js";

const SUMMARIZER_MODEL = process.env.SUMMARIZER_MODEL || "openai/gpt-oss-20b:free";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";

// Retry configuration for Gemini API
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000,  // 5 seconds
  backoffFactor: 2
};

// Error categorization for appropriate handling
function categorizeGeminiError(error) {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes('api key') || errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
    return 'AUTHENTICATION_ERROR'; // No retry
  }
  if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('exceeded')) {
    return 'QUOTA_ERROR'; // No retry
  }
  if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'NETWORK_ERROR'; // Retry with backoff
  }
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return 'RATE_LIMIT'; // Retry with longer delay
  }

  return 'UNKNOWN_ERROR'; // Retry once
}

// Retry utility with exponential backoff
async function withRetry(operation, config = RETRY_CONFIG) {
  let lastError;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const errorCategory = categorizeGeminiError(error);
      if ((errorCategory === 'AUTHENTICATION_ERROR' || errorCategory === 'QUOTA_ERROR') || attempt === config.maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt),
        config.maxDelay
      );

      console.log(`Gemini API attempt ${attempt + 1} failed (${errorCategory}), retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Enhanced Gemini API call with retry logic
async function callGeminiAPI(text, prompt) {
  return await withRetry(async () => {
    const { GoogleGenerativeAI } = await import("google.generativeai");
    if (!config.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

    const genai = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genai.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(`${prompt}\n\nText to summarize:\n${text}`);
    const response = await result.response;
    const summary = response.text();

    if (summary) return summary;
    throw new Error("Empty response from Gemini API");
  });
}

/**
 * Summarize a given text using OpenRouter (if API key present) or Gemini free model.
 * @param {string} text - Text to summarize
 * @returns {Promise<string>} - Summarized text
 */
async function summarizeText(text) {
    if (!text) return "";

    // Use OpenRouter if key exists
    if (OPENROUTER_KEY) {
        try {
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: SUMMARIZER_MODEL,
                    messages: [
                        { role: "system", content: "Summarize the following content concisely:" },
                        { role: "user", content: text }
                    ],
                    temperature: 0.2,
                    max_tokens: 500
                },
                {
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const summary = response.data?.choices?.[0]?.message?.content;
            if (summary) return summary;
        } catch (err) {
            // OpenRouter summarization failed, falling back to Gemini
        }
    }

    // Fallback to Gemini with enhanced error handling and retry logic
    try {
        const summary = await callGeminiAPI(text, "Summarize the following content concisely:");

        // Log successful summarization
        console.log(`Gemini summarization successful: ${text.length} chars -> ${summary.length} chars`);
        return summary;
    } catch (err) {
        const errorCategory = categorizeGeminiError(err);

        // Structured error logging
        const errorInfo = {
            timestamp: new Date().toISOString(),
            operation: 'summarization',
            errorType: errorCategory,
            errorMessage: err.message,
            textLength: text.length,
            hasApiKey: !!config.GEMINI_API_KEY
        };

        console.error('Gemini summarization failed:', errorInfo);

        // Log to memory system for pattern analysis
        try {
            // Use memory logging if available
            if (typeof log_memory !== 'undefined') {
                log_memory({
                    project_name: "memory-qdrant-mcp",
                    memory_type: "systemPatterns",
                    content: `Gemini Summarization Error: ${errorCategory} - ${err.message}`
                });
            }
        } catch (memoryErr) {
            console.error('Failed to log to memory:', memoryErr.message);
        }

        // For certain error types, we could implement circuit breaker pattern here
        if (errorCategory === 'AUTHENTICATION_ERROR' || errorCategory === 'QUOTA_ERROR') {
            console.error(`Gemini API permanently unavailable due to ${errorCategory}. Consider using FastEmbed for embeddings.`);
        }
    }

    // If all fails, return original text
    return text;
}

export { summarizeText };
