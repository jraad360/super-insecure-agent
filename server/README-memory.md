# Agent Memory System

The memory system provides a simple key-value store for the AI agent to remember important information across interactions. This implementation uses an in-memory database that can be later extended to persistent storage.

## Core Components

### Memory Model

- **MemoryItem**: The basic data structure representing a piece of information

  - `id`: Unique identifier
  - `description`: Short description of the information's purpose
  - `content`: The actual information content
  - `createdAt`: When the item was created
  - `updatedAt`: When the item was last updated

- **MemoryDatabase**: Interface for database operations

  - Create, read, update, delete operations
  - Search functionality

- **InMemoryDatabase**: Implementation using JavaScript's Map

### Service Layer

The `MemoryService` class provides higher-level operations that use the database interface:

- `storeMemory`: Add new information
- `getMemory`: Retrieve specific information
- `getAllMemories`: Get all stored information
- `updateMemory`: Update existing information
- `deleteMemory`: Remove information
- `searchMemories`: Find information by keyword

## Direct Memory Commands

Users can directly instruct the agent to remember information using natural language commands:

| Command Pattern       | Example                                        | Description                                        |
| --------------------- | ---------------------------------------------- | -------------------------------------------------- |
| "Remember that..."    | "Remember that I prefer dark chocolate"        | Stores information with auto-generated description |
| "Please remember..."  | "Please remember my email is user@example.com" | Alternative phrasing for memory storage            |
| "Make a note that..." | "Make a note that my birthday is May 15th"     | Creates a memory item with optional description    |

These commands are processed directly by the agent and bypass the normal memory update logic, ensuring the information is definitely stored.

## Agent Integration

The memory system is integrated with the agent through the `AgentService`, providing:

1. **Automatic Memory Updates**

   - After each chat interaction, the agent automatically considers updating its memory
   - Uses an OpenAI function call to decide what information is worth remembering
   - Creates or updates memory items based on conversation context

2. **Memory-Enhanced Responses**

   - The agent can access relevant memories when generating responses
   - Extracts keywords from user input to find relevant memory items
   - Provides memory context to the LLM when generating responses

3. **Memory Tool Calls**
   - Direct manipulation of memory through tool calls
   - Create, retrieve, update, delete, and search memory items
   - Available through the API endpoint `/api/agent/memory-tool`

### Memory Update Process

After each interaction:

1. The agent analyzes the conversation
2. Determines if important information was shared
3. Creates new memory items or updates existing ones as needed
4. Provides reasoning for update decisions

### API Endpoints

Memory operations are accessible through:

#### Direct Memory API

- `POST /api/memory`: Create a new memory item
- `GET /api/memory`: Get all memory items
- `GET /api/memory/search?query=...`: Search memory items
- `GET /api/memory/:id`: Get a specific memory item
- `PATCH /api/memory/:id`: Update a memory item
- `DELETE /api/memory/:id`: Delete a memory item

#### Agent Memory API

- `GET /api/agent/memories`: Get all agent memories
- `GET /api/agent/memories/search?query=...`: Search agent memories
- `POST /api/agent/memory-tool`: Perform memory tool operations

## Tool Operations

The agent can perform the following memory operations through tool calls:

- `create_memory`: Store new information
- `get_memory`: Retrieve a specific memory item
- `update_memory`: Modify existing information
- `delete_memory`: Remove a memory item
- `search_memories`: Find information by keyword
- `list_all_memories`: Get all stored information

## Examples

### Example Memory Items

```json
{
  "id": "abc123",
  "description": "agent system prompt",
  "content": "You are a helpful AI assistant that prioritizes user safety.",
  "createdAt": "2023-04-01T12:00:00Z",
  "updatedAt": "2023-04-01T12:00:00Z"
}

{
  "id": "def456",
  "description": "user's food preference",
  "content": "The user has mentioned they prefer vegetarian food.",
  "createdAt": "2023-04-01T12:05:00Z",
  "updatedAt": "2023-04-01T12:05:00Z"
}
```

### Example Direct Memory Commands

```
User: "Remember that my wife's name is Sarah."
Agent: "I've saved that information for you. I'll remember that your wife's name is Sarah."

User: "Please remember my phone number is 555-123-4567"
Agent: "I've saved that information for you. I'll remember that your phone number is 555-123-4567."

User: "Make a note that my favorite restaurant is Luigi's Pizzeria"
Agent: "I've saved that information for you. I've made a note about 'favorite restaurant'."
```

## Using Memory-Enhanced Responses

To use memory in responses, set the `useMemory` flag to `true` when calling the generate endpoint:

```json
{
  "input": "What restaurants would I like?",
  "instructions": "You are a helpful assistant",
  "useMemory": true
}
```

## Testing

You can test the memory system using:

```
# Test basic memory database functionality
npx ts-node src/scripts/run-memory-test.ts

# Test agent memory integration
npx ts-node src/scripts/test-agent-memory.ts
```

## Future Enhancements

- Persistent storage (MongoDB, PostgreSQL, etc.)
- Memory expiration (TTL)
- Memory categorization/tagging
- Relevance scoring for search results
- Vector embeddings for semantic search
- Enhanced keyword extraction for better memory retrieval
- User control over memory deletion and privacy
- Memory source attribution and confidence levels
