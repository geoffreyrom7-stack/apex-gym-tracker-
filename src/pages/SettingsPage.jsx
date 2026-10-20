import { useEffect, useState } from "react";
import { Check, LogOut, Target } from "../components/Icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { updateMacroGoals } from "../services/firestore.js";

const fields = [
  { key: "calories", label: "Daily calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbohydrates", unit: "g" },
  { key: "fats", label: "Fats", unit: "g" },
];

export default function SettingsPage({ profile, onProfileUpdate }) {
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
      <section className="account-card"><div className="account-detail"><div className="avatar">{user?.email?.[0]?.toUpperCase() || "A"}</div><div><span className="section-eyebrow">SIGNED IN AS</span><strong>{user?.email}</strong></div></div><button className="signout-button" type="button" onClick={signOutUser}>Sign out <LogOut size={15} /></button></section>
    </div>
  );
}
