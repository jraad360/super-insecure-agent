/**
 * Script to test the agent memory integration
 *
 * Run with:
 * npx ts-node src/scripts/test-agent-memory.ts
 */

import { AgentService } from "../services/agent.service";
import { MemoryItem } from "../models/memory";

async function testAgentMemory() {
  console.log("Testing Agent Memory Integration\n");

  const agentService = new AgentService();

  try {
    // Step 1: Test memory tool calls
    console.log("=== Testing Memory Tool Calls ===");

    // Create a memory item
    console.log("\n1. Creating a memory item about the user's name:");
    const createResult = await agentService.processMemoryToolCall(
      "Remember that my name is Alice.",
      "You're an assistant that can store information in your memory."
    );
    console.log("Result:", JSON.stringify(createResult, null, 2));

    // Get memory ID for later use
    let memoryId: string | undefined;
    if (
      createResult.result &&
      typeof createResult.result === "object" &&
      "id" in createResult.result
    ) {
      memoryId = createResult.result.id as string;
    }

    // List all memories
    console.log("\n2. Listing all memories:");
    const listResult = await agentService.processMemoryToolCall(
      "What information do you have stored in your memory?",
      "You're an assistant that can list information from your memory."
    );
    console.log("Result:", JSON.stringify(listResult, null, 2));

    // Update a memory item
    if (memoryId) {
      console.log("\n3. Updating the memory item:");
      const updateResult = await agentService.processMemoryToolCall(
        "Actually, my full name is Alice Johnson.",
        "You're an assistant that can update information in your memory."
      );
      console.log("Result:", JSON.stringify(updateResult, null, 2));
    }

    // Search memories
    console.log("\n4. Searching memories:");
    const searchResult = await agentService.processMemoryToolCall(
      "Do you remember anything about my name?",
      "You're an assistant that can search information in your memory."
    );
    console.log("Result:", JSON.stringify(searchResult, null, 2));

    // Step 2: Test automatic memory updates
    console.log("\n=== Testing Automatic Memory Updates ===");

    // Generate a response that might trigger memory updates
    console.log("\n5. Generating a response that might trigger memory update:");
    const userInput = "I want you to know that I prefer vegetarian food.";
    const response = await agentService.generateResponse(
      userInput,
      "You're a helpful assistant who remembers important user preferences."
    );

    console.log("User input:", userInput);
    console.log("Agent response:", response.output);
    console.log("Memory update result will process automatically");

    // Step 3: Test using memories in responses
    console.log("\n=== Testing Memory-Enhanced Responses ===");

    // Wait a bit to ensure memory updates have processed
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate a response that should use memories
    console.log("\n6. Generating a response that should use memories:");
    const followUpInput = "Can you suggest a restaurant for me?";
    const enhancedResponse = await agentService.generateResponseWithMemory(
      followUpInput,
      "You're a helpful assistant who uses what you know about the user."
    );

    console.log("User input:", followUpInput);
    console.log("Agent response:", enhancedResponse.output);
    console.log(
      "Used memories:",
      JSON.stringify(enhancedResponse.usedMemories, null, 2)
    );

    // Final verification
    console.log("\n=== Final Memory State ===");
    const memories = await agentService.getAllMemories();
    console.log("All memory items:", JSON.stringify(memories, null, 2));

    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

// Run the test
testAgentMemory().catch(console.error);
