# Gemini API Error Handling Test Suite

This directory contains comprehensive tests for the Gemini API error handling implementation.

## Overview

The test suite validates the robust error handling system implemented for Gemini API failures, including:

- ✅ **Exponential backoff retry mechanism**
- ✅ **Error categorization and handling strategies**
- ✅ **Structured logging for monitoring and debugging**
- ✅ **FastEmbed integration as fallback mechanism**

## Test Files

- `test-gemini-error-handling.js` - Main test suite with comprehensive scenarios

## Running Tests

### Option 1: Using npm script
```bash
npm run test:gemini
```

### Option 2: Direct execution
```bash
node tests/test-gemini-error-handling.js
```

### Option 3: Import and use programmatically
```javascript
import { GeminiErrorHandlingTester } from './tests/test-gemini-error-handling.js';

const tester = new GeminiErrorHandlingTester();
await tester.runAllTests();
```

## Test Scenarios

The test suite covers the following scenarios:

### 1. Basic Summarization Test
- Tests normal operation with valid API key
- Verifies successful summarization functionality

### 2. Environment Configuration Tests
- Tests with invalid API key
- Validates authentication error handling
- Ensures graceful fallback to original text

### 3. Retry Mechanism Tests
- Simulates network timeouts
- Verifies exponential backoff (1s → 2s → 4s)
- Tests maximum retry limits

### 4. FastEmbed Fallback Tests
- Tests operation without Gemini API key
- Verifies FastEmbed provider activation
- Ensures embedding functionality continues

### 5. Error Logging Verification
- Tests memory system integration
- Verifies error pattern logging
- Validates structured error context

## Configuration

### Environment Variables
```bash
TEST_SERVER_URL=http://localhost:3000  # Your server URL
GEMINI_API_KEY=your-api-key           # For testing with valid key
```

### Test Configuration
The test suite can be configured by modifying the `GeminiErrorHandlingTester` constructor parameters:

- `baseUrl`: Server URL (default: http://localhost:3000)
- `timeout`: Request timeout in milliseconds (default: 30000)

## Expected Output

```
🚀 Starting Gemini API Error Handling Tests...

📝 Test 1: Basic Summarization
✅ Basic Summarization Test: Status: 200, Response length: 512

🔧 Test 2: Environment Configurations
❌ Invalid API Key Test: HTTP 401 error

🔄 Test 3: Retry Mechanism
✅ Retry Mechanism Test: Status: 200, Response length: 256

📊 Test Summary:
==================================================
Total Tests: 5
✅ Passed: 4
❌ Failed: 1
Success Rate: 80.0%

🎯 Key Implementation Features Verified:
✅ Exponential backoff retry mechanism
✅ Error categorization and handling
✅ Structured logging with context
✅ FastEmbed fallback integration
✅ Graceful degradation to original text
```

## Implementation Features Tested

### Retry Logic
- **3 retry attempts** with exponential backoff
- **Error categorization** (AUTHENTICATION_ERROR, QUOTA_ERROR, NETWORK_ERROR, RATE_LIMIT, UNKNOWN_ERROR)
- **Maximum delay cap** at 5 seconds
- **Intelligent retry decisions** based on error type

### Error Handling
- **Fail-fast strategy** for authentication and quota errors
- **Retry with backoff** for network and rate limit errors
- **Graceful degradation** to original text when summarization fails
- **Comprehensive error context** logging

### Fallback Mechanisms
- **FastEmbed activation** when Gemini is unavailable
- **Original text preservation** when summarization fails
- **Provider selection logic** integration
- **System availability** maintenance

## Troubleshooting

### Common Issues

1. **Server not running**
   ```bash
   # Start your application server first
   npm start
   # or
   node server/index.js
   ```

2. **Network timeouts**
   - Check server URL configuration
   - Verify server is accessible
   - Adjust timeout settings if needed

3. **Memory system unavailable**
   - Ensure Qdrant is running
   - Check database connection
   - Verify memory collections exist

### Debug Mode

For detailed logging, set the log level:
```bash
DEBUG=gemini:* npm run test:gemini
```

## Integration

This test suite integrates with:
- **Axios** for HTTP requests
- **Memory system** for pattern logging
- **Environment configuration** for test scenarios
- **Server endpoints** for functionality testing

## Maintenance

To add new test scenarios:
1. Add new test method to `GeminiErrorHandlingTester` class
2. Call it from `runAllTests()` method
3. Update this README with new test description
4. Verify integration with existing test structure