import OpenAI from "openai";
import { env } from "../config/env";
import { Logger } from "../utils/logger";

/**
 * Service class for interacting with OpenAI's API
 */
export class OpenAIService {
  private client: OpenAI;

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
      const response = await this.client.responses.create({
        model,
        instructions,
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
   * Stream a response from OpenAI
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
      return await this.client.responses.create({
        model,
        instructions,
        input,
        stream: true,
      });
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
          { role: "system", content: instructions },
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
}
