import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerAuthRoutes, setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes, ai } from "./replit_integrations/image";
import { Modality } from "@google/genai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app); // Optional chat support
  registerImageRoutes(app); // For direct image generation if needed

  // Middleware to attach userId to request for easier access (optional helper)
  // But we use isAuthenticated on protected routes.

  // === PROFILES ===
  app.get(api.profile.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  });

  app.post(api.profile.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.profile.update.input.parse(req.body);
      const userId = req.user.claims.sub;
      const profile = await storage.upsertProfile({ ...input, userId });
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === MEALS ===
  app.get(api.meals.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const meals = await storage.getMeals(userId);
    res.json(meals);
  });

  app.post(api.meals.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.meals.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      const meal = await storage.createMeal({ ...input, userId });
      res.status(201).json(meal);
    } catch (err) {
      console.error(err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.meals.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const id = parseInt(req.params.id);
    await storage.deleteMeal(id, userId);
    res.status(204).send();
  });

  // AI MEAL ANALYSIS
  app.post(api.meals.analyze.path, isAuthenticated, async (req: any, res) => {
    try {
      const { text, image } = req.body;
      if (!text && !image) return res.status(400).json({ message: "Text or Image required" });

      const parts: any[] = [];
      if (text) parts.push({ text: `Analyze this meal description: ${text}` });
      if (image) {
         // Expecting base64 string without data:image/xxx;base64, prefix if possible, 
         // or strip it. The Gemini API expects raw base64 data.
         const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
         parts.push({ inlineData: { data: base64Data, mimeType: "image/jpeg" } });
         parts.push({ text: "Analyze this food image." });
      }

      parts.push({ text: "Return a JSON object with keys: foodName (string), calories (number), protein (number), carbs (number), fats (number). Return ONLY JSON." });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts }],
      });

      const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      // Clean up markdown code blocks if present
      const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(jsonStr);

      res.json(data);
    } catch (err) {
      console.error("AI Analysis Error:", err);
      res.status(500).json({ message: "Failed to analyze meal" });
    }
  });


  // === RECIPES ===
  app.get(api.recipes.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const recipes = await storage.getRecipes(userId);
    res.json(recipes);
  });

  app.post(api.recipes.save.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.recipes.save.input.parse(req.body);
      const userId = req.user.claims.sub;
      const recipe = await storage.createRecipe({ ...input, userId });
      res.status(201).json(recipe);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.recipes.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const id = parseInt(req.params.id);
    await storage.deleteRecipe(id, userId);
    res.status(204).send();
  });

  // AI RECIPE GENERATION
  app.post(api.recipes.generate.path, isAuthenticated, async (req: any, res) => {
    try {
      const { ingredients, dietaryPreferences } = req.body;
      const prompt = `Generate 5 healthy recipes using these ingredients: ${ingredients.join(", ")}. 
      ${dietaryPreferences ? `Dietary preferences: ${dietaryPreferences}.` : ""}
      Return a JSON array of objects. Each object must have:
      - title (string)
      - ingredients (array of strings, include quantities)
      - instructions (string, step by step)
      - macros (object with calories, protein, carbs, fats - numbers)
      Return ONLY JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(jsonStr);

      res.json(data);
    } catch (err) {
      console.error("Recipe Gen Error:", err);
      res.status(500).json({ message: "Failed to generate recipes" });
    }
  });

  // === CHEAT MEALS ===
  app.get(api.cheatMeals.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const meals = await storage.getCheatMeals(userId);
    res.json(meals);
  });

  app.post(api.cheatMeals.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.cheatMeals.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      const meal = await storage.createCheatMeal({ ...input, userId });
      res.status(201).json(meal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.cheatMeals.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const id = parseInt(req.params.id);
    await storage.deleteCheatMeal(id, userId);
    res.status(204).send();
  });

  // AI CHEAT MEAL ALTERNATIVES
  app.post(api.cheatMeals.suggestAlternative.path, isAuthenticated, async (req: any, res) => {
    try {
      const { craving } = req.body;
      const prompt = `I am craving "${craving}". Suggest a healthier alternative that satisfies this craving but fits a fitness diet. 
      Return a JSON object with:
      - alternative (string, name of the dish)
      - calories (number, estimated)
      - protein (number)
      - carbs (number)
      - fats (number)
      - reason (string, why it's better)
      Return ONLY JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(jsonStr);

      res.json(data);
    } catch (err) {
      console.error("Alternative Suggestion Error:", err);
      res.status(500).json({ message: "Failed to suggest alternative" });
    }
  });

  // === SOCIAL CARD ===
  app.get(api.social.shareCard.path, isAuthenticated, async (req: any, res) => {
    try {
      // Generate a cool fitness mascot/background
      const prompt = "A cute 3D cartoon banana lifting weights, high quality, vibrant colors, pastel background, motivational poster style.";
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseModalities: [Modality.IMAGE] }
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);

      if (!imagePart?.inlineData?.data) {
        throw new Error("No image generated");
      }

      const imageUrl = `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`;
      res.json({ imageUrl });
    } catch (err) {
      console.error("Social Card Error:", err);
      res.status(500).json({ message: "Failed to generate social card" });
    }
  });

  return httpServer;
}
