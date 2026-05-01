import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini
// AI Studio automatically injects process.env.GEMINI_API_KEY
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const models = {
  text: "gemini-3-flash-preview",
  pro: "gemini-3.1-pro-preview",
};

/**
 * AI Recipe Generator
 */
export async function generateRecipe(ingredients: string[]) {
  const response = await genAI.models.generateContent({
    model: models.text,
    contents: `Generate a creative recipe using these ingredients: ${ingredients.join(", ")}. Return the response in strict JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recipe_name: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          cooking_time: { type: Type.STRING },
          estimated_cost_in_inr: { type: Type.STRING },
          difficulty: { type: Type.STRING }
        },
        required: ["recipe_name", "ingredients", "steps", "cooking_time", "estimated_cost_in_inr", "difficulty"]
      }
    }
  });

  return JSON.parse(response.text);
}

/**
 * Smart Search (NLP -> Filters)
 */
export async function parseSmartSearch(query: string) {
  const response = await genAI.models.generateContent({
    model: models.text,
    contents: `Parse this cooking-related search query into filters: "${query}". Return the response in strict JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          max_price: { type: Type.STRING },
          meal_type: { type: Type.STRING },
          diet: { type: Type.STRING },
          max_cooking_time: { type: Type.STRING },
          keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["max_price", "meal_type", "diet", "max_cooking_time", "keywords"]
      }
    }
  });

  return JSON.parse(response.text);
}

/**
 * Recipe Description & Tags Generator
 */
export async function generateRecipeMeta(recipeName: string, ingredients: string[]) {
  const response = await genAI.models.generateContent({
    model: models.text,
    contents: `Create a catchy description and relevant tags for a recipe named "${recipeName}" with ingredients: ${ingredients.join(", ")}. Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["description", "tags"]
      }
    }
  });

  return JSON.parse(response.text);
}

/**
 * Recommendation System
 */
export async function getRecommendations(userHistory: any[]) {
  const response = await genAI.models.generateContent({
    model: models.text,
    contents: `Based on the user's recipe history: ${JSON.stringify(userHistory)}, suggest 3 types of recipes they might like. Return a JSON list of names.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommended_recipes: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["recommended_recipes"]
      }
    }
  });

  return JSON.parse(response.text);
}
