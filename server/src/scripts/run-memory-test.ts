/**
 * Script to run memory database tests
 *
 * Run with:
 * npx ts-node src/scripts/run-memory-test.ts
 */

import { runTest } from "../tests/memory.test";

console.log("Starting memory database test...");
runTest()
  .then(() => console.log("Test completed successfully."))
  .catch((error) => {
    console.error("Test failed with error:", error);
    process.exit(1);
  });
