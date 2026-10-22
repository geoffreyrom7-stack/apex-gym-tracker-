import { useMemo, useState } from "react";
import { Activity, Check, Flame, Target, X } from "./Icons.jsx";
import { activityLevels, calculateBodyMetrics } from "../utils/bodyMetrics.js";
import { formatNumber } from "../utils/format.js";

function initialForm(metrics) {
  return {
    age: metrics?.age ?? "",
    heightCm: metrics?.height_cm ?? "",
    weightKg: metrics?.weight_kg ?? "",
    formulaSex: metrics?.formula_sex ?? "female",
    activityLevel: metrics?.activity_level ?? "moderate",
    goal: metrics?.goal === "lose" || metrics?.goal === "gain" ? metrics.goal : "maintain",
    calorieMethod: metrics?.calorie_method ?? "estimate",
    customCalories: metrics?.calorie_target ?? "",
    customActivityCalories: metrics?.activity_calories ?? "",
  };
}

export default function BodyMetricsModal({
  metrics,
  required = false,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => initialForm(metrics));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const estimate = useMemo(() => {
    try {
      return calculateBodyMetrics(form);
    } catch {
      return null;
    }
  }, [form]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const nextMetrics = calculateBodyMetrics(form);
      await onSave(nextMetrics);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="body-modal-backdrop">
      <section
        className="body-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="body-modal-title"
      >
        <div className="body-modal-heading">
          <span className="body-modal-icon"><Activity size={19} /></span>
          {!required && (
            <button className="body-modal-close" type="button" onClick={onClose} aria-label="Close calculator">
              <X size={18} />
            </button>
          )}
          <span className="section-eyebrow">{required ? "APEX / PERSONAL BASELINE" : "CUSTOMIZE YOUR BASELINE"}</span>
          <h2 id="body-modal-title">{required ? "Set your starting point." : "Body & energy estimates"}</h2>
          <p>{required ? "Add a few details to calculate an estimated BMI and daily calorie target before you enter APEX." : "Update your body measurements and calorie estimate whenever you need."}</p>
        </div>

        {error && <div className="error-card" role="alert">{error}</div>}

        <form className="body-metrics-form" onSubmit={handleSubmit}>
          <div className="body-input-grid">
            <label className="field-label">AGE <span>YEARS · 18+</span>
              <input type="number" min="18" max="100" step="1" value={form.age} onChange={(event) => update("age", event.target.value)} placeholder="e.g. 28" required />
            </label>
            <label className="field-label">HEIGHT <span>CM</span>
              <input type="number" min="100" max="250" step="any" value={form.heightCm} onChange={(event) => update("heightCm", event.target.value)} placeholder="e.g. 170" required />
            </label>
            <label className="field-label">BODY WEIGHT <span>KG</span>
              <input type="number" min="30" max="350" step="any" value={form.weightKg} onChange={(event) => update("weightKg", event.target.value)} placeholder="e.g. 70" required />
            </label>
          </div>

          <div className="body-form-divider"><span />ENERGY ESTIMATE<span /></div>

          <div className="body-mode-switch" role="group" aria-label="Calorie target method">
            <button type="button" className={form.calorieMethod === "estimate" ? "active" : ""} aria-pressed={form.calorieMethod === "estimate"} onClick={() => update("calorieMethod", "estimate")}>Estimate for me</button>
            <button type="button" className={form.calorieMethod === "custom" ? "active" : ""} aria-pressed={form.calorieMethod === "custom"} onClick={() => update("calorieMethod", "custom")}>Enter my own</button>
          </div>

          {form.calorieMethod === "estimate" ? (
            <>
              <label className="field-label">MIFFLIN-ST JEOR EQUATION SETTING <span>USED FOR ESTIMATE</span>
                <select value={form.formulaSex} onChange={(event) => update("formulaSex", event.target.value)} required>
                  <option value="female">Female coefficient</option>
                  <option value="male">Male coefficient</option>
                </select>
              </label>
              <label className="field-label">ACTIVITY LEVEL <span>AVERAGE WEEK</span>
                <select value={form.activityLevel} onChange={(event) => update("activityLevel", event.target.value)} required>
                  {activityLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
                </select>
              </label>
              <label className="field-label">TRAINING GOAL <span>ADJUSTS INTAKE TARGET</span>
                <select value={form.goal} onChange={(event) => update("goal", event.target.value)}>
                  <option value="maintain">Maintain current weight</option>
                  <option value="lose">Gradual weight loss estimate</option>
                  <option value="gain">Gradual weight gain estimate</option>
                </select>
              </label>
            </>
          ) : (
            <div className="body-input-grid">
              <label className="field-label">DAILY CALORIE TARGET <span>KCAL</span>
                <input type="number" min="500" max="10000" step="1" value={form.customCalories} onChange={(event) => update("customCalories", event.target.value)} placeholder="e.g. 2100" required />
              </label>
              <label className="field-label">ACTIVITY ENERGY ESTIMATE <span>OPTIONAL · KCAL / DAY</span>
                <input type="number" min="0" max="5000" step="1" value={form.customActivityCalories} onChange={(event) => update("customActivityCalories", event.target.value)} placeholder="Optional estimate" />
              </label>
            </div>
          )}

          {estimate && (
            <div className="body-estimate-card" aria-live="polite">
              <div className="body-estimate-bmi">
                <span><Target size={14} /> BMI ESTIMATE</span>
                <strong>{estimate.bmi}</strong>
                <small>{estimate.bmi_category}</small>
              </div>
              <div className="body-estimate-calories">
                <div><span><Flame size={14} /> DAILY INTAKE TARGET</span><strong>{formatNumber(estimate.calorie_target)} <small>kcal</small></strong></div>
                <div><span><Activity size={14} /> ACTIVITY ENERGY / DAY</span><strong>{formatNumber(estimate.activity_calories)} <small>kcal</small></strong></div>
              </div>
              <p>Estimates only. Activity energy is an estimate of daily movement above resting needs, not a required workout-burn target. BMI is a screening measure, not a diagnosis.</p>
            </div>
          )}

          <button className="primary-button wide-button body-save-button" type="submit" disabled={busy}>
            {busy ? "Saving your baseline…" : required ? "Save baseline & enter APEX" : "Save my estimates"}
            {!busy && <Check size={15} />}
          </button>
        </form>
      </section>
    </div>
  );
}
