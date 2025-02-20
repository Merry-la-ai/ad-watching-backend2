import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWithdrawalSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express) {
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);

      if (existingUser) {
        return res.status(200).json(existingUser);
      }

      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/ads", async (_req, res) => {
    try {
      const ads = await storage.getAds();
      res.json(ads);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/watch/:userId/:adId", async (req, res) => {
    try {
      const { userId, adId } = req.params;
      const user = await storage.getUser(parseInt(userId));
      const ads = await storage.getAds();
      const ad = ads.find(a => a.id === parseInt(adId));

      if (!user || !ad) {
        return res.status(404).json({ message: "User or ad not found" });
      }

      const updatedUser = await storage.updateUserBalance(user.id, parseFloat(ad.reward));
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // New withdrawal endpoints
  app.post("/api/withdraw/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const withdrawalData = insertWithdrawalSchema.parse(req.body);
      const withdrawal = await storage.createWithdrawal(parseInt(userId), withdrawalData);
      res.status(201).json(withdrawal);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/withdrawals/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const withdrawals = await storage.getUserWithdrawals(parseInt(userId));
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return createServer(app);
}