import { useEffect, useState } from "react";
import { Check, LogOut, Moon, Sun, Target } from "../components/Icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { updateMacroGoals } from "../services/firestore.js";

const fields = [
  { key: "calories", label: "Daily calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbohydrates", unit: "g" },
  { key: "fats", label: "Fats", unit: "g" },
];

export default function SettingsPage({ profile, theme, onThemeChange, onProfileUpdate, onEditBodyMetrics }) {
  const { user, signOutUser } = useAuth();
  const [goals, setGoals] = useState(profile?.macro_goals || {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => setGoals(profile?.macro_goals || {}), [profile]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (Object.values(goals).some((value) => !Number.isFinite(Number(value)) || Number(value) <= 0)) {
      setError("All targets must be numbers greater than zero.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const normalizedGoals = Object.fromEntries(fields.map(({ key }) => [key, Number(goals[key])]));
    try {
      await updateMacroGoals(user.uid, normalizedGoals);
      await onProfileUpdate();
      setNotice("Your daily targets have been updated.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack settings-stack">
      {error && <div className="error-card" role="alert">{error}</div>}
      {notice && <div className="success-card" role="status"><Check size={16} />{notice}</div>}
      <section className="settings-card">
        <div className="settings-card-heading"><span className="settings-icon"><Target size={18} /></span><div><span className="section-eyebrow">MAKE IT YOURS</span><h2>Daily macro goals</h2><p>Set the targets that work for you. You can change these any time.</p></div></div>
        <form onSubmit={handleSubmit}>
          <div className="settings-fields">
            {fields.map((field) => <label className="field-label" key={field.key}>{field.label.toUpperCase()} <span>{field.unit.toUpperCase()}</span><input type="number" min="1" step="any" inputMode="decimal" value={goals[field.key] ?? ""} onChange={(event) => setGoals({ ...goals, [field.key]: event.target.value })} required /></label>)}
          </div>
          <div className="settings-actions"><span>Changes apply to today's dashboard.</span><button className="primary-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save targets"} {!busy && <Check size={15} />}</button></div>
        </form>
      </section>
      <section className="settings-card appearance-settings-card">
        <div className="settings-card-heading">
          <span className="settings-icon"><Sun size={18} /></span>
          <div><span className="section-eyebrow">APPEARANCE</span><h2>Theme</h2><p>Choose the look that suits your training space.</p></div>
        </div>
        <div className="theme-control" role="group" aria-label="Choose color theme">
          <button
            className={`theme-option ${theme === "light" ? "active" : ""}`}
            type="button"
            aria-pressed={theme === "light"}
            onClick={() => onThemeChange("light")}
          >
            <Sun size={17} /><span>Light</span>
          </button>
          <button
            className={`theme-option ${theme === "dark" ? "active" : ""}`}
            type="button"
            aria-pressed={theme === "dark"}
            onClick={() => onThemeChange("dark")}
          >
            <Moon size={17} /><span>Dark</span>
          </button>
        </div>
      </section>
      <section className="settings-card body-settings-card">
        <div className="settings-card-heading"><span className="settings-icon"><Target size={18} /></span><div><span className="section-eyebrow">PERSONAL BASELINE</span><h2>BMI & energy estimates</h2><p>Your height, weight, activity and calorie target used by APEX.</p></div></div>
        <div className="body-settings-summary">
          <div><span>BMI</span><strong>{profile.body_metrics?.bmi ?? "—"}</strong><small>{profile.body_metrics?.bmi_category || "No estimate"}</small></div>
          <div><span>DAILY CALORIE TARGET</span><strong>{Number(profile.body_metrics?.calorie_target || profile.macro_goals?.calories || 0).toLocaleString()} <small>kcal</small></strong></div>
          <div><span>ACTIVITY ENERGY / DAY</span><strong>{profile.body_metrics?.activity_calories == null ? "—" : Number(profile.body_metrics.activity_calories).toLocaleString()} <small>kcal</small></strong></div>
        </div>
        <div className="settings-actions"><span>Estimates are customizable and can be recalculated any time.</span><button className="primary-button" type="button" onClick={onEditBodyMetrics}>Edit body & calorie settings <Target size={15} /></button></div>
      </section>
      <section className="account-card"><div className="account-detail"><div className="avatar">{user?.email?.[0]?.toUpperCase() || "A"}</div><div><span className="section-eyebrow">SIGNED IN AS</span><strong>{user?.email}</strong></div></div><button className="signout-button" type="button" onClick={signOutUser}>Sign out <LogOut size={15} /></button></section>
    </div>
  );
}
