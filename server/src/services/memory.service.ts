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
   * Validate and sanitize the search query to prevent ML input bias
   * @private
   */
  private validateQuery(query: string): string {
    if (query === null || query === undefined) {
      throw new Error("Search query cannot be null or undefined");
    }

    // Convert to string if not already
    let validatedQuery = String(query).trim();
    
    // Limit query length to prevent DoS attacks
    const MAX_QUERY_LENGTH = 500;
    if (validatedQuery.length > MAX_QUERY_LENGTH) {
      validatedQuery = validatedQuery.substring(0, MAX_QUERY_LENGTH);
    }

    // Normalize whitespace
    validatedQuery = validatedQuery.replace(/\s+/g, ' ');

    return validatedQuery;
  }

  /**
   * Search for memories
   */
  async searchMemories(query: string): Promise<MemoryItem[]> {
    const validatedQuery = this.validateQuery(query);
    return this.db.search(validatedQuery);
  }
}