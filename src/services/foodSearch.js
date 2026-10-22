import { foodCatalog } from "../data/foodCatalog.js";

const FDC_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const API_KEY = (import.meta.env?.VITE_USDA_API_KEY || "").trim();
const requestedNutrients = new Set([1003, 1004, 1005, 1008]);

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function searchCatalog(query) {
  const normalizedQuery = normalize(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

  return foodCatalog
    .map((food) => {
      const searchable = normalize([food.name, food.category, ...food.aliases].join(" "));
      const score = searchable === normalizedQuery
        ? 3
        : normalize(food.name).startsWith(normalizedQuery)
          ? 2
          : queryWords.every((word) => searchable.includes(word))
            ? 1
            : 0;
      return { food, score };
    })
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score || first.food.name.localeCompare(second.food.name))
    .slice(0, 20)
    .map(({ food }) => food);
}

function getNutritionPer100g(food) {
  const nutrients = Object.fromEntries(
    (food.foodNutrients || [])
      .filter((nutrient) => requestedNutrients.has(nutrient.nutrientId))
      .map((nutrient) => [nutrient.nutrientId, Number(nutrient.value) || 0]),
  );

  const protein = nutrients[1003] || 0;
  const fats = nutrients[1004] || 0;
  const carbs = nutrients[1005] || 0;
  const calories = nutrients[1008] || (protein * 4 + carbs * 4 + fats * 9);

  return { calories, protein, carbs, fats };
}

async function searchFoodDataCentral(query, signal) {
  const parameters = new URLSearchParams();
  parameters.set("query", query);
  parameters.set("pageSize", "25");
  parameters.set("api_key", API_KEY);
  for (const dataType of ["Branded", "Survey (FNDDS)", "Foundation", "SR Legacy"]) {
    parameters.append("dataType", dataType);
  }

  const response = await fetch(`${FDC_API_URL}?${parameters}`, { signal });
  if (!response.ok) {
    if (response.status === 429) throw new Error("USDA search is rate-limited right now.");
    if (response.status === 403) throw new Error("The USDA API key was rejected or its limit was reached.");
    throw new Error(`USDA search failed (${response.status}).`);
  }

  const result = await response.json();
  return (result.foods || [])
    .filter((food) => food.description && food.foodNutrients?.length)
    .map((food) => ({
      id: `fdc-${food.fdcId}`,
      source: "USDA FoodData Central",
      name: food.description,
      category: food.foodCategory || food.dataType || "USDA food",
      fdcId: food.fdcId,
      macrosPer100g: getNutritionPer100g(food),
    }));
}

export async function searchFoods(query, { signal } = {}) {
  const trimmedQuery = query.trim();
  if (normalize(trimmedQuery).length < 2) return { foods: [], warning: "" };

  const localFoods = searchCatalog(trimmedQuery);
  if (!API_KEY) {
    return {
      foods: localFoods,
      warning: localFoods.length
        ? "Showing built-in estimates. Add a personal USDA key to search its full catalogue."
        : "No built-in match found. Add a personal USDA key for online search, or add this as a custom food.",
    };
  }

  try {
    const onlineFoods = await searchFoodDataCentral(trimmedQuery, signal);
    const existingNames = new Set(localFoods.map((food) => normalize(food.name)));
    const uniqueOnlineFoods = onlineFoods.filter((food) => !existingNames.has(normalize(food.name)));
    return { foods: [...localFoods, ...uniqueOnlineFoods], warning: "" };
  } catch (error) {
    if (error.name === "AbortError") throw error;
    return {
      foods: localFoods,
      warning: localFoods.length
        ? `${error.message} Showing built-in estimates instead.`
        : `${error.message} No built-in match was found; add this item as a custom food.`,
    };
  }
}
