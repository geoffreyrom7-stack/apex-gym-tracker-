export const activityLevels = [
  { value: "sedentary", label: "Mostly sitting", multiplier: 1.2 },
  { value: "light", label: "Light activity · 1–3 days/week", multiplier: 1.375 },
  { value: "moderate", label: "Moderate activity · 3–5 days/week", multiplier: 1.55 },
  { value: "active", label: "Very active · 6–7 days/week", multiplier: 1.725 },
  { value: "very_active", label: "Intense activity or physical job", multiplier: 1.9 },
];

export function calculateBodyMetrics({
  age,
  heightCm,
  weightKg,
  formulaSex,
  activityLevel,
  goal,
  calorieMethod,
  customCalories,
  customActivityCalories,
}) {
  const ageYears = Number(age);
  const height = Number(heightCm);
  const weight = Number(weightKg);

  if (!Number.isFinite(ageYears) || ageYears < 18 || ageYears > 100) {
    throw new Error("Enter an age from 18 to 100 for this adult estimate.");
  }
  if (!Number.isFinite(height) || height < 100 || height > 250) {
    throw new Error("Enter a height from 100 to 250 cm.");
  }
  if (!Number.isFinite(weight) || weight < 30 || weight > 350) {
    throw new Error("Enter a body weight from 30 to 350 kg.");
  }

  const bmi = weight / ((height / 100) ** 2);
  const bmiCategory =
    bmi < 18.5 ? "Below standard range" :
      bmi < 25 ? "Standard range" :
        bmi < 30 ? "Above standard range" :
          "High range";

  let bmr = null;
  let maintenanceCalories = null;
  let calorieTarget;
  let activityCalories;

  if (calorieMethod === "custom") {
    calorieTarget = Number(customCalories);
    activityCalories = customActivityCalories === "" || customActivityCalories == null
      ? null
      : Number(customActivityCalories);
    if (!Number.isFinite(calorieTarget) || calorieTarget < 500 || calorieTarget > 10000) {
      throw new Error("Enter a custom daily calorie target between 500 and 10,000 kcal.");
    }
    if (activityCalories != null && (!Number.isFinite(activityCalories) || activityCalories < 0 || activityCalories > 5000)) {
      throw new Error("Enter estimated daily activity calories from 0 to 5,000 kcal.");
    }
  } else {
    const activity = activityLevels.find((level) => level.value === activityLevel);
    if (!activity) throw new Error("Choose an activity level.");
    if (!["male", "female"].includes(formulaSex)) {
      throw new Error("Choose a calculation setting for the energy estimate.");
    }

    bmr = 10 * weight + 6.25 * height - 5 * ageYears +
      (formulaSex === "male" ? 5 : -161);
    maintenanceCalories = Math.round(bmr * activity.multiplier);
    const goalAdjustment = goal === "lose" ? -350 : goal === "gain" ? 250 : 0;
    calorieTarget = Math.round(maintenanceCalories + goalAdjustment);
    activityCalories = Math.max(0, Math.round(maintenanceCalories - bmr));
  }

  return {
    age: ageYears,
    height_cm: height,
    weight_kg: weight,
    formula_sex: calorieMethod === "custom" ? null : formulaSex,
    activity_level: calorieMethod === "custom" ? null : activityLevel,
    goal: calorieMethod === "custom" ? "custom" : goal,
    calorie_method: calorieMethod,
    bmi: Number(bmi.toFixed(1)),
    bmi_category: bmiCategory,
    bmr_calories: bmr == null ? null : Math.round(bmr),
    tdee_calories: maintenanceCalories,
    activity_calories: activityCalories == null ? null : Math.round(activityCalories),
    calorie_target: Math.round(calorieTarget),
  };
}
