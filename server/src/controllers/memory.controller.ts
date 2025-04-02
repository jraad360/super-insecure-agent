import { Request, Response } from "express";
import { MemoryService } from "../services/memory.service";

// Singleton memory service instance
const memoryService = new MemoryService();

// Constants for input validation
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_CONTENT_LENGTH = 10000;

export const MemoryController = {
  /**
   * Create a new memory item
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { description, content } = req.body;

      // Check for presence
      if (!description || !content) {
        res.status(400).json({ error: "Description and content are required" });
        return;
      }

      // Validate data types
      if (typeof description !== 'string' || typeof content !== 'string') {
        res.status(400).json({ error: "Description and content must be strings" });
        return;
      }

      // Validate length
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        res.status(400).json({ error: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters` });
        return;
      }
      
      if (content.length > MAX_CONTENT_LENGTH) {
        res.status(400).json({ error: `Content cannot exceed ${MAX_CONTENT_LENGTH} characters` });
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

      // Validate types and length if provided
      if (description !== undefined) {
        if (typeof description !== 'string') {
          res.status(400).json({ error: "Description must be a string" });
          return;
        }
        
        if (description.length > MAX_DESCRIPTION_LENGTH) {
          res.status(400).json({ error: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters` });
          return;
        }
      }
      
      if (content !== undefined) {
        if (typeof content !== 'string') {
          res.status(400).json({ error: "Content must be a string" });
          return;
        }
        
        if (content.length > MAX_CONTENT_LENGTH) {
          res.status(400).json({ error: `Content cannot exceed ${MAX_CONTENT_LENGTH} characters` });
          return;
        }
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

      if (!query || typeof query !== "string") {
        res.status(400).json({ error: "Search query is required" });
        return;
      }

      const memories = await memoryService.searchMemories(query);
      res.status(200).json(memories);
    } catch (error) {
      res.status(500).json({ error: "Failed to search memory items" });
    }
  },
};