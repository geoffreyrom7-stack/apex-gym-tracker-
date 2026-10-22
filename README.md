# APEX — Training, tracked.

A responsive workout and nutrition tracker built with React, Tailwind CSS, Firebase Authentication, Firestore, and Recharts. APEX pairs a black, blood-red, and white visual identity with a focused training journal.

## Run locally

1. Create a Firebase project and enable **Email/Password** and (optionally) **Google** sign-in in Authentication.
2. Create a Firestore database and publish the rules in `firestore.rules`.
3. Copy `.env.example` to `.env.local` and fill in the Firebase web app values.
   - Food search works immediately with APEX's built-in catalogue of common ingredients, Filipino dishes, and popular fast-food items. To add USDA FoodData Central results, get a free personal API key at <https://fdc.nal.usda.gov/api-key-signup.html>, set `VITE_USDA_API_KEY=your-key` in `.env.local`, and restart the dev server. Built-in restaurant macros are estimates; missing foods can be saved as custom foods.
4. Install dependencies and start the development server:

   ```sh
   npm install
   npm run dev
   ```

## Deploy to Vercel

Use the repository root as the project root, `npm run build` as the build command, and `dist` as the output directory. The root `vercel.json` rewrites app routes such as `/dashboard` to the Vite entry page so React Router can render the requested route on direct visits and refreshes. Redeploy after changing this configuration.

The app creates a user profile with starter macro goals when someone first signs up. Exercise suggestions use Firestore's `exercise_library` collection when populated and a built-in starter list otherwise. Daily logs use the document ID `YYYY-MM-DD_UID`. Food search matches the built-in catalogue offline and optionally adds USDA FoodData Central prepared, basic, and branded results when an API key is configured; selected foods are scaled from values per 100 g to the entered gram weight. Built-in fast-food macros are estimates, not official restaurant nutrition data. Custom foods keep user-entered per-100-g label data in the user profile for reuse. Nutrition records are estimates and recipe or brand differences can affect accuracy.

Workout logs can be backfilled by selecting a past date in the workout date picker. Existing workouts for the selected date are loaded from Firestore for review or editing; saving writes back to that date's `YYYY-MM-DD_UID` document.

On first sign-in, users complete a required adult body-metrics setup before accessing the dashboard. A BMI estimate and Mifflin–St Jeor calorie estimate use age, height, weight, equation coefficient, and activity level. Users can instead enter a custom daily calorie target and activity-energy estimate. The selected calorie target updates the profile's daily calorie goal; body metrics and estimates are available to edit later in Settings. These estimates are informational, not medical advice or an exercise prescription.

Use **Settings → Appearance → Theme** to switch manually between the Olympus dark and light palettes. The selection is saved in this browser and remains in effect after a reload.

## Firestore collections

- `users/{uid}` — email and `macro_goals` (calories, protein, carbs, fats).
- `exercise_library/{id}` — `split_category` and `exercise_name`.
- `daily_logs/{YYYY-MM-DD_UID}` — `user_id`, `date`, `split_type`, aggregate `macros_consumed`, `food_entries`, and a `workouts` array.
- `daily_logs/{YYYY-MM-DD_UID}.workout_sessions` — separate session entries stored inside the user's private daily log, including split, exercises, and total lifting volume. Older workout arrays are included in history as a compatibility fallback.

`firestore.rules` keeps profiles and daily logs private to their owner and allows signed-in users to read the shared exercise library. Workout history uses each user's daily-log document and requires no separate workout collection rule.
