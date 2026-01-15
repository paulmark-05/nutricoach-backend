import { z } from 'zod';
import { insertProfileSchema, insertMealSchema, insertRecipeSchema, insertCheatMealSchema, profiles, meals, recipes, cheatMeals } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  profile: {
    get: {
      method: 'GET' as const,
      path: '/api/profile',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'POST' as const, // Upsert
      path: '/api/profile',
      input: insertProfileSchema,
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  meals: {
    list: {
      method: 'GET' as const,
      path: '/api/meals',
      responses: {
        200: z.array(z.custom<typeof meals.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/meals',
      input: insertMealSchema,
      responses: {
        201: z.custom<typeof meals.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/meals/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    analyze: { // AI Analysis Endpoint
      method: 'POST' as const,
      path: '/api/meals/analyze',
      input: z.object({
        text: z.string().optional(),
        image: z.string().optional(), // Base64
      }),
      responses: {
        200: z.object({
          foodName: z.string(),
          calories: z.number(),
          protein: z.number(),
          carbs: z.number(),
          fats: z.number(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  recipes: {
    list: {
      method: 'GET' as const,
      path: '/api/recipes',
      responses: {
        200: z.array(z.custom<typeof recipes.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    generate: { // AI Generation
      method: 'POST' as const,
      path: '/api/recipes/generate',
      input: z.object({
        ingredients: z.array(z.string()),
        dietaryPreferences: z.string().optional(),
      }),
      responses: {
        200: z.array(z.object({
          title: z.string(),
          ingredients: z.array(z.string()),
          instructions: z.string(),
          macros: z.object({
            calories: z.number(),
            protein: z.number(),
            carbs: z.number(),
            fats: z.number(),
          })
        })),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    save: {
      method: 'POST' as const,
      path: '/api/recipes',
      input: insertRecipeSchema,
      responses: {
        201: z.custom<typeof recipes.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/recipes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  cheatMeals: {
    list: {
      method: 'GET' as const,
      path: '/api/cheat-meals',
      responses: {
        200: z.array(z.custom<typeof cheatMeals.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/cheat-meals',
      input: insertCheatMealSchema,
      responses: {
        201: z.custom<typeof cheatMeals.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    suggestAlternative: { // AI Suggestion
      method: 'POST' as const,
      path: '/api/cheat-meals/suggest',
      input: z.object({
        craving: z.string(),
      }),
      responses: {
        200: z.object({
          alternative: z.string(),
          calories: z.number(),
          protein: z.number(),
          carbs: z.number(),
          fats: z.number(),
          reason: z.string(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/cheat-meals/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  social: {
    shareCard: {
      method: 'GET' as const,
      path: '/api/social/share-card',
      responses: {
        200: z.object({
          imageUrl: z.string(), // Base64 or URL
        }),
        401: errorSchemas.unauthorized,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ProfileResponse = z.infer<typeof api.profile.get.responses[200]>;
export type MealResponse = z.infer<typeof api.meals.list.responses[200]>[0];
