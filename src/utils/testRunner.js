import { expect } from 'chai';

/**
 * Run a Postman test script
 * @param {string} script - The test script to run
 * @param {Object} context - The context object with response and environment data
 * @returns {Object} - The test results
 */
export const runTests = (script, context) => {
  if (!script) return { tests: [], passed: 0, failed: 0 };
  
  const testResults = [];
  let passedCount = 0;
  let failedCount = 0;
  
  try {
    // Create a pm object similar to Postman's
    const pm = {
      response: {
        json: () => context.response.data ? JSON.parse(context.response.data) : null,
        text: () => context.response.data,
        status: context.response.status,
        code: context.response.status,
        responseTime: context.response.responseTime,
        headers: context.response.headers
      },
      environment: {
        set: context.setEnvironmentVariable,
        get: context.getVariable
      },
      globals: {
        set: context.setGlobalVariable,
        get: context.getVariable
      },
      variables: {
        get: context.getVariable
      },
      test: (name, testFn) => {
        try {
          testFn();
          testResults.push({ name, passed: true });
          passedCount++;
        } catch (error) {
          testResults.push({ name, passed: false, error: error.message });
          failedCount++;
        }
      },
      expect
    };
    
    // Execute the script
    new Function('pm', script)(pm);
    
    return { tests: testResults, passed: passedCount, failed: failedCount };
  } catch (error) {
    return { 
      tests: [{ name: 'Script execution error', passed: false, error: error.message }],
      passed: 0,
      failed: 1,
      error: error.message
    };
  }
};

/**
 * Format test results for display
 * @param {Object} results - The test results from runTests
 * @returns {string} - Formatted HTML for displaying test results
 */
export const formatTestResults = (results) => {
  if (!results || !results.tests || results.tests.length === 0) {
    return '<div class="text-gray-500">No tests were run</div>';
  }
  
  const totalTests = results.passed + results.failed;
  const passPercentage = totalTests > 0 ? Math.round((results.passed / totalTests) * 100) : 0;
  
  let html = `
    <div class="mb-4">
      <div class="text-lg font-semibold">
        Test Results: ${results.passed}/${totalTests} passed (${passPercentage}%)
      </div>
    </div>
    <div class="space-y-2">
  `;
  
  results.tests.forEach(test => {
    const statusClass = test.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    const statusIcon = test.passed ? '✓' : '✗';
    
    html += `
      <div class="p-3 rounded ${statusClass}">
        <div class="flex items-start">
          <div class="mr-2 font-bold">${statusIcon}</div>
          <div>
            <div class="font-medium">${test.name}</div>
            ${test.error ? `<div class="text-sm mt-1">${test.error}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  return html;
};
