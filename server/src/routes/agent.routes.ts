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

// Route for making function calls
router.post("/function-call", (req: Request, res: Response) =>
  agentController.functionCall(req, res)
);

export const agentRouter = router;
