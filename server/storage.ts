import { users, profiles, meals, recipes, cheatMeals } from "@shared/schema";
import type { 
  User, InsertUser, 
  Profile, InsertProfile, 
  Meal, InsertMeal, 
  Recipe, InsertRecipe, 
  CheatMeal, InsertCheatMeal 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth"; // Import auth storage

export interface IStorage {
  // Auth (Delegated/Shared)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Profile
  getProfile(userId: string): Promise<Profile | undefined>;
  upsertProfile(profile: InsertProfile & { userId: string }): Promise<Profile>;

  // Meals
  getMeals(userId: string): Promise<Meal[]>;
  createMeal(meal: InsertMeal & { userId: string }): Promise<Meal>;
  deleteMeal(id: number, userId: string): Promise<void>;

  // Recipes
  getRecipes(userId: string): Promise<Recipe[]>;
  createRecipe(recipe: InsertRecipe & { userId: string }): Promise<Recipe>;
  deleteRecipe(id: number, userId: string): Promise<void>;

  // Cheat Meals
  getCheatMeals(userId: string): Promise<CheatMeal[]>;
  createCheatMeal(cheatMeal: InsertCheatMeal & { userId: string }): Promise<CheatMeal>;
  deleteCheatMeal(id: number, userId: string): Promise<void>;
  getCheatMealCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Auth
  async getUser(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Note: Replit Auth handles this via upsertUser in auth/storage.ts
    // This method might be unused if we rely solely on Replit Auth's flow
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Profile
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async upsertProfile(profileData: InsertProfile & { userId: string }): Promise<Profile> {
    // Check if profile exists
    const existing = await this.getProfile(profileData.userId);
    
    if (existing) {
      const [updated] = await db
        .update(profiles)
        .set({ ...profileData, updatedAt: new Date() })
        .where(eq(profiles.userId, profileData.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(profiles)
        .values(profileData)
        .returning();
      return created;
    }
  }

  // Meals
  async getMeals(userId: string): Promise<Meal[]> {
    return db
      .select()
      .from(meals)
      .where(eq(meals.userId, userId))
      .orderBy(desc(meals.date));
  }

  async createMeal(meal: InsertMeal & { userId: string }): Promise<Meal> {
    const [created] = await db.insert(meals).values(meal).returning();
    return created;
  }

  async deleteMeal(id: number, userId: string): Promise<void> {
    await db
      .delete(meals)
      .where(and(eq(meals.id, id), eq(meals.userId, userId)));
  }

  // Recipes
  async getRecipes(userId: string): Promise<Recipe[]> {
    return db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, userId))
      .orderBy(desc(recipes.createdAt));
  }

  async createRecipe(recipe: InsertRecipe & { userId: string }): Promise<Recipe> {
    const [created] = await db.insert(recipes).values(recipe).returning();
    return created;
  }

  async deleteRecipe(id: number, userId: string): Promise<void> {
    await db
      .delete(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
  }

  // Cheat Meals
  async getCheatMeals(userId: string): Promise<CheatMeal[]> {
    return db
      .select()
      .from(cheatMeals)
      .where(eq(cheatMeals.userId, userId))
      .orderBy(desc(cheatMeals.date));
  }

  async createCheatMeal(cheatMeal: InsertCheatMeal & { userId: string }): Promise<CheatMeal> {
    const [created] = await db.insert(cheatMeals).values(cheatMeal).returning();
    return created;
  }

  async deleteCheatMeal(id: number, userId: string): Promise<void> {
    await db
      .delete(cheatMeals)
      .where(and(eq(cheatMeals.id, id), eq(cheatMeals.userId, userId)));
  }

  async getCheatMealCount(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(cheatMeals)
      .where(
        and(
          eq(cheatMeals.userId, userId),
          sql`${cheatMeals.date} >= ${startOfMonth}`
        )
      );
    
    return Number(result[0]?.count || 0);
  }
}

export const storage = new DatabaseStorage();
