const config = {
    PORT: process.env.PORT || 8000,
    VECTOR_DIM: parseInt(process.env.VECTOR_DIM || "768"),
    DISTANCE_METRIC: process.env.DISTANCE_METRIC || "Cosine",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
    QDRANT_URL: process.env.QDRANT_URL || "http://localhost:6333",
    // Performance optimization settings
    QDRANT_POOL_SIZE: parseInt(process.env.QDRANT_POOL_SIZE || "10"),
    CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || "300"), // 5 minutes default
    EMBEDDING_CACHE_SIZE: parseInt(process.env.EMBEDDING_CACHE_SIZE || "1000"),
    QUERY_CACHE_SIZE: parseInt(process.env.QUERY_CACHE_SIZE || "500")
};

export default config;