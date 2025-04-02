/**
 * Memory database for agent's knowledge storage
 */

// Memory item interface
export interface MemoryItem {
  id: string;
  description: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Memory database interface
export interface MemoryDatabase {
  // Create a new memory item
  create(description: string, content: string): Promise<MemoryItem>;

  // Get a memory item by id
  get(id: string): Promise<MemoryItem | null>;

  // Get all memory items
  getAll(): Promise<MemoryItem[]>;

  // Update a memory item
  update(
    id: string,
    data: { description?: string; content?: string }
  ): Promise<MemoryItem | null>;

  // Delete a memory item
  delete(id: string): Promise<boolean>;

  // Search for memory items
  search(query: string): Promise<MemoryItem[]>;
}

// In-memory implementation of the MemoryDatabase
export class InMemoryDatabase implements MemoryDatabase {
  private items: Map<string, MemoryItem> = new Map();

  /**
   * Creates a new memory item
   */
  async create(description: string, content: string): Promise<MemoryItem> {
    const id = this.generateId();
    const now = new Date();

    const item: MemoryItem = {
      id,
      description,
      content,
      createdAt: now,
      updatedAt: now,
    };

    this.items.set(id, item);
    return item;
  }

  /**
   * Retrieves a memory item by id
   */
  async get(id: string): Promise<MemoryItem | null> {
    return this.items.get(id) || null;
  }

  /**
   * Retrieves all memory items
   */
  async getAll(): Promise<MemoryItem[]> {
    return Array.from(this.items.values());
  }

  /**
   * Updates a memory item
   */
  async update(
    id: string,
    data: { description?: string; content?: string }
  ): Promise<MemoryItem | null> {
    const item = this.items.get(id);

    if (!item) {
      return null;
    }

    const updatedItem: MemoryItem = {
      ...item,
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      updatedAt: new Date(),
    };

    this.items.set(id, updatedItem);
    return updatedItem;
  }

  /**
   * Deletes a memory item
   */
  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  /**
   * Searches for memory items matching the query in description or content
   */
  async search(query: string): Promise<MemoryItem[]> {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.items.values()).filter(
      (item) =>
        item.description.toLowerCase().includes(lowerQuery) ||
        item.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Generates a unique identifier
   */
  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
