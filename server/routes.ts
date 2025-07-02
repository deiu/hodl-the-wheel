import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // No API routes needed - game runs entirely in browser
  
  const httpServer = createServer(app);
  return httpServer;
}
