import { Request, Response } from "express";
import { AgentService } from "../services/agent.service";
import { Logger } from "../utils/logger";

export class AgentController {
  private agentService: AgentService;

  constructor() {
    this.agentService = new AgentService();
  }

  /**
   * Generate a response from the agent
   */
  async getResponse(req: Request, res: Response): Promise<void> {
    try {
      const { input, instructions, model, useMemory } = req.body;

      // Validate input
      if (!input || typeof input !== "string" || input.trim() === "") {
        res.status(400).json({ error: "Valid input string is required" });
        return;
      }

      // Validate instructions if provided
      if (instructions !== undefined && typeof instructions !== "string") {
        res.status(400).json({ error: "Instructions must be a string if provided" });
        return;
      }

      // Validate model if provided
      if (model !== undefined && typeof model !== "string") {
        res.status(400).json({ error: "Model must be a string if provided" });
        return;
      }

      // Validate useMemory if provided
      if (useMemory !== undefined && typeof useMemory !== "boolean") {
        res.status(400).json({ error: "useMemory must be a boolean if provided" });
        return;
      }

      // Use memory-enhanced response if requested
      const response = useMemory
        ? await this.agentService.generateResponseWithMemory(
            input,
            instructions || "",
            model || ""
          )
        : await this.agentService.generateResponse(
            input,
            instructions || "",
            model || ""
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

      // Validate input
      if (!input || typeof input !== "string" || input.trim() === "") {
        res.status(400).json({ error: "Valid input string is required" });
        return;
      }

      // Validate instructions if provided
      if (instructions !== undefined && typeof instructions !== "string") {
        res.status(400).json({ error: "Instructions must be a string if provided" });
        return;
      }

      // Validate model if provided
      if (model !== undefined && typeof model !== "string") {
        res.status(400).json({ error: "Model must be a string if provided" });
        return;
      }

      // Set headers for SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await this.agentService.streamResponse(
        input,
        instructions || "",
        model || ""
      );

      let completeResponse = "";

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
          // Accumulate the response for memory updates later
          if (chunkData.content) {
            completeResponse += chunkData.content;
          }
        } else if (chunk.type.includes("done")) {
          chunkData.done = true;

          // After stream is done, update memory with the complete response
          try {
            const memoryUpdateResult =
              await this.agentService.updateMemoryAfterStream(
                input,
                completeResponse
              );
            chunkData.memoryUpdate = memoryUpdateResult;
          } catch (memError) {
            Logger.error("Error updating memory after stream:", memError);
          }
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

      // Validate input
      if (!input || typeof input !== "string" || input.trim() === "") {
        res.status(400).json({ error: "Valid input string is required" });
        return;
      }

      if (!functions || !Array.isArray(functions) || functions.length === 0) {
        res.status(400).json({ error: "Valid functions array is required" });
        return;
      }

      // Validate instructions if provided
      if (instructions !== undefined && typeof instructions !== "string") {
        res.status(400).json({ error: "Instructions must be a string if provided" });
        return;
      }

      // Validate model if provided
      if (model !== undefined && typeof model !== "string") {
        res.status(400).json({ error: "Model must be a string if provided" });
        return;
      }

      // We'll continue to use the OpenAI service directly for generic function calls
      // This is handled internally in the AgentService
      const response = await this.agentService.processMemoryToolCall(
        input,
        instructions || ""
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

  /**
   * Get all memory items
   */
  async getMemories(req: Request, res: Response): Promise<void> {
    try {
      const memories = await this.agentService.getAllMemories();
      res.status(200).json(memories);
    } catch (error) {
      Logger.error("Error getting memories:", error);
      res.status(500).json({
        error: "An error occurred while retrieving memories",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Search memory items
   */
  async searchMemories(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;

      if (!query || typeof query !== "string") {
        res.status(400).json({ error: "Search query is required" });
        return;
      }

      const memories = await this.agentService.searchMemories(query);
      res.status(200).json(memories);
    } catch (error) {
      Logger.error("Error searching memories:", error);
      res.status(500).json({
        error: "An error occurred while searching memories",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}