import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHighScoreSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get high scores
  app.get("/api/high-scores", async (req, res) => {
    try {
      const scores = await storage.getHighScores();
      res.json(scores);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch high scores" });
    }
  });

  // Add new high score
  app.post("/api/high-scores", async (req, res) => {
    try {
      const validatedData = insertHighScoreSchema.parse(req.body);
      const score = await storage.addHighScore(validatedData);
      res.status(201).json(score);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid score data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add high score" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
