const FDC_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const API_KEY = import.meta.env.VITE_USDA_API_KEY || "DEMO_KEY";
const requestedNutrients = new Set([1003, 1004, 1005, 1008]);

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

export async function searchFoods(query, { signal } = {}) {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) return [];

  const parameters = new URLSearchParams({
    query: trimmedQuery,
    pageSize: "15",
    dataType: "Survey (FNDDS),Foundation,SR Legacy,Branded",
    api_key: API_KEY,
  });
  const response = await fetch(`${FDC_API_URL}?${parameters}`, { signal });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Food search is temporarily rate-limited. Wait a moment and try again.");
    }
    if (response.status === 403) {
      throw new Error("Food search API key was rejected or its limit was reached. Add a free USDA key in .env.local.");
    }
    throw new Error(`Food search failed (${response.status}). Please try again.`);
  }

  const result = await response.json();
  return (result.foods || [])
    .filter((food) => food.description && food.foodNutrients?.length)
    .map((food) => ({
      id: `fdc-${food.fdcId}`,
      source: "FoodData Central",
      name: food.description,
      category: food.foodCategory || food.dataType || "USDA food",
      fdcId: food.fdcId,
      macrosPer100g: getNutritionPer100g(food),
    }));
}
