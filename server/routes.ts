import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add a simple health check route for debugging
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });
  
  // No other API routes needed - game runs entirely in browser
  
  const httpServer = createServer(app);
  return httpServer;
}
