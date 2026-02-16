import { logMemory } from "./memoryBankTools.js";


// Decision types
const DECISION_TYPE = "decisionLog";
const PROGRESS_TYPE = "progress";

/**
 * Log a decision for a project
 * @param projectName - Name of the project
 * @param decisionText - Decision text
 * @param topLevelId - Optional custom ID
 * @returns pointId
 */
async function logDecision(projectName: string, decisionText: string, topLevelId: string | null = null): Promise<string> {
    const pointId = await logMemory(projectName, DECISION_TYPE, decisionText, topLevelId);
    return pointId;
}

/**
 * Log progress for a project
 * @param projectName - Name of the project
 * @param progressText - Progress text
 * @param topLevelId - Optional custom ID
 * @returns pointId
 */
async function logProgress(projectName: string, progressText: string, topLevelId: string | null = null): Promise<string> {
    const pointId = await logMemory(projectName, PROGRESS_TYPE, progressText, topLevelId);
    return pointId;
}

export { logDecision, logProgress };
