import { MemoryDatabase, MemoryItem, InMemoryDatabase } from "../models/memory";

/**
 * Service for managing agent memory
 */
export class MemoryService {
  private db: MemoryDatabase;
  // Maximum allowed length for content and description
  private readonly MAX_DESCRIPTION_LENGTH = 1000; 
  private readonly MAX_CONTENT_LENGTH = 50000; 

  constructor(database?: MemoryDatabase) {
    // Use provided database or create a new in-memory database
    this.db = database || new InMemoryDatabase();
  }

  /**
   * Validate input to prevent potential adversarial attacks
   * Provides basic protection against common issues
   */
  private validateInput(input: string, maxLength: number, fieldName: string): string {
    // Basic validation
    if (input === undefined || input === null) {
      throw new Error(`${fieldName} cannot be null or undefined`);
    }

    if (typeof input !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    
    // Length validation to prevent resource exhaustion
    if (input.length > maxLength) {
      throw new Error(`${fieldName} exceeds maximum allowed length of ${maxLength} characters`);
    }
    
    // Basic sanitization - trim whitespace
    const sanitized = input.trim();
    
    // Ensure non-empty content
    if (sanitized.length === 0) {
      throw new Error(`${fieldName} cannot be empty`);
    }
    
    return sanitized;
  }

  /**
   * Store a new piece of information in the memory
   * Validates inputs to protect against potential adversarial manipulation
   */
  async storeMemory(description: string, content: string): Promise<MemoryItem> {
    const validatedDescription = this.validateInput(
      description, 
      this.MAX_DESCRIPTION_LENGTH, 
      'Description'
    );
    
    const validatedContent = this.validateInput(
      content,
      this.MAX_CONTENT_LENGTH,
      'Content'
    );
    
    return this.db.create(validatedDescription, validatedContent);
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
   * Validates inputs to protect against potential adversarial manipulation
   */
  async updateMemory(
    id: string,
    data: { description?: string; content?: string }
  ): Promise<MemoryItem | null> {
    const validatedData: { description?: string; content?: string } = {};
    
    if (data.description !== undefined) {
      validatedData.description = this.validateInput(
        data.description,
        this.MAX_DESCRIPTION_LENGTH,
        'Description'
      );
    }
    
    if (data.content !== undefined) {
      validatedData.content = this.validateInput(
        data.content,
        this.MAX_CONTENT_LENGTH,
        'Content'
      );
    }
    
    return this.db.update(id, validatedData);
  }

  /**
   * Delete a memory item
   */
  async deleteMemory(id: string): Promise<boolean> {
    return this.db.delete(id);
  }

  /**
   * Search for memories
   * Validates input to prevent potential injection attacks
   */
  async searchMemories(query: string): Promise<MemoryItem[]> {
    const validatedQuery = this.validateInput(
      query,
      this.MAX_DESCRIPTION_LENGTH, // Using same limit as description
      'Search query'
    );
    return this.db.search(validatedQuery);
  }
}