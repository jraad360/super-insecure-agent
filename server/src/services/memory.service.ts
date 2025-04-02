import { MemoryItem, InMemoryDatabase } from "../models/memory";
import { Logger } from "../utils/logger";

/**
 * Service class for memory management
 */
export class MemoryService {
  private db: InMemoryDatabase;

  constructor() {
    this.db = new InMemoryDatabase();
  }

  /**
   * Store a new memory item
   */
  async storeMemory(description: string, content: string): Promise<MemoryItem> {
    try {
      return await this.db.create(description, content);
    } catch (error) {
      Logger.error("Error storing memory:", error);
      throw error;
    }
  }

  /**
   * Get a memory item by ID
   */
  async getMemory(id: string): Promise<MemoryItem | null> {
    try {
      return await this.db.get(id);
    } catch (error) {
      Logger.error("Error getting memory:", error);
      throw error;
    }
  }

  /**
   * Update a memory item
   */
  async updateMemory(
    id: string,
    update: { description?: string; content?: string }
  ): Promise<MemoryItem | null> {
    try {
      return await this.db.update(id, update);
    } catch (error) {
      Logger.error("Error updating memory:", error);
      throw error;
    }
  }

  /**
   * Delete a memory item
   */
  async deleteMemory(id: string): Promise<boolean> {
    try {
      return await this.db.delete(id);
    } catch (error) {
      Logger.error("Error deleting memory:", error);
      throw error;
    }
  }

  /**
   * Get all memory items
   */
  async getAllMemories(): Promise<MemoryItem[]> {
    try {
      return await this.db.getAll();
    } catch (error) {
      Logger.error("Error getting all memories:", error);
      throw error;
    }
  }

  /**
   * Search memory items
   */
  async searchMemories(query: string): Promise<MemoryItem[]> {
    try {
      return await this.db.search(query);
    } catch (error) {
      Logger.error("Error searching memories:", error);
      throw error;
    }
  }

  /**
   * Get memories relevant to the provided input
   */
  async getRelevantMemories(input: string): Promise<MemoryItem[]> {
    try {
      // Extract keywords from the input
      const keywords = this.extractKeywords(input);

      // If no keywords found, return empty array
      if (keywords.length === 0) {
        return [];
      }

      // Get all memories first
      const allMemories = await this.db.getAll();

      // Score each memory based on keyword matches
      const scoredMemories = allMemories.map((memory) => {
        let score = 0;
        const memoryText =
          `${memory.description} ${memory.content}`.toLowerCase();

        for (const keyword of keywords) {
          if (memoryText.includes(keyword.toLowerCase())) {
            score += 1;
          }
        }

        return { memory, score };
      });

      // Filter memories with at least one keyword match and sort by score
      return scoredMemories
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.memory);
    } catch (error) {
      Logger.error("Error getting relevant memories:", error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Extract keywords from text input
   * This is a simple implementation that removes common words
   */
  private extractKeywords(input: string): string[] {
    // Convert to lowercase and remove punctuation
    const text = input.toLowerCase().replace(/[^\w\s]/g, "");

    // Split into words
    const words = text.split(/\s+/);

    // Filter out common words and single letters
    const commonWords = new Set([
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "shall",
      "should",
      "can",
      "could",
      "may",
      "might",
      "must",
      "to",
      "of",
      "in",
      "on",
      "at",
      "by",
      "for",
      "with",
      "about",
      "against",
      "between",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "from",
      "up",
      "down",
      "out",
      "off",
      "over",
      "under",
      "again",
      "further",
      "then",
      "once",
      "here",
      "there",
      "when",
      "where",
      "why",
      "how",
      "all",
      "any",
      "both",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "than",
      "too",
      "very",
      "you",
      "your",
      "yours",
      "yourself",
      "yourselves",
      "i",
      "me",
      "my",
      "myself",
      "we",
      "our",
      "ours",
      "ourselves",
      "what",
      "which",
      "who",
      "whom",
      "this",
      "that",
      "these",
      "those",
      "am",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "it",
      "its",
      "itself",
      "they",
      "them",
      "their",
      "theirs",
      "themselves",
    ]);

    return words
      .filter((word) => word.length > 1 && !commonWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }
}
