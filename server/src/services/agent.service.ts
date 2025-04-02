import { OpenAIService } from "./openai.service";
import { MemoryService } from "./memory.service";
import { Logger } from "../utils/logger";
import { MemoryItem } from "../models/memory";

/**
 * Service class for the AI agent with integrated memory
 */
export class AgentService {
  private openAIService: OpenAIService;
  private memoryService: MemoryService;
  private sessionContexts: Map<
    string,
    Array<{ role: string; content: string }>
  >;

  constructor() {
    this.openAIService = new OpenAIService();
    this.memoryService = new MemoryService();
    this.sessionContexts = new Map();
  }

  /**
   * Generate a response from the agent
   */
  async generateResponse(
    input: string,
    instructions: string = "You are a helpful assistant",
    model: string = "gpt-4o",
    sessionId?: string
  ) {
    // Check if the input contains a direct memory storage command
    const memoryCommand = this.detectMemoryCommand(input);
    if (memoryCommand) {
      await this.processMemoryCommand(memoryCommand);
      // Inform the user that the information has been saved
      return {
        output: `I've saved that information for you. ${
          memoryCommand.type === "remember"
            ? `I'll remember that "${memoryCommand.content}".`
            : `I've made a note about "${memoryCommand.description}".`
        }`,
        requestId: "memory-command-" + Date.now(),
      };
    }

    // Get the conversation context for this session
    let context: Array<{ role: string; content: string }> = [];
    if (sessionId) {
      context = this.sessionContexts.get(sessionId) || [];

      // Add the new user message to context
      context.push({ role: "user", content: input });
    }

    const response = await this.openAIService.generateResponse(
      input,
      instructions,
      model,
      sessionId ? context : undefined
    );

    // After generating a response, consider updating memory
    await this.considerUpdatingMemory(input, response.output);

    // Update the session context with the assistant's response
    if (sessionId) {
      context.push({ role: "assistant", content: response.output });
      this.sessionContexts.set(sessionId, context);
    }

    return response;
  }

  /**
   * Stream a response from the agent
   */
  async streamResponse(
    input: string,
    instructions: string = "You are a helpful assistant",
    model: string = "gpt-4o",
    sessionId?: string
  ) {
    // Check if the input contains a direct memory storage command
    const memoryCommand = this.detectMemoryCommand(input);
    if (memoryCommand) {
      await this.processMemoryCommand(memoryCommand);
      // We can't return a fake stream here, so we'll let it continue
      // The memory command will already be processed
    }

    // Get the conversation context for this session
    let context: Array<{ role: string; content: string }> = [];
    if (sessionId) {
      context = this.sessionContexts.get(sessionId) || [];

      // Add the new user message to context
      context.push({ role: "user", content: input });
      this.sessionContexts.set(sessionId, context);
    }

    // Return the stream for the controller to handle
    return await this.openAIService.streamResponse(
      input,
      instructions,
      model,
      sessionId ? context : undefined
    );

    // Note: We can't update memory here since we're streaming
    // Memory updates for streaming should be handled afterward
  }

  /**
   * Update memory after a streaming response is complete
   */
  async updateMemoryAfterStream(
    input: string,
    output: string,
    sessionId?: string
  ) {
    // Update session context with assistant's response if sessionId is provided
    if (sessionId) {
      const context = this.sessionContexts.get(sessionId) || [];
      context.push({ role: "assistant", content: output });
      this.sessionContexts.set(sessionId, context);
    }

    return await this.considerUpdatingMemory(input, output);
  }

  /**
   * Detect explicit memory storage commands in user input
   * Supports formats like:
   * - "Remember that I like chocolate"
   * - "Please remember my favorite color is blue"
   * - "Make a note that my birthday is on May 15th"
   */
  private detectMemoryCommand(input: string): {
    type: "remember" | "note";
    description?: string;
    content: string;
  } | null {
    const lowerInput = input.toLowerCase();

    // Direct "remember that X" pattern
    const rememberPattern = /remember that (.*)/i;
    const rememberMatch = input.match(rememberPattern);
    if (rememberMatch && rememberMatch[1]) {
      return {
        type: "remember",
        content: rememberMatch[1].trim(),
      };
    }

    // "Please remember X" pattern
    const pleaseRememberPattern =
      /(?:please\s+)?remember\s+(my|that my|that) ([^\.]+)/i;
    const pleaseRememberMatch = input.match(pleaseRememberPattern);
    if (pleaseRememberMatch && pleaseRememberMatch[2]) {
      return {
        type: "remember",
        content: pleaseRememberMatch[2].trim(),
      };
    }

    // "Make a note that X" pattern
    const notePattern = /make a note (?:that|about) (.*)/i;
    const noteMatch = input.match(notePattern);
    if (noteMatch && noteMatch[1]) {
      // Try to extract a description if present
      const aboutPattern = /(.*?) is (.*)/i;
      const aboutMatch = noteMatch[1].match(aboutPattern);

      if (aboutMatch) {
        return {
          type: "note",
          description: aboutMatch[1].trim(),
          content: aboutMatch[2].trim(),
        };
      }

      return {
        type: "note",
        content: noteMatch[1].trim(),
      };
    }

    return null;
  }

  /**
   * Process a detected memory command
   */
  private async processMemoryCommand(command: {
    type: "remember" | "note";
    description?: string;
    content: string;
  }): Promise<MemoryItem> {
    // For 'remember' type, generate a description
    if (command.type === "remember" && !command.description) {
      const keyTerms = this.extractKeywords(command.content);
      const topic = keyTerms.length > 0 ? keyTerms[0] : "user information";
      command.description = `User information about ${topic}`;
    }

    // For 'note' without description
    if (command.type === "note" && !command.description) {
      command.description = "User note";
    }

    // Store in memory
    return await this.memoryService.storeMemory(
      command.description as string,
      command.content
    );
  }

  /**
   * Process user input and agent response to consider updating memory
   */
  async considerUpdatingMemory(userInput: string, agentOutput: string) {
    try {
      // Check for direct memory commands first
      const memoryCommand = this.detectMemoryCommand(userInput);
      if (memoryCommand) {
        const memoryItem = await this.processMemoryCommand(memoryCommand);
        return {
          updated: true,
          reasoning: "User explicitly requested to remember this information",
          updates: [{ action: "created", item: memoryItem }],
        };
      }

      // Use function call to decide if memory needs to be updated
      const functions = [
        {
          name: "update_agent_memory",
          description: "Update the agent's memory based on the conversation",
          parameters: {
            type: "object",
            properties: {
              should_update: {
                type: "boolean",
                description:
                  "Whether the agent should update its memory based on this interaction",
              },
              memory_items: {
                type: "array",
                description: "Memory items to create or update",
                items: {
                  type: "object",
                  properties: {
                    action: {
                      type: "string",
                      enum: ["create", "update"],
                      description:
                        "Whether to create a new memory item or update an existing one",
                    },
                    id: {
                      type: "string",
                      description:
                        "ID of the memory item to update (only required for updates)",
                    },
                    description: {
                      type: "string",
                      description:
                        "Short description of what this memory item represents",
                    },
                    content: {
                      type: "string",
                      description: "Content of the memory item",
                    },
                  },
                  required: ["action", "description", "content"],
                },
              },
              reasoning: {
                type: "string",
                description: "Reasoning for the memory update decision",
              },
            },
            required: ["should_update", "reasoning"],
          },
        },
      ];

      // Make the instructions more generous about what to remember
      const memoryUpdateInstructions = `
You are an agent that decides whether to update its memory based on conversations.
Review the user's input and your response, then decide if you should:
1. Create new memory items about information shared by the user
2. Update existing memory items with new information

Be generous with what you store - if the user mentions any personal details, preferences, 
facts about themselves, or important context, you should remember it.

Your memory items should have a concise description and detailed content.
`;

      const combinedInput = `
USER INPUT: ${userInput}

AGENT RESPONSE: ${agentOutput}

Should I update my memory based on this interaction? If so, what memory items should I create or update?
`;

      const response = await this.openAIService.functionCall(
        combinedInput,
        functions,
        memoryUpdateInstructions
      );

      const toolCalls = response.toolCalls;

      if (!toolCalls || toolCalls.length === 0) {
        Logger.info("No memory updates needed");
        return { updated: false };
      }

      // Process memory updates
      const functionCall = toolCalls[0];

      if (functionCall.function.name === "update_agent_memory") {
        const args = JSON.parse(functionCall.function.arguments);

        if (!args.should_update) {
          Logger.info("Agent decided not to update memory:", args.reasoning);
          return { updated: false, reasoning: args.reasoning };
        }

        Logger.info("Updating agent memory:", args.reasoning);

        const memoryUpdates = [];

        if (args.memory_items && Array.isArray(args.memory_items)) {
          for (const item of args.memory_items) {
            if (item.action === "create") {
              const newItem = await this.memoryService.storeMemory(
                item.description,
                item.content
              );
              memoryUpdates.push({ action: "created", item: newItem });
            } else if (item.action === "update" && item.id) {
              const updatedItem = await this.memoryService.updateMemory(
                item.id,
                {
                  description: item.description,
                  content: item.content,
                }
              );
              memoryUpdates.push({ action: "updated", item: updatedItem });
            }
          }
        }

        return {
          updated: true,
          reasoning: args.reasoning,
          updates: memoryUpdates,
        };
      }

      return { updated: false };
    } catch (error) {
      Logger.error("Error updating memory:", error);
      return { updated: false, error: String(error) };
    }
  }

  /**
   * Get all memory items
   */
  async getAllMemories(): Promise<MemoryItem[]> {
    return await this.memoryService.getAllMemories();
  }

  /**
   * Search memory items
   */
  async searchMemories(query: string): Promise<MemoryItem[]> {
    return await this.memoryService.searchMemories(query);
  }

  /**
   * Process memory tool calls with session context
   */
  async processMemoryToolCall(
    input: string,
    instructions: string = "You are a helpful assistant with access to memory management tools",
    sessionId?: string
  ) {
    // Get the conversation context for this session
    let context: Array<{ role: string; content: string }> = [];
    if (sessionId) {
      context = this.sessionContexts.get(sessionId) || [];

      // Add the new user message to context
      context.push({ role: "user", content: input });
    }

    // Call the original method with appropriate context
    const result = await this.openAIService.performMemoryFunctionCall(
      input,
      this.getMemoryToolDefinitions(),
      async (name, args) => this.executeMemoryTool(name, args),
      instructions,
      sessionId ? context : undefined
    );

    // Update session context with assistant's response
    if (sessionId) {
      const context = this.sessionContexts.get(sessionId) || [];
      context.push({ role: "assistant", content: result.output });
      this.sessionContexts.set(sessionId, context);
    }

    return result;
  }

  /**
   * Generate response with memory and session context
   */
  async generateResponseWithMemory(
    input: string,
    instructions: string = "You are a helpful assistant",
    model: string = "gpt-4o",
    sessionId?: string
  ) {
    // Get the conversation context for this session
    let context: Array<{ role: string; content: string }> = [];
    if (sessionId) {
      context = this.sessionContexts.get(sessionId) || [];

      // Add the new user message to context
      context.push({ role: "user", content: input });
    }

    // Get relevant memories
    const relevantMemories = await this.memoryService.getRelevantMemories(
      input
    );

    // Build enhanced instructions with memory
    let enhancedInstructions = instructions;
    if (relevantMemories.length > 0) {
      enhancedInstructions +=
        "\n\nYou have access to the following memories to help you answer:";
      relevantMemories.forEach((memory, index: number) => {
        enhancedInstructions += `\n${index + 1}. ${memory.description}: ${
          memory.content
        }`;
      });
      enhancedInstructions +=
        "\n\nUse these memories to provide more personalized and informed responses.";
    }

    const response = await this.openAIService.generateResponse(
      input,
      enhancedInstructions,
      model,
      sessionId ? context : undefined
    );

    // After generating a response, consider updating memory
    await this.considerUpdatingMemory(input, response.output);

    // Update session context with assistant's response
    if (sessionId) {
      context.push({ role: "assistant", content: response.output });
      this.sessionContexts.set(sessionId, context);
    }

    return {
      ...response,
      memoriesUsed: relevantMemories.length > 0 ? relevantMemories : undefined,
    };
  }

  /**
   * Extract potential search keywords from user input
   */
  private extractKeywords(input: string): string[] {
    // A simple keyword extraction implementation
    // Remove common words, punctuation, and split into words
    const stopWords = new Set([
      "a",
      "an",
      "the",
      "and",
      "but",
      "or",
      "for",
      "nor",
      "on",
      "at",
      "to",
      "from",
      "by",
      "with",
      "in",
      "out",
      "is",
      "are",
      "am",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "me",
      "him",
      "her",
      "us",
      "them",
      "what",
      "which",
      "who",
      "whom",
      "whose",
      "this",
      "that",
      "these",
      "those",
      "how",
      "why",
      "when",
      "where",
    ]);

    const words = input
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    // Return unique words
    return [...new Set(words)];
  }

  /**
   * Get memory tool definitions
   */
  private getMemoryToolDefinitions() {
    return [
      {
        name: "create_memory",
        description: "Create a new memory item",
        parameters: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description: "Short description of what this memory represents",
            },
            content: {
              type: "string",
              description: "Content of the memory item",
            },
          },
          required: ["description", "content"],
        },
      },
      {
        name: "get_memory",
        description: "Get a memory item by ID",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID of the memory item to retrieve",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "update_memory",
        description: "Update an existing memory item",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID of the memory item to update",
            },
            description: {
              type: "string",
              description: "New description (optional)",
            },
            content: {
              type: "string",
              description: "New content (optional)",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_memory",
        description: "Delete a memory item",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID of the memory item to delete",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "search_memories",
        description: "Search for memory items",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "list_all_memories",
        description: "List all memory items",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    ];
  }

  /**
   * Execute a memory tool
   */
  private async executeMemoryTool(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        case "create_memory":
          return await this.memoryService.storeMemory(
            args.description,
            args.content
          );

        case "get_memory":
          return await this.memoryService.getMemory(args.id);

        case "update_memory":
          return await this.memoryService.updateMemory(args.id, {
            description: args.description,
            content: args.content,
          });

        case "delete_memory":
          return await this.memoryService.deleteMemory(args.id);

        case "search_memories":
          return await this.memoryService.searchMemories(args.query);

        case "list_all_memories":
          return await this.memoryService.getAllMemories();

        default:
          return { error: "Unknown memory tool" };
      }
    } catch (error) {
      Logger.error("Error executing memory tool:", error);
      throw error;
    }
  }
}
