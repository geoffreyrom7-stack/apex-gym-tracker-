import { useEffect, useMemo, useState } from "react";
import {
  Beef,
  Check,
  ChevronDown,
  Flame,
  Leaf,
  Plus,
  Search,
  Utensils,
} from "../components/Icons.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  addFoodEntryToToday,
  getOrCreateTodayLog,
  saveCustomFood,
} from "../services/firestore.js";
import { searchFoods } from "../services/foodSearch.js";
import { formatNumber } from "../utils/format.js";

const macroFields = [
  { key: "calories", label: "Calories", unit: "kcal", icon: Flame, color: "#c1121f" },
  { key: "protein", label: "Protein", unit: "g", icon: Beef, color: "#f2f2f2" },
  { key: "carbs", label: "Carbs", unit: "g", icon: Leaf, color: "#a6a6a6" },
  { key: "fats", label: "Fats", unit: "g", icon: Utensils, color: "#777777" },
];

const emptyCustomFood = () => ({
  name: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
});

function calculateMacros(food, grams) {
  if (!food || !Number.isFinite(grams) || grams <= 0) return null;
  const per100g = food.macrosPer100g;

  return {
    calories: Math.round((Number(per100g.calories) * grams) / 100),
    protein: Number(((Number(per100g.protein) * grams) / 100).toFixed(1)),
    carbs: Number(((Number(per100g.carbs) * grams) / 100).toFixed(1)),
    fats: Number(((Number(per100g.fats) * grams) / 100).toFixed(1)),
  };
}

