import { MemoryDatabase, MemoryItem, InMemoryDatabase } from "../models/memory";

/**
 * Service for managing agent memory
 */
export class MemoryService {
  private db: MemoryDatabase;

  constructor(database?: MemoryDatabase) {
    // Use provided database or create a new in-memory database
    this.db = database || new InMemoryDatabase();
  }

  /**
   * Store a new piece of information in the memory
   */
  async storeMemory(description: string, content: string): Promise<MemoryItem> {
    return this.db.create(description, content);
  }

  /**
   * Retrieve a memory by id
   */
  async getMemory(id: string): Promise<MemoryItem | null> {
    return this.db.get(id);
  }

  /**
   * Get all memories
   */
  async getAllMemories(): Promise<MemoryItem[]> {
    return this.db.getAll();
  }

  /**
   * Update a memory item
   */
  async updateMemory(
    id: string,
    data: { description?: string; content?: string }
  ): Promise<MemoryItem | null> {
    return this.db.update(id, data);
  }

  /**
   * Delete a memory item
   */
  async deleteMemory(id: string): Promise<boolean> {
    return this.db.delete(id);
  }

  /**
   * Search for memories
   */
  async searchMemories(query: string): Promise<MemoryItem[]> {
    return this.db.search(query);
  }
}
