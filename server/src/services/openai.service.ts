import OpenAI from "openai";
import { env } from "../config/env";
import { Logger } from "../utils/logger";

/**
 * Service class for interacting with OpenAI's API
 */
export class OpenAIService {
  private client: OpenAI;
  // Maximum input length to prevent prompt injection attacks
  private readonly MAX_INPUT_LENGTH = 4000;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate a response using OpenAI's Responses API
   * @param input User input for the agent
   * @param instructions System instructions for the agent
   * @param model OpenAI model to use
   * @returns The generated response
   */
  async generateResponse(
    input: string,
    instructions: string = "You are a helpful assistant",
    model: string = "gpt-4o"
  ) {
    try {
      // Validate and sanitize input
      this.validateInput(input);
      
      // Enhance instructions with safety guidelines
      const safeInstructions = this.enhanceWithSafetyGuidelines(instructions);
      
      const response = await this.client.responses.create({
        model,
        instructions: safeInstructions,
        input,
      });

      return {
        output: response.output_text,
        requestId: response._request_id,
      };
    } catch (error) {
      Logger.error("Error generating response:", error);
      throw error;
    }
  }

  /**
   * Stream a response from OpenAI with input validation and safety measures
   * @param input User input for the agent
   * @param instructions System instructions for the agent
   * @param model OpenAI model to use
   * @returns A stream of response chunks
   */
  async streamResponse(
    input: string,
    instructions: string = "You are a helpful assistant",
    model: string = "gpt-4o"
  ) {
    try {
      // Validate and sanitize input
      this.validateInput(input);
      
      // Enhance instructions with safety guidelines
      const safeInstructions = this.enhanceWithSafetyGuidelines(instructions);
      
      // Create the stream with safety measures
      const stream = await this.client.responses.create({
        model,
        instructions: safeInstructions,
        input,
        stream: true,
      });
      
      // Log for monitoring and auditing
      Logger.info(`Streaming response initiated with model ${model}`);
      
      return stream;
    } catch (error) {
      Logger.error("Error streaming response:", error);
      throw error;
    }
  }

  /**
   * Call a function through OpenAI function calling
   * @param input User input
   * @param functions Array of function definitions
   * @param instructions System instructions
   * @param model OpenAI model to use
   * @returns Function call details and parameters
   */
  async functionCall(
    input: string,
    functions: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    }>,
    instructions: string = "You are a helpful assistant that calls functions",
    model: string = "gpt-4o"
  ) {
    try {
      // Validate and sanitize input
      this.validateInput(input);
      
      // Enhance instructions with safety guidelines
      const safeInstructions = this.enhanceWithSafetyGuidelines(instructions);
      
      const tools = functions.map((fn) => ({
        type: "function" as const,
        function: {
          name: fn.name,
          description: fn.description,
          parameters: fn.parameters,
        },
      }));

      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: safeInstructions },
          { role: "user", content: input },
        ],
        tools,
        tool_choice: "auto",
      });

      const toolCalls = response.choices[0]?.message?.tool_calls;

      return {
        toolCalls,
        messageContent: response.choices[0]?.message?.content,
        requestId: response.id,
      };
    } catch (error) {
      Logger.error("Error making function call:", error);
      throw error;
    }
  }
  
  /**
   * Validates input for safety and format requirements
   * @param input User input to validate
   * @throws Error if input is invalid or potentially harmful
   */
  private validateInput(input: string): void {
    // Validate input is a non-empty string
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: Input must be a non-empty string');
    }
    
    // Check for suspicious patterns that might indicate adversarial input
    const suspiciousPatterns = [
      /(\beval\s*\(|\bexec\s*\()/i,           // Code execution attempts
      /(<script|javascript:|data:text\/html)/i, // Script injection
      /(<!--)|(%3C!--|&#x3C;!--)/i            // HTML comments (often used to hide malicious code)
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(input))) {
      Logger.warn("Potentially harmful input detected and blocked");
      throw new Error('Input contains potentially harmful patterns');
    }
    
    // Check input length to prevent prompt injection through excessive text
    if (input.length > this.MAX_INPUT_LENGTH) {
      Logger.warn(`Input exceeds maximum length (${input.length} > ${this.MAX_INPUT_LENGTH})`);
      throw new Error(`Input exceeds maximum length of ${this.MAX_INPUT_LENGTH} characters`);
    }
  }
  
  /**
   * Enhances instructions with safety guidelines
   * @param baseInstructions Original instructions
   * @returns Enhanced instructions with safety guidelines
   */
  private enhanceWithSafetyGuidelines(baseInstructions: string): string {
    return `${baseInstructions}
    
Important safety guidelines:
1. Provide accurate and helpful information
2. Refuse to generate harmful, illegal, or unethical content
3. Maintain user privacy and data security
4. Do not execute code injections or other security exploits
5. Do not disclose sensitive information`;
  }
}