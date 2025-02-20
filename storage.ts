import { users, ads, withdrawals, type User, type InsertUser, type Ad, type Withdrawal, type InsertWithdrawal } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User>;
  getAds(): Promise<Ad[]>;
  createWithdrawal(userId: number, withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getUserWithdrawals(userId: number): Promise<Withdrawal[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private ads: Map<number, Ad>;
  private withdrawals: Map<number, Withdrawal>;
  private currentUserId: number;
  private currentAdId: number;
  private currentWithdrawalId: number;

  constructor() {
    this.users = new Map();
    this.ads = new Map();
    this.withdrawals = new Map();
    this.currentUserId = 1;
    this.currentAdId = 1;
    this.currentWithdrawalId = 1;

    // Seed more engaging sample ads
    const sampleAds: Omit<Ad, "id">[] = [
      {
        title: "Latest iPhone 15 Pro Review",
        description: "Discover the revolutionary features of the new iPhone 15 Pro. Watch our detailed hands-on review.",
        reward: "0.75",
        duration: "45",
      },
      {
        title: "Crypto Trading Tutorial",
        description: "Learn the basics of cryptocurrency trading in this beginner-friendly guide.",
        reward: "1.25",
        duration: "60",
      },
      {
        title: "Tesla's New Model Launch",
        description: "Be among the first to see Tesla's groundbreaking new electric vehicle.",
        reward: "2.00",
        duration: "60",
      },
      {
        title: "Quick Gaming Highlights",
        description: "Watch exciting moments from the latest AAA game releases.",
        reward: "0.25",
        duration: "15",
      },
      {
        title: "Eco-Friendly Product Showcase",
        description: "Discover innovative sustainable products that are changing the world.",
        reward: "0.50",
        duration: "30",
      },
      {
        title: "Travel Destination Spotlight",
        description: "Experience the beauty of exotic destinations in stunning 4K quality.",
        reward: "1.00",
        duration: "45",
      },
      {
        title: "Tech Gadget Unboxing",
        description: "Watch the unboxing of the latest must-have tech gadgets and accessories.",
        reward: "0.75",
        duration: "30",
      },
      {
        title: "Fitness Workout Preview",
        description: "Get motivated with this preview of our premium workout series.",
        reward: "0.50",
        duration: "20",
      }
    ];

    sampleAds.forEach((ad) => {
      this.ads.set(this.currentAdId, { ...ad, id: this.currentAdId });
      this.currentAdId++;
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, balance: "0" };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(id: number, amount: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");

    const newBalance = parseFloat(user.balance) + amount;
    const updatedUser = { ...user, balance: newBalance.toString() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAds(): Promise<Ad[]> {
    return Array.from(this.ads.values());
  }

  async createWithdrawal(userId: number, withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const amount = parseFloat(withdrawal.amount);
    const balance = parseFloat(user.balance);

    if (amount > balance) {
      throw new Error("Insufficient balance");
    }

    const id = this.currentWithdrawalId++;
    const newWithdrawal: Withdrawal = {
      id,
      userId,
      amount: withdrawal.amount,
      status: "pending",
      network: withdrawal.network,
      walletAddress: withdrawal.walletAddress,
      createdAt: new Date(),
    };

    // Deduct the amount from user's balance
    await this.updateUserBalance(userId, -amount);
    this.withdrawals.set(id, newWithdrawal);
    return newWithdrawal;
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values()).filter(
      (withdrawal) => withdrawal.userId === userId
    );
  }
}

export const storage = new MemStorage();