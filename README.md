# APEX — Training, tracked.

A responsive workout and nutrition tracker built with React, Tailwind CSS, Firebase Authentication, Firestore, and Recharts. APEX pairs a black, blood-red, and white visual identity with a focused training journal.

## Run locally

1. Create a Firebase project and enable **Email/Password** and (optionally) **Google** sign-in in Authentication.
2. Create a Firestore database and publish the rules in `firestore.rules`.
3. Copy `.env.example` to `.env.local` and fill in the Firebase web app values.
   - Food search uses USDA FoodData Central. The `DEMO_KEY` works for testing with a low request limit; get a free personal key at <https://fdc.nal.usda.gov/api-key-signup.html> and set `VITE_USDA_API_KEY` in `.env.local` for regular use.
4. Install dependencies and start the development server:

   ```sh
   npm install
   npm run dev
   ```

The app creates a user profile with starter macro goals when someone first signs up. Exercise suggestions use Firestore's `exercise_library` collection when populated and a built-in starter list otherwise. Daily logs use the document ID `YYYY-MM-DD_UID`. Food search queries USDA FoodData Central on submit, including prepared, basic, and branded foods; selected foods are scaled from values per 100 g to the entered gram weight. Custom foods keep user-entered per-100-g label data in the user profile for reuse. Nutrition records are estimates and recipe or brand differences can affect accuracy.

Workout logs can be backfilled by selecting a past date in the workout date picker. Existing workouts for the selected date are loaded from Firestore for review or editing; saving writes back to that date's `YYYY-MM-DD_UID` document.

## Firestore collections

- `users/{uid}` — email and `macro_goals` (calories, protein, carbs, fats).
- `exercise_library/{id}` — `split_category` and `exercise_name`.
- `daily_logs/{YYYY-MM-DD_UID}` — `user_id`, `date`, `split_type`, aggregate `macros_consumed`, `food_entries`, and a `workouts` array.

`firestore.rules` keeps profiles and logs private to their owner and allows signed-in users to read the shared exercise library.
