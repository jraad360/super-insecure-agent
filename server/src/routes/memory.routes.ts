import { Router, Request, Response, NextFunction } from "express";
import { MemoryController } from "../controllers/memory.controller";

export const memoryRouter = Router();

// Security middleware for memory routes
const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Authentication check
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Input validation
  if (req.method === "POST" || req.method === "PATCH") {
    const { content } = req.body;
    
    // Validate required content
    if (!content || typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ error: "Valid memory content is required" });
    }
    
    // Check for potentially harmful content patterns
    const suspiciousPatterns = [/<script>/i, /javascript:/i, /on\w+=/i];
    if (suspiciousPatterns.some(pattern => pattern.test(content))) {
      return res.status(400).json({ error: "Potentially harmful content detected" });
    }
  }
  
  // Validate ID parameter if present
  if (req.params.id && !/^[a-zA-Z0-9-_]+$/.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid ID format" });
  }
  
  // Validate search query if present
  if (req.path === "/search" && req.method === "GET") {
    const { query } = req.query;
    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({ error: "Valid search query is required" });
    }
  }
  
  next();
};

// Apply security middleware to all memory routes
memoryRouter.use(securityMiddleware);

// Create a new memory item
memoryRouter.post("/", MemoryController.create);

// Get all memory items
memoryRouter.get("/", MemoryController.getAll);

// Search memory items
memoryRouter.get("/search", MemoryController.search);

// Get a specific memory item
memoryRouter.get("/:id", MemoryController.getById);

// Update a memory item
memoryRouter.patch("/:id", MemoryController.update);

// Delete a memory item
memoryRouter.delete("/:id", MemoryController.delete);