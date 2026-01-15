import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import Auth and Chat models to re-export
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// === PROFILES ===
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  age: integer("age"),
  gender: text("gender"), // 'male', 'female', 'other'
  height: doublePrecision("height"), // in cm
  weight: doublePrecision("weight"), // in kg
  targetWeight: doublePrecision("target_weight"), // in kg
  goal: text("goal"), // 'weight_loss', 'muscle_building', 'maintenance'
  activityLevel: text("activity_level"), // 'sedentary', 'light', 'moderate', 'active', 'very_active'
  dietaryPreferences: text("dietary_preferences"), // e.g. 'vegan', 'keto'
  allergies: text("allergies"),
  socialInstagram: text("social_instagram"),
  socialTwitter: text("social_twitter"),
  socialFacebook: text("social_facebook"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === MEALS ===
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  description: text("description").notNull(), // User text or "Image Upload"
  imageUrl: text("image_url"),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs").notNull(),
  fats: integer("fats").notNull(),
  date: timestamp("date").defaultNow(),
});

// === RECIPES ===
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  ingredients: jsonb("ingredients").notNull(), // Array of strings
  instructions: text("instructions").notNull(),
  macros: jsonb("macros").notNull(), // { calories, protein, carbs, fats }
  isSaved: boolean("is_saved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === CHEAT MEALS ===
export const cheatMeals = pgTable("cheat_meals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  calories: integer("calories"), // Estimated
  alternative: text("alternative"), // AI suggestion
  alternativeMacros: jsonb("alternative_macros"), // { calories, protein, carbs, fats }
  date: timestamp("date").defaultNow(),
});

// === RELATIONS ===
export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const mealsRelations = relations(meals, ({ one }) => ({
  user: one(users, {
    fields: [meals.userId],
    references: [users.id],
  }),
}));

export const recipesRelations = relations(recipes, ({ one }) => ({
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
}));

export const cheatMealsRelations = relations(cheatMeals, ({ one }) => ({
  user: one(users, {
    fields: [cheatMeals.userId],
    references: [users.id],
  }),
}));


// === SCHEMAS ===
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, userId: true, createdAt: true, updatedAt: true });
export const insertMealSchema = createInsertSchema(meals).omit({ id: true, userId: true, date: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, userId: true, createdAt: true });
export const insertCheatMealSchema = createInsertSchema(cheatMeals).omit({ id: true, userId: true, date: true });

// === TYPES ===
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type CheatMeal = typeof cheatMeals.$inferSelect;
export type InsertCheatMeal = z.infer<typeof insertCheatMealSchema>;

export type ProfileResponse = Profile;
export type MealResponse = Meal;
export type RecipeResponse = Recipe;
export type CheatMealResponse = CheatMeal;
