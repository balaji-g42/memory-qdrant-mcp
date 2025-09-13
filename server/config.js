const config = {
    PORT: process.env.PORT || 8000,
    VECTOR_DIM: parseInt(process.env.VECTOR_DIM || "768"),
    DISTANCE_METRIC: process.env.DISTANCE_METRIC || "Cosine",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
    QDRANT_URL: process.env.QDRANT_URL || "http://localhost:6333"
};

export default config;