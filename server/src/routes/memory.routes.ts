import { Router } from "express";
import { MemoryController } from "../controllers/memory.controller";

export const memoryRouter = Router();

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
