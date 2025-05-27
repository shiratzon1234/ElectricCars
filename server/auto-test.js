
import fs from 'fs';
import path from 'path';
import { GEToriginAnddest } from './algorithm.js'; // Replace with your actual file

const testFilePath = 'C:\\Users\\שיר\\Downloads\\23.3\\23.3\\server\\ev_route_algorithm_edge_tests.json'; // Place the JSON in the same folder

async function runTests() {
    const fileContent = fs.readFileSync(testFilePath, 'utf-8');
    const testData = JSON.parse(fileContent);

    console.log(`Running ${testData.totalTests} test cases...\n`);
    let passed = 0;

    for (const test of testData.tests) {
        console.log(`🔍 Running Test: ${test.id} - ${test.description}`);
        try {
            const response = await GEToriginAnddest(
                test.origin,
                test.destination,
                'יעד כלשהו',
                test.userPreferences
            );

            const success = response.success ? 'success' : 'failure';

            if (success === test.expectedResult) {
                console.log(`✅ Passed: Got expected result (${success})\n`);
                passed++;
            } else {
                console.log(`❌ Failed: Expected ${test.expectedResult}, but got ${success}`);
                console.log(`Reason: ${response.message || 'לא צוינה'}\n`);
            }
        } catch (error) {
            console.log(`❌ Error running test ${test.id}:`, error.message, '\n');
        }
    }

    console.log(`📊 Summary: ${passed}/${testData.totalTests} tests passed.`);
}

runTests();
