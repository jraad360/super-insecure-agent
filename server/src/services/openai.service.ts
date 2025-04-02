import OpenAI from "openai";
import { env } from "../config/env";
import { Logger } from "../utils/logger";
import { ChatCompletionMessageParam } from "openai/resources";

type MessageRole = "system" | "user" | "assistant" | "function" | "tool";

interface Message {
  role: MessageRole;
  content: string;
}

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
   * @param context Optional conversation history
   * @returns The generated response
   */
  async generateResponse(
    input: string,
    instructions: string = "You are a helpful assistant",
    model: string = "gpt-4o",
    context?: Array<{ role: string; content: string }>
  ) {
    try {
      if (context && context.length > 0) {
        // Use chat completions API for context support
        const messages: ChatCompletionMessageParam[] = [
          { role: "system", content: instructions },
          ...context.map((msg) => {
            const role = msg.role as
              | "system"
              | "user"
              | "assistant"
              | "function"
              | "tool";
            return { role, content: msg.content } as ChatCompletionMessageParam;
          }),
        ];

        const response = await this.client.chat.completions.create({
          model,
          messages,
        });

        return {
          output: response.choices[0]?.message?.content || "",
          requestId: response.id,
        };
      } else {
        // Use responses API for simple exchanges
        const response = await this.client.responses.create({
          model,
          instructions,
          input,
        });

        return {
          output: response.output_text,
          requestId: response._request_id,
        };
      }
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
   * @param context Optional conversation history
   * @returns A stream of response chunks
   */
  async streamResponse(
    input: string,
    instructions: string = "You are a helpful assistant",
    model: string = "gpt-4o",
    context?: Array<{ role: string; content: string }>
  ) {
    try {
      if (context && context.length > 0) {
        // Use chat completions API with streaming for context support
        const messages: ChatCompletionMessageParam[] = [
          { role: "system", content: instructions },
          ...context.map((msg) => {
            const role = msg.role as
              | "system"
              | "user"
              | "assistant"
              | "function"
              | "tool";
            return { role, content: msg.content } as ChatCompletionMessageParam;
          }),
        ];

        return await this.client.chat.completions.create({
          model,
          messages,
          stream: true,
        });
      } else {
        // Use responses API for simple exchanges
        return await this.client.responses.create({
          model,
          instructions,
          input,
          stream: true,
        });
      }
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
   * @param context Optional conversation history
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
    model: string = "gpt-4o",
    context?: Array<{ role: string; content: string }>
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

      let messages: ChatCompletionMessageParam[];
      if (context && context.length > 0) {
        messages = [
          { role: "system", content: instructions },
          ...context.map((msg) => {
            const role = msg.role as
              | "system"
              | "user"
              | "assistant"
              | "function"
              | "tool";
            return { role, content: msg.content } as ChatCompletionMessageParam;
          }),
        ];
      } else {
        messages = [
          { role: "system", content: instructions },
          { role: "user", content: input },
        ];
      }

      const response = await this.client.chat.completions.create({
        model,
        messages,
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
   * Execute a memory-related function call with context support
   * @param input User input
   * @param toolDefinitions Array of memory tool definitions
   * @param toolExecutor Function to execute the selected tool
   * @param instructions System instructions
   * @param context Optional conversation history
   * @returns The result of the function call
   */
  async performMemoryFunctionCall(
    input: string,
    toolDefinitions: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    }>,
    toolExecutor: (name: string, args: any) => Promise<any>,
    instructions: string = "You are a helpful assistant with access to memory tools",
    context?: Array<{ role: string; content: string }>
  ) {
    try {
      const response = await this.functionCall(
        input,
        toolDefinitions,
        instructions,
        "gpt-4o",
        context
      );

      const toolCalls = response.toolCalls;

      if (!toolCalls || toolCalls.length === 0) {
        return {
          result: "No memory tool was called",
          output: response.messageContent || "",
        };
      }

      const functionCall = toolCalls[0];
      const args = JSON.parse(functionCall.function.arguments);

      // Execute the tool
      const result = await toolExecutor(functionCall.function.name, args);

      return {
        tool: functionCall.function.name,
        arguments: args,
        result,
        output: response.messageContent || "",
      };
    } catch (error) {
      Logger.error("Error executing memory function call:", error);
      throw error;
    }
  }
}
