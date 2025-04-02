import { Router, Request, Response, NextFunction } from "express";
import { AgentController } from "../controllers/agent.controller";

const router = Router();
const agentController = new AgentController();

// Input validation and sanitization middleware for the memory-tool endpoint
function secureMemoryToolInput(req: Request, res: Response, next: NextFunction) {
  // Basic request body validation
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ 
      error: "Invalid request format", 
      message: "Request body must be a valid JSON object" 
    });
  }
  
  // Create a clean copy of the request body
  const sanitizedBody = { ...req.body };
  
  // Sanitize potentially dangerous properties
  const dangerousProps = ['__proto__', 'constructor', 'prototype'];
  dangerousProps.forEach(prop => {
    if (prop in sanitizedBody) {
      delete sanitizedBody[prop];
      console.warn(`Removed potentially dangerous property '${prop}' from request`);
    }
  });
  
  // Size validation to prevent DoS
  const requestSize = JSON.stringify(sanitizedBody).length;
  const maxSize = 100000; // 100KB, adjust as needed
  if (requestSize > maxSize) {
    return res.status(413).json({
      error: "Payload too large",
      message: `Request body exceeds the maximum size of ${maxSize} bytes`
    });
  }
  
  // Replace request body with sanitized version
  req.body = sanitizedBody;
  
  // Continue processing
  next();
}

// Route for generating a response
router.post("/generate", (req: Request, res: Response) =>
  agentController.getResponse(req, res)
);

// Route for streaming a response
router.post("/stream", (req: Request, res: Response) =>
  agentController.streamResponse(req, res)
);

// Route for making function calls (now memory-specific tool calls)
// Apply security middleware to validate and sanitize input
router.post("/memory-tool", secureMemoryToolInput, (req: Request, res: Response) =>
  agentController.functionCall(req, res)
);

// Route to get all agent memories
router.get("/memories", (req: Request, res: Response) =>
  agentController.getMemories(req, res)
);

// Route to search agent memories
router.get("/memories/search", (req: Request, res: Response) =>
  agentController.searchMemories(req, res)
);

export const agentRouter = router;