/**
 * Generates a unique ID for memory entries
 * @returns {string} A unique identifier
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}