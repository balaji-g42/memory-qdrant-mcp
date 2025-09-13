import { v4 as uuidv4 } from "uuid";
import { logMemory } from "./memoryBankTools.js";

// Decision types
const DECISION_TYPE = "decisionLog";
const PROGRESS_TYPE = "progress";

/**
 * Log a decision for a project
 * @param {string} projectName
 * @param {string} decisionText
 * @param {string|null} topLevelId
 * @returns {string} pointId
 */
async function logDecision(projectName, decisionText, topLevelId = null) {
    const pointId = await logMemory(projectName, DECISION_TYPE, decisionText, topLevelId);
    return pointId;
}

/**
 * Log progress for a project
 * @param {string} projectName
 * @param {string} progressText
 * @param {string|null} topLevelId
 * @returns {string} pointId
 */
async function logProgress(projectName, progressText, topLevelId = null) {
    const pointId = await logMemory(projectName, PROGRESS_TYPE, progressText, topLevelId);
    return pointId;
}

export { logDecision, logProgress };
