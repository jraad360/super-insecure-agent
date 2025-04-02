import { Request, Response } from "express";
import { MemoryService } from "../services/memory.service";

// Singleton memory service instance
const memoryService = new MemoryService();

export const MemoryController = {
  /**
   * Create a new memory item
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { description, content } = req.body;

      if (!description || !content) {
        res.status(400).json({ error: "Description and content are required" });
        return;
      }

      const memory = await memoryService.storeMemory(description, content);
      res.status(201).json(memory);
    } catch (error) {
      res.status(500).json({ error: "Failed to create memory item" });
    }
  },

  /**
   * Get a memory item by id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const memory = await memoryService.getMemory(id);

      if (!memory) {
        res.status(404).json({ error: "Memory item not found" });
        return;
      }

      res.status(200).json(memory);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve memory item" });
    }
  },

  /**
   * Get all memory items
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const memories = await memoryService.getAllMemories();
      res.status(200).json(memories);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve memory items" });
    }
  },

  /**
   * Update a memory item
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { description, content } = req.body;

      if (!description && !content) {
        res
          .status(400)
          .json({ error: "At least one field must be provided for update" });
        return;
      }

      const memory = await memoryService.updateMemory(id, {
        description,
        content,
      });

      if (!memory) {
        res.status(404).json({ error: "Memory item not found" });
        return;
      }

      res.status(200).json(memory);
    } catch (error) {
      res.status(500).json({ error: "Failed to update memory item" });
    }
  },

  /**
   * Delete a memory item
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await memoryService.deleteMemory(id);

      if (!deleted) {
        res.status(404).json({ error: "Memory item not found" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete memory item" });
    }
  },

  /**
   * Search for memory items
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;

      // Check if query exists and is a string
      if (!query || typeof query !== "string") {
        res.status(400).json({ error: "Search query is required" });
        return;
      }

      // Validate query length to prevent excessive inputs
      const MAX_QUERY_LENGTH = 500;
      if (query.length > MAX_QUERY_LENGTH) {
        res.status(400).json({ 
          error: `Search query exceeds maximum length of ${MAX_QUERY_LENGTH} characters` 
        });
        return;
      }

      // Validate query format using a whitelist approach
      const VALID_QUERY_REGEX = /^[a-zA-Z0-9\s.,?!;:'"()\-_]*$/;
      if (!VALID_QUERY_REGEX.test(query)) {
        res.status(400).json({ 
          error: "Search query contains invalid characters" 
        });
        return;
      }

      const memories = await memoryService.searchMemories(query);
      res.status(200).json(memories);
    } catch (error) {
      res.status(500).json({ error: "Failed to search memory items" });
    }
  },
};