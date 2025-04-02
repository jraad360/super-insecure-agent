import { Router, Request, Response } from "express";
import { AgentController } from "../controllers/agent.controller";

const router = Router();
const agentController = new AgentController();

// Route for generating a response
router.post("/generate", (req: Request, res: Response) =>
  agentController.getResponse(req, res)
);

// Route for streaming a response
router.post("/stream", (req: Request, res: Response) =>
  agentController.streamResponse(req, res)
);

// Route for making function calls (now memory-specific tool calls)
router.post("/memory-tool", (req: Request, res: Response) =>
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
