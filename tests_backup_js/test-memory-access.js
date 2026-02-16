// tests/test-memory-access.js
import "dotenv/config";
import { logMemory } from '../server/mcp_tools/memoryBankTools.js';

async function testMemoryAccess() {
    const projectName = 'memory-qdrant-mcp';
    const memoryType = 'customData';
    const content = 'Test memory entry for debugging';

    console.log('Starting memory access test...');
    console.log(`Project: ${projectName}`);
    console.log(`Memory Type: ${memoryType}`);
    console.log(`Content: ${content}`);
    console.log('Environment variables:');
    console.log(`QDRANT_URL: ${process.env.QDRANT_URL}`);
    console.log(`QDRANT_API_KEY: ${process.env.QDRANT_API_KEY ? 'Set' : 'Not set'}`);
    console.log(`VECTOR_DIM: ${process.env.VECTOR_DIM}`);
    console.log(`DISTANCE_METRIC: ${process.env.DISTANCE_METRIC}`);

    try {
        console.log('Attempting to log memory...');
        const memoryId = await logMemory(projectName, memoryType, content);
        console.log(`Success! Memory logged with ID: ${memoryId}`);
    } catch (error) {
        console.error('Error occurred during memory logging:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        if (error.code) {
            console.error('Error code:', error.code);
        }
        if (error.cause) {
            console.error('Error cause:', error.cause);
        }
    }
}

testMemoryAccess().catch(console.error);