export default function NutritionPage({ profile }) {
  const { user } = useAuth();
  const [log, setLog] = useState(null);
  const [query, setQuery] = useState("");
  const [grams, setGrams] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [results, setResults] = useState([]);
  const [customFoods, setCustomFoods] = useState(profile?.custom_foods || []);
  const [customFood, setCustomFood] = useState(emptyCustomFood);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getOrCreateTodayLog(user.uid)
      .then((today) => {
        if (active) setLog(today);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });
    return () => {
      active = false;
    };
  }, [user.uid]);

  useEffect(() => {
    setCustomFoods(profile?.custom_foods || []);
  }, [profile]);

  const estimatedMacros = useMemo(
    () => calculateMacros(selectedFood, Number(grams)),
    [selectedFood, grams],
  );

  async function handleSearch(event) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setError("Enter at least two letters to search foods.");
      return;
    }

    setSearching(true);
    setError("");
    setNotice("");
    setSelectedFood(null);
    setResults([]);

    try {
      const matchingCustomFoods = customFoods
        .filter((food) => food.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
        .map((food) => ({ ...food, category: "Saved custom food" }));
      const onlineFoods = await searchFoods(query);
      setResults([...matchingCustomFoods, ...onlineFoods]);
      if (matchingCustomFoods.length + onlineFoods.length === 0) {
        setNotice("No matches found. Add this dish as a custom food with nutrition per 100 g.");
      }
    } catch (searchError) {
      setResults(
        customFoods
          .filter((food) => food.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
          .map((food) => ({ ...food, category: "Saved custom food" })),
      );
      setError(searchError.message);
    } finally {
      setSearching(false);
    }
  }

  function selectFood(food) {
    setSelectedFood(food);
    setGrams("");
    setNotice("");
    setError("");
  }

  async function handleCreateCustomFood(event) {
    event.preventDefault();
    const name = customFood.name.trim();
    const macros = Object.fromEntries(
      macroFields.map(({ key }) => [key, Number(customFood[key])]),
    );

    if (!name || Object.values(macros).some((value) => !Number.isFinite(value) || value < 0)) {
      setError("Enter a food name and valid non-negative nutrition values per 100 g.");
      return;
    }
    if (!Object.values(macros).some((value) => value > 0)) {
      setError("At least one nutrition value must be greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const savedFoods = await saveCustomFood(user.uid, {
        name,
        macrosPer100g: macros,
      });
      const savedFood = savedFoods.find(
        (food) => food.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      );
      setCustomFoods(savedFoods);
      setSelectedFood(savedFood);
      setQuery(name);
      setResults([]);
      setGrams("");
      setCustomFood(emptyCustomFood());
      setShowCustomForm(false);
      setNotice("Food saved. Enter the portion weight to calculate its macros.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddFood(event) {
    event.preventDefault();
    const portionGrams = Number(grams);
    if (!selectedFood) {
      setError("Search for and select a food first.");
      return;
    }
    if (!Number.isFinite(portionGrams) || portionGrams <= 0) {
      setError("Enter a portion weight greater than 0 g.");
      return;
    }

    const macros = calculateMacros(selectedFood, portionGrams);
    const entry = {
      entry_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      food_name: selectedFood.name,
      food_source: selectedFood.source,
      fdc_id: selectedFood.fdcId || null,
      portion_grams: portionGrams,
      macros,
    };

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await addFoodEntryToToday(user.uid, entry);
      setLog((current) => {
        const currentMacros = current?.macros_consumed || {};
        return {
          ...current,
          food_entries: [...(current?.food_entries || []), entry],
          macros_consumed: Object.fromEntries(
            macroFields.map(({ key }) => [
              key,
              (Number(currentMacros[key]) || 0) + macros[key],
            ]),
          ),
        };
      });
      setSelectedFood(null);
      setGrams("");
      setQuery("");
      setResults([]);
      setNotice(`${selectedFood.name} (${formatGrams(portionGrams)} g) added to today's food log.`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  const consumed = log?.macros_consumed || {};
  const goals = profile?.macro_goals || {};
  const foodEntries = [...(log?.food_entries || [])].reverse();

  return (
    <div className="page-stack">
      {error && <div className="error-card" role="alert">{error}</div>}
      {notice && <div className="success-card" role="status"><Check size={16} />{notice}</div>}
      <section className="section-block">
        <div className="section-heading"><div><span className="section-eyebrow">TODAY'S TOTALS</span><h2>Where you stand</h2></div><span className="date-pill">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date())}</span></div>
        <div className="macro-grid nutrition-rings">
          {macroFields.map((field) => <ProgressRing key={field.key} {...field} value={consumed[field.key]} goal={goals[field.key]} />)}
        </div>
      </section>

      <div className="nutrition-layout">
        <section className="form-card">
          <div className="form-card-heading">
            <span className="form-card-icon"><Plus size={17} /></span>
            <div><h2>Log a food</h2><p>Find a Filipino dish, snack, or food, then enter its weight in grams.</p></div>
          </div>

          <form className="food-search-form" onSubmit={handleSearch}>
            <label className="field-label">FOOD NAME <span>SEARCH USDA DATABASE</span>
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setResults([]);
                  setSelectedFood(null);
                  setNotice("");
                }}
                placeholder="e.g. chicken adobo, sinigang, banana chips"
                maxLength={100}
              />
            </label>
            <button className="primary-button food-search-button" type="submit" disabled={searching || saving}>
              {searching ? "Searching foods…" : "Search foods"} {!searching && <Search size={15} />}
            </button>
          </form>

          <p className="food-data-note">Search USDA prepared foods, ingredients, and branded snacks. Values are estimates per 100 g; search runs when you press the button.</p>

          {results.length > 0 && (
            <div className="food-results" aria-label="Food search results">
              <div className="food-results-heading">SELECT A MATCH <span>{results.length} RESULTS</span></div>
              {results.map((food) => (
                <button
                  className="food-result"
                  type="button"
                  key={food.id}
                  onClick={() => selectFood(food)}
                >
                  <span className="food-result-copy">
                    <strong>{food.name}</strong>
                    <span>{food.category} · {food.source}</span>
                  </span>
                  <span className="food-result-calories">{formatNumber(food.macrosPer100g.calories)}<small> kcal / 100 g</small></span>
                  <ChevronDown className="food-result-chevron" size={15} />
                </button>
              ))}
            </div>
          )}

          {selectedFood && (
            <form className="selected-food-form" onSubmit={handleAddFood}>
              <div className="selected-food-heading">
                <div><span className="section-eyebrow">SELECTED FOOD</span><strong>{selectedFood.name}</strong><small>{selectedFood.source} · nutrition per 100 g</small></div>
                <button type="button" className="text-button" onClick={() => { setSelectedFood(null); setGrams(""); }}>Change</button>
              </div>
              <label className="field-label grams-field">PORTION WEIGHT <span>GRAMS</span>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="any"
                  inputMode="decimal"
                  value={grams}
                  onChange={(event) => setGrams(event.target.value)}
                  placeholder="e.g. 250"
                  autoFocus
                />
              </label>
              <div className="food-macro-preview" aria-live="polite">
                {macroFields.map((field) => (
                  <div key={field.key}><span>{field.label}</span><strong>{estimatedMacros ? formatMacro(estimatedMacros[field.key], field.key) : "—"}<small> {field.unit}</small></strong></div>
                ))}
              </div>
              <button className="primary-button wide-button" type="submit" disabled={saving || !estimatedMacros}>
                {saving ? "Adding food…" : "Add food to today's log"} {!saving && <Plus size={16} />}
              </button>
            </form>
          )}

          <div className="custom-food-divider"><span />NOT IN THE DATABASE?<span /></div>
          <button
            className="add-custom-food"
            type="button"
            onClick={() => { setShowCustomForm((visible) => !visible); setError(""); }}
          >
            <Plus size={15} /> Add a custom dish or snack
          </button>

          {showCustomForm && (
            <form className="custom-food-form" onSubmit={handleCreateCustomFood}>
              <div><strong>Save your own food</strong><span>Enter its label values per 100 g once. You can log future portions by grams.</span></div>
              <label className="field-label">FOOD NAME
                <input value={customFood.name} onChange={(event) => setCustomFood({ ...customFood, name: event.target.value })} placeholder="e.g. Homemade pork sisig" maxLength={100} required />
              </label>
              <div className="form-fields-grid">
                {macroFields.map((field) => (
                  <label className="field-label" key={field.key}>{field.label.toUpperCase()} <span>PER 100 G · {field.unit.toUpperCase()}</span>
                    <input type="number" min="0" step="any" inputMode="decimal" value={customFood[field.key]} onChange={(event) => setCustomFood({ ...customFood, [field.key]: event.target.value })} placeholder="0" required />
                  </label>
                ))}
              </div>
              <button className="primary-button wide-button" type="submit" disabled={saving}>
                {saving ? "Saving food…" : "Save food and select"} {!saving && <Check size={15} />}
              </button>
            </form>
          )}
        </section>

        <aside className="nutrition-side-card">
          <div className="nutrition-side-art"><div className="meal-orbit"><div className="meal-core"><Utensils size={25} /></div><i /><i /><i /></div></div>
          <span className="section-eyebrow">KEEP IT SIMPLE</span>
          <h3>Consistency<br />over perfection.</h3>
          <p>Search prepared foods, Filipino dishes, ingredients, and snacks. Recipes vary, so values are estimates. Use package labels or a saved custom food for a closer match.</p>
          <div className="nutrition-side-stat"><span>TODAY'S CALORIES</span><strong>{formatNumber(consumed.calories)} <small>/ {formatNumber(goals.calories)} kcal</small></strong></div>
        </aside>
      </div>

      <section className="food-log-section">
        <div className="section-heading"><div><span className="section-eyebrow">TODAY'S FOOD</span><h2>Logged meals <span className="exercise-count">{foodEntries.length}</span></h2></div></div>
        {foodEntries.length === 0 ? (
          <div className="empty-food-log">Foods you add today will appear here.</div>
        ) : (
          <div className="food-entry-list">
            {foodEntries.map((entry) => (
              <article className="food-entry" key={entry.entry_id}>
                <div className="food-entry-main"><strong>{entry.food_name}</strong><span>{formatGrams(entry.portion_grams)} g · {entry.food_source}</span></div>
                <div className="food-entry-macros">
                  <span>{formatNumber(entry.macros.calories)} kcal</span>
                  <span>P {formatMacro(entry.macros.protein, "protein")} g</span>
                  <span>C {formatMacro(entry.macros.carbs, "carbs")} g</span>
                  <span>F {formatMacro(entry.macros.fats, "fats")} g</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function formatMacro(value, key) {
  return key === "calories" ? formatNumber(value) : Number(value || 0).toFixed(1);
}

function formatGrams(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(Number(value) || 0);
}
