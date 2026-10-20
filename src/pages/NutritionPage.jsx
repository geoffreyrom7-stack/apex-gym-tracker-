import { useEffect, useState } from "react";
import { Beef, Check, Flame, Leaf, Plus, Utensils } from "../components/Icons.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { addMacrosToToday, getOrCreateTodayLog } from "../services/firestore.js";
import { formatNumber } from "../utils/format.js";

const macroFields = [
  { key: "calories", label: "Calories", unit: "kcal", icon: Flame, color: "#c1121f" },
  { key: "protein", label: "Protein", unit: "g", icon: Beef, color: "#f2f2f2" },
  { key: "carbs", label: "Carbs", unit: "g", icon: Leaf, color: "#a6a6a6" },
  { key: "fats", label: "Fats", unit: "g", icon: Utensils, color: "#777777" },
];

export default function NutritionPage({ profile }) {
  const { user } = useAuth();
  const [log, setLog] = useState(null);
  const [values, setValues] = useState({ calories: "", protein: "", carbs: "", fats: "" });
  const [foodName, setFoodName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getOrCreateTodayLog(user.uid).then(setLog).catch((loadError) => setError(loadError.message));
  }, [user.uid]);

  async function handleSubmit(event) {
    event.preventDefault();
    const additions = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value) || 0]));
    if (!Object.values(additions).some((value) => value > 0)) {
      setError("Enter at least one nutrition amount to add.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await addMacrosToToday(user.uid, additions);
      setLog((current) => ({
        ...current,
        macros_consumed: Object.fromEntries(
          Object.keys(additions).map((key) => [key, (Number(current?.macros_consumed?.[key]) || 0) + additions[key]]),
        ),
      }));
      setValues({ calories: "", protein: "", carbs: "", fats: "" });
      setNotice(`${foodName.trim() ? `${foodName.trim()} added` : "Nutrition added"} to today's totals.`);
      setFoodName("");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  const consumed = log?.macros_consumed || {};
  const goals = profile?.macro_goals || {};

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
          <div className="form-card-heading"><span className="form-card-icon"><Plus size={17} /></span><div><h2>Add to your day</h2><p>Enter the nutrition from your meal or snack.</p></div></div>
          <form onSubmit={handleSubmit}>
            <label className="field-label">FOOD / MEAL NAME <span>OPTIONAL</span>
              <input value={foodName} onChange={(event) => setFoodName(event.target.value)} placeholder="e.g. Post-workout lunch" maxLength={80} />
            </label>
            <div className="form-fields-grid">
              {macroFields.map((field) => (
                <label className="field-label" key={field.key}>{field.label.toUpperCase()} <span>{field.unit.toUpperCase()}</span>
                  <input type="number" min="0" step="any" inputMode="decimal" value={values[field.key]} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} placeholder="0" />
                </label>
              ))}
            </div>
            <button className="primary-button wide-button" type="submit" disabled={busy}>{busy ? "Adding nutrition…" : "Add to today's totals"} {!busy && <Plus size={16} />}</button>
          </form>
        </section>
        <aside className="nutrition-side-card">
          <div className="nutrition-side-art"><div className="meal-orbit"><div className="meal-core"><Utensils size={25} /></div><i /><i /><i /></div></div>
          <span className="section-eyebrow">KEEP IT SIMPLE</span>
          <h3>Consistency<br />over perfection.</h3>
          <p>You don't need every number to be exact. Regular check-ins help you spot patterns and make better choices over time.</p>
          <div className="nutrition-side-stat"><span>TODAY'S CALORIES</span><strong>{formatNumber(consumed.calories)} <small>/ {formatNumber(goals.calories)} kcal</small></strong></div>
        </aside>
      </div>
    </div>
  );
}
