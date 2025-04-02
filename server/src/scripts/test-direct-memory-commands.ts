/**
 * Script to test direct memory commands
 *
 * Run with:
 * npx ts-node src/scripts/test-direct-memory-commands.ts
 */

import { AgentService } from "../services/agent.service";

async function testDirectMemoryCommands() {
  console.log("Testing Direct Memory Commands\n");

  const agentService = new AgentService();

  try {
    // Test "Remember that..." pattern
    console.log("=== Testing 'Remember that...' pattern ===");
    const remember1 = "Remember that my favorite color is blue";
    console.log(`User: "${remember1}"`);

    const response1 = await agentService.generateResponse(
      remember1,
      "You are a helpful assistant."
    );

    console.log(`Agent: "${response1.output}"`);
    console.log();

    // Test "Please remember..." pattern
    console.log("=== Testing 'Please remember...' pattern ===");
    const remember2 = "Please remember my sister's name is Emma";
    console.log(`User: "${remember2}"`);

    const response2 = await agentService.generateResponse(
      remember2,
      "You are a helpful assistant."
    );

    console.log(`Agent: "${response2.output}"`);
    console.log();

    // Test "Make a note that..." pattern
    console.log("=== Testing 'Make a note that...' pattern ===");
    const remember3 =
      "Make a note that my next appointment is on Friday at 2pm";
    console.log(`User: "${remember3}"`);

    const response3 = await agentService.generateResponse(
      remember3,
      "You are a helpful assistant."
    );

    console.log(`Agent: "${response3.output}"`);
    console.log();

    // Test memory retrieval
    console.log("=== Testing Memory Retrieval ===");
    const query1 = "What's my favorite color?";
    console.log(`User: "${query1}"`);

    const retrieval1 = await agentService.generateResponseWithMemory(
      query1,
      "You are a helpful assistant."
    );

    console.log(`Agent: "${retrieval1.output}"`);
    console.log(
      "Used memories:",
      JSON.stringify(retrieval1.usedMemories, null, 2)
    );
    console.log();

    // Test another memory retrieval
    const query2 = "What was my appointment time?";
    console.log(`User: "${query2}"`);

    const retrieval2 = await agentService.generateResponseWithMemory(
      query2,
      "You are a helpful assistant."
    );

    console.log(`Agent: "${retrieval2.output}"`);
    console.log(
      "Used memories:",
      JSON.stringify(retrieval2.usedMemories, null, 2)
    );
    console.log();

    // Test memory list
    console.log("=== Final Memory State ===");
    const memories = await agentService.getAllMemories();
    console.log("All stored memories:", JSON.stringify(memories, null, 2));

    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

// Run the test
testDirectMemoryCommands().catch(console.error);
