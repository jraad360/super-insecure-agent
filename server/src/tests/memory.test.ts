import { InMemoryDatabase, MemoryItem } from "../models/memory";

async function runTest() {
  console.log("Running memory database tests...");

  // Create a new in-memory database
  const db = new InMemoryDatabase();

  // Test creating items
  console.log("Testing create functionality...");
  const item1 = await db.create(
    "agent system prompt",
    "You are a helpful AI assistant that prioritizes user safety."
  );
  console.log("Created item 1:", item1);

  const item2 = await db.create(
    "user's food preference",
    "The user has mentioned they prefer vegetarian food."
  );
  console.log("Created item 2:", item2);

  // Test getting all items
  console.log("\nTesting getAll functionality...");
  const allItems = await db.getAll();
  console.log("All items:", allItems);

  // Test getting a specific item
  console.log("\nTesting get functionality...");
  const retrievedItem = await db.get(item1.id);
  console.log("Retrieved item:", retrievedItem);

  // Test updating an item
  console.log("\nTesting update functionality...");
  const updatedItem = await db.update(item1.id, {
    content:
      "You are a helpful AI assistant that prioritizes user safety and privacy.",
  });
  console.log("Updated item:", updatedItem);

  // Test searching
  console.log("\nTesting search functionality...");
  const searchResults = await db.search("food");
  console.log("Search results for 'food':", searchResults);

  // Test deleting an item
  console.log("\nTesting delete functionality...");
  const deleteResult = await db.delete(item2.id);
  console.log("Delete result:", deleteResult);

  // Verify deletion
  const remainingItems = await db.getAll();
  console.log("Remaining items after deletion:", remainingItems);

  console.log("\nMemory database tests completed.");
}

// We'll execute this test through direct imports or from command-line
runTest().catch(console.error);

export { runTest };
