import { users, highScores, type User, type InsertUser, type HighScore, type InsertHighScore } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getHighScores(): Promise<HighScore[]>;
  addHighScore(score: InsertHighScore): Promise<HighScore>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private highScores: HighScore[];
  private currentUserId: number;
  private currentScoreId: number;

  constructor() {
    this.users = new Map();
    this.highScores = [];
    this.currentUserId = 1;
    this.currentScoreId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getHighScores(): Promise<HighScore[]> {
    return this.highScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  async addHighScore(insertScore: InsertHighScore): Promise<HighScore> {
    const id = this.currentScoreId++;
    const score: HighScore = { ...insertScore, id };
    this.highScores.push(score);
    return score;
  }
}

export const storage = new MemStorage();
