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

  constructor() {
    this.openAIService = new OpenAIService();
    this.memoryService = new MemoryService();
  }

  /**
   * Generate a response from the agent
   */
  async generateResponse(
    input: string,
    instructions: string = "You are a helpful assistant",
    model: string = "gpt-4o"
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

    const response = await this.openAIService.generateResponse(
      input,
      instructions,
      model
    );

    // After generating a response, consider updating memory
    await this.considerUpdatingMemory(input, response.output);

    return response;
  }

  /**
   * Stream a response from the agent
   */
  async streamResponse(
    input: string,
    instructions: string = "You are a helpful assistant",
    model: string = "gpt-4o"
  ) {
    // Check if the input contains a direct memory storage command
    const memoryCommand = this.detectMemoryCommand(input);
    if (memoryCommand) {
      await this.processMemoryCommand(memoryCommand);
      // We can't return a fake stream here, so we'll let it continue
      // The memory command will already be processed
    }

    // Return the stream for the controller to handle
    return await this.openAIService.streamResponse(input, instructions, model);

    // Note: We can't update memory here since we're streaming
    // Memory updates for streaming should be handled afterward
  }

  /**
   * Update memory after a streaming response is complete
   */
  async updateMemoryAfterStream(input: string, output: string) {
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
    // Validate command structure
    if (!command || typeof command !== 'object' || !command.type || !command.content) {
      throw new Error("Invalid memory command structure");
    }
    
    // Sanitize content
    command.content = this.sanitizeContent(command.content);
    
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
    
    // Sanitize description if present
    if (command.description) {
      command.description = this.sanitizeContent(command.description);
    }
    
    // Verify content is appropriate for storage
    if (!this.isAppropriateMemoryContent(command.content)) {
      throw new Error("Memory content is not appropriate for storage");
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
      // Validate the inputs 
      if (!userInput || typeof userInput !== 'string') {
        Logger.warn("Invalid user input provided to considerUpdatingMemory");
        return { updated: false, error: "Invalid user input" };
      }
      
      if (!agentOutput || typeof agentOutput !== 'string') {
        Logger.warn("Invalid agent output provided to considerUpdatingMemory");
        return { updated: false, error: "Invalid agent output" };
      }
      
      // Sanitize the agent output by removing potentially harmful characters
      // This helps prevent malicious content from being stored in memory
      const sanitizedAgentOutput = this.sanitizeContent(agentOutput);
      
      // Check for direct memory commands first
      const memoryCommand = this.detectMemoryCommand(userInput);
      if (memoryCommand) {
        // Sanitize memory command content before processing
        memoryCommand.content = this.sanitizeContent(memoryCommand.content);
        if (memoryCommand.description) {
          memoryCommand.description = this.sanitizeContent(memoryCommand.description);
        }
        
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

AGENT RESPONSE: ${sanitizedAgentOutput}

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
        // Validate the function call arguments
        if (!functionCall.function.arguments || 
            typeof functionCall.function.arguments !== 'string') {
          Logger.warn("Invalid function call arguments");
          return { updated: false, error: "Invalid function call" };
        }
        
        let args;
        try {
          args = JSON.parse(functionCall.function.arguments);
        } catch (error) {
          Logger.error("Error parsing function arguments:", error);
          return { updated: false, error: "Invalid function arguments" };
        }

        if (!args.should_update) {
          Logger.info("Agent decided not to update memory:", args.reasoning);
          return { updated: false, reasoning: args.reasoning };
        }

        Logger.info("Updating agent memory:", args.reasoning);

        const memoryUpdates = [];

        if (args.memory_items && Array.isArray(args.memory_items)) {
          for (const item of args.memory_items) {
            // Validate memory item structure
            if (!this.isValidMemoryItem(item)) {
              Logger.warn("Invalid memory item structure:", item);
              continue;
            }
            
            // Sanitize memory content and description
            const sanitizedItem = {
              ...item,
              description: this.sanitizeContent(item.description),
              content: this.sanitizeContent(item.content)
            };
            
            // Additional validation of memory content
            if (!this.isAppropriateMemoryContent(sanitizedItem.content)) {
              Logger.warn("Inappropriate memory content detected:", sanitizedItem.content);
              continue;
            }
            
            if (sanitizedItem.action === "create") {
              const newItem = await this.memoryService.storeMemory(
                sanitizedItem.description,
                sanitizedItem.content
              );
              memoryUpdates.push({ action: "created", item: newItem });
            } else if (sanitizedItem.action === "update" && sanitizedItem.id) {
              const updatedItem = await this.memoryService.updateMemory(
                sanitizedItem.id,
                {
                  description: sanitizedItem.description,
                  content: sanitizedItem.content,
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
   * Process memory tool calls
   */
  async processMemoryToolCall(
    input: string,
    instructions: string = "You are a helpful assistant with access to memory management tools"
  ) {
    try {
      // Validate input
      if (!input || typeof input !== 'string') {
        throw new Error("Invalid input for memory tool call");
      }
      
      // Check for direct memory commands first
      const memoryCommand = this.detectMemoryCommand(input);
      if (memoryCommand) {
        const memoryItem = await this.processMemoryCommand(memoryCommand);
        return {
          tool: "create_memory",
          arguments: {
            description: memoryCommand.description,
            content: memoryCommand.content,
          },
          result: memoryItem,
          response: `I've saved that information for you. I'll remember that "${memoryCommand.content}".`,
        };
      }

      const memoryTools = [
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

      // Make the instructions more likely to use memory tools
      const enhancedInstructions = `
${instructions}

You should be proactive about managing your memory. If the user asks you to remember something,
use the create_memory tool. If they ask about something you might know, use search_memories
to try to find relevant information.
`;

      const response = await this.openAIService.functionCall(
        input,
        memoryTools,
        enhancedInstructions
      );

      const toolCalls = response.toolCalls;

      if (!toolCalls || toolCalls.length === 0) {
        return {
          result: "No memory tool was called",
          response: response.messageContent,
        };
      }

      const functionCall = toolCalls[0];
      
      // Validate function call structure
      if (!functionCall || !functionCall.function || !functionCall.function.name) {
        return {
          result: "Invalid tool call format",
          response: "There was an error processing your request."
        };
      }
      
      // Validate and parse arguments
      let args;
      try {
        args = JSON.parse(functionCall.function.arguments);
      } catch (error) {
        Logger.error("Error parsing tool call arguments:", error);
        return {
          result: { error: "Invalid tool call arguments" },
          response: "There was an error processing your request."
        };
      }
      
      let result;

      switch (functionCall.function.name) {
        case "create_memory":
          // Validate and sanitize create memory arguments
          if (!args.description || !args.content) {
            return {
              result: { error: "Missing required parameters for create_memory" },
              response: "I need both a description and content to create a memory."
            };
          }
          
          args.description = this.sanitizeContent(args.description);
          args.content = this.sanitizeContent(args.content);
          
          if (!this.isAppropriateMemoryContent(args.content)) {
            return {
              result: { error: "Inappropriate content for memory storage" },
              response: "I cannot store this type of content in memory."
            };
          }
          
          result = await this.memoryService.storeMemory(
            args.description,
            args.content
          );
          break;

        case "get_memory":
          // Validate get memory arguments
          if (!args.id || typeof args.id !== 'string') {
            return {
              result: { error: "Invalid or missing ID for get_memory" },
              response: "I need a valid memory ID to retrieve a memory."
            };
          }
          
          result = await this.memoryService.getMemory(args.id);
          break;

        case "update_memory":
          // Validate and sanitize update memory arguments
          if (!args.id || typeof args.id !== 'string') {
            return {
              result: { error: "Invalid or missing ID for update_memory" },
              response: "I need a valid memory ID to update a memory."
            };
          }
          
          // Create sanitized update object with only valid fields
          const updateObj: {description?: string; content?: string} = {};
          
          if (args.description) {
            updateObj.description = this.sanitizeContent(args.description);
          }
          
          if (args.content) {
            updateObj.content = this.sanitizeContent(args.content);
            if (!this.isAppropriateMemoryContent(updateObj.content)) {
              return {
                result: { error: "Inappropriate content for memory storage" },
                response: "I cannot store this type of content in memory."
              };
            }
          }
          
          result = await this.memoryService.updateMemory(args.id, updateObj);
          break;

        case "delete_memory":
          // Validate delete memory arguments
          if (!args.id || typeof args.id !== 'string') {
            return {
              result: { error: "Invalid or missing ID for delete_memory" },
              response: "I need a valid memory ID to delete a memory."
            };
          }
          
          result = await this.memoryService.deleteMemory(args.id);
          break;

        case "search_memories":
          // Validate search arguments
          if (!args.query || typeof args.query !== 'string') {
            return {
              result: { error: "Invalid or missing query for search_memories" },
              response: "I need a valid search query to search memories."
            };
          }
          
          const sanitizedQuery = this.sanitizeContent(args.query);
          result = await this.memoryService.searchMemories(sanitizedQuery);
          break;

        case "list_all_memories":
          result = await this.memoryService.getAllMemories();
          break;

        default:
          result = { error: "Unknown memory tool" };
      }

      return {
        tool: functionCall.function.name,
        arguments: args,
        result,
        response: response.messageContent,
      };
    } catch (error) {
      Logger.error("Error processing memory tool call:", error);
      throw error;
    }
  }

  /**
   * Generate a response that incorporates relevant memories
   */
  async generateResponseWithMemory(
    input: string,
    instructions: string = "You are a helpful assistant",
    model: string = "gpt-4o"
  ) {
    try {
      // Validate input
      if (!input || typeof input !== 'string') {
        throw new Error("Invalid input for generating response with memory");
      }
      
      // Check for direct memory commands first
      const memoryCommand = this.detectMemoryCommand(input);
      if (memoryCommand) {
        // Sanitize memory command content
        memoryCommand.content = this.sanitizeContent(memoryCommand.content);
        if (memoryCommand.description) {
          memoryCommand.description = this.sanitizeContent(memoryCommand.description);
        }
        
        const memoryItem = await this.processMemoryCommand(memoryCommand);
        return {
          output: `I've saved that information for you. ${
            memoryCommand.type === "remember"
              ? `I'll remember that "${memoryCommand.content}".`
              : `I've made a note about "${memoryCommand.description}".`
          }`,
          requestId: "memory-command-" + Date.now(),
          usedMemories: [],
        };
      }

      // First, search for relevant memories
      const keywords = this.extractKeywords(input);
      const relevantMemories: MemoryItem[] = [];

      for (const keyword of keywords) {
        // Sanitize keyword before using for search
        const sanitizedKeyword = this.sanitizeContent(keyword);
        if (sanitizedKeyword.length < 2) continue; // Skip if too short after sanitization
        
        const memories = await this.memoryService.searchMemories(sanitizedKeyword);
        for (const memory of memories) {
          // Avoid duplicates
          if (!relevantMemories.some((m) => m.id === memory.id)) {
            relevantMemories.push(memory);
          }
        }
      }

      // Prepare memory context
      let memoryContext = "";

      if (relevantMemories.length > 0) {
        memoryContext = "Here are some relevant things I remember:\n\n";

        for (const memory of relevantMemories) {
          memoryContext += `- ${memory.description}: ${memory.content}\n`;
        }

        memoryContext +=
          "\nPlease use this information if relevant to the user's request.\n\n";
      }

      // Generate response with context
      const enhancedInstructions = `${instructions}\n\n${memoryContext}`;

      const response = await this.openAIService.generateResponse(
        input,
        enhancedInstructions,
        model
      );

      // After generating a response, consider updating memory
      // Use the sanitized output for memory updates
      const sanitizedOutput = this.sanitizeContent(response.output);
      await this.considerUpdatingMemory(input, sanitizedOutput);

      return {
        ...response,
        usedMemories: relevantMemories,
      };
    } catch (error) {
      Logger.error("Error generating response with memory:", error);
      throw error;
    }
  }

  /**
   * Extract potential search keywords from user input
   */
  private extractKeywords(input: string): string[] {
    // Validate input
    if (!input || typeof input !== 'string') {
      return [];
    }
    
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
   * Sanitize content to prevent malicious input
   */
  private sanitizeContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }
    
    // Remove potentially dangerous HTML/script content
    let sanitized = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<img[^>]*>/gi, '[IMAGE]')
      .replace(/<[^>]*>/g, ''); // Remove remaining HTML tags
      
    // Limit content length to prevent memory overflow
    const MAX_CONTENT_LENGTH = 10000; // Adjust based on your requirements
    if (sanitized.length > MAX_CONTENT_LENGTH) {
      sanitized = sanitized.substring(0, MAX_CONTENT_LENGTH);
    }
    
    return sanitized.trim();
  }

  /**
   * Validate memory item structure
   */
  private isValidMemoryItem(item: any): boolean {
    if (!item || typeof item !== 'object') return false;
    
    // Check required fields
    if (!item.action || !['create', 'update'].includes(item.action)) return false;
    if (!item.description || typeof item.description !== 'string') return false;
    if (!item.content || typeof item.content !== 'string') return false;
    
    // If update, must have id
    if (item.action === 'update' && (!item.id || typeof item.id !== 'string')) return false;
    
    return true;
  }

  /**
   * Check if the memory content is appropriate for storage
   */
  private isAppropriateMemoryContent(content: string): boolean {
    if (!content || typeof content !== 'string') return false;
    
    // Check for empty/too short content
    if (content.trim().length < 2) return false;
    
    // Check for content that might be too generic/meaningless
    const meaninglessPatterns = [
      /^(yes|no|maybe|ok|okay|sure|thanks|thank you)$/i,
      /^i don't know$/i,
      /^unknown$/i
    ];
    
    for (const pattern of meaninglessPatterns) {
      if (pattern.test(content.trim())) return false;
    }
    
    return true;
  }
}