import { Request, Response } from "express";
import { OpenAIService } from "../services/openai.service";
import { Logger } from "../utils/logger";

export class AgentController {
  private openAIService: OpenAIService;

  constructor() {
    this.openAIService = new OpenAIService();
  }

  /**
   * Generate a response from the agent
   */
  async getResponse(req: Request, res: Response): Promise<void> {
    try {
      const { input, instructions, model } = req.body;

      if (!input) {
        res.status(400).json({ error: "Input is required" });
        return;
      }

      const response = await this.openAIService.generateResponse(
        input,
        instructions,
        model
      );

      res.status(200).json(response);
    } catch (error) {
      Logger.error("Error in getResponse:", error);
      res.status(500).json({
        error: "An error occurred while processing your request",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Stream a response from the agent
   */
  async streamResponse(req: Request, res: Response): Promise<void> {
    try {
      const { input, instructions, model } = req.body;

      if (!input) {
        res.status(400).json({ error: "Input is required" });
        return;
      }

      // Set headers for SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await this.openAIService.streamResponse(
        input,
        instructions,
        model
      );

      // Handle streaming response
      for await (const chunk of stream) {
        // Convert chunk to a simple data format that the client can handle
        const chunkData: any = {
          type: chunk.type,
          done: false,
        };

        // Add relevant data based on chunk type
        if (chunk.type.includes("delta")) {
          chunkData.content = "delta" in chunk ? chunk.delta : "";
        } else if (chunk.type.includes("done")) {
          chunkData.done = true;
        } else if (chunk.type === "error") {
          Logger.error("Error in stream:", chunk);
          chunkData.error = "An error occurred in the stream";
        }

        // Send the chunk as an SSE event
        res.write(`data: ${JSON.stringify(chunkData)}\n\n`);

        // If client closes the connection, stop streaming
        if (res.writableEnded) {
          break;
        }
      }

      // End the response stream
      res.end();
    } catch (error) {
      Logger.error("Error in streamResponse:", error);
      // Only send error if headers weren't already sent
      if (!res.headersSent) {
        res.status(500).json({
          error: "An error occurred while streaming the response",
          details: error instanceof Error ? error.message : String(error),
        });
      } else {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            error: "An error occurred while streaming the response",
            details: error instanceof Error ? error.message : String(error),
          })}\n\n`
        );
        res.end();
      }
    }
  }

  /**
   * Make a function call through the agent
   */
  async functionCall(req: Request, res: Response): Promise<void> {
    try {
      const { input, functions, instructions, model } = req.body;

      if (!input) {
        res.status(400).json({ error: "Input is required" });
        return;
      }

      if (!functions || !Array.isArray(functions) || functions.length === 0) {
        res.status(400).json({ error: "Valid functions array is required" });
        return;
      }

      const response = await this.openAIService.functionCall(
        input,
        functions,
        instructions,
        model
      );

      res.status(200).json(response);
    } catch (error) {
      Logger.error("Error in functionCall:", error);
      res.status(500).json({
        error: "An error occurred while processing the function call",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
