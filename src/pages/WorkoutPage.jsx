import { useEffect, useState } from "react";
import { Check, ChevronDown, Dumbbell, Plus, Trash2 } from "../components/Icons.jsx";
import { splitOptions } from "../data/exercises.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getExerciseLibrary, getOrCreateTodayLog, saveDailyLog } from "../services/firestore.js";
import { formatNumber, getWorkoutVolume } from "../utils/format.js";

const newExercise = () => ({ exercise_name: "", sets: 3, reps: 10, weight: 0 });

export default function WorkoutPage() {
  const { user } = useAuth();
  const [log, setLog] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [library, setLibrary] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrCreateTodayLog(user.uid), getExerciseLibrary()])
      .then(([today, exerciseLibrary]) => {
        setLog(today);
        setLibrary(exerciseLibrary);
        setExercises(today.workouts?.length ? today.workouts : [newExercise()]);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [user.uid]);

  const activeSplit = log?.split_type || "Rest";
  const volume = getWorkoutVolume(exercises);
  const dateLabel = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  function updateExercise(index, field, value) {
    setExercises((current) => current.map((exercise, itemIndex) => itemIndex === index ? { ...exercise, [field]: value } : exercise));
  }

  function updateSplit(value) {
    setLog((current) => ({ ...current, split_type: value }));
    setNotice("");
  }

  async function handleSave(event) {
    event.preventDefault();
    const validExercises = exercises.filter((exercise) => exercise.exercise_name.trim());
    if (activeSplit !== "Rest" && validExercises.length === 0) {
      setError("Add at least one exercise before saving this workout.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const nextLog = { ...log, workouts: activeSplit === "Rest" ? [] : validExercises };
      await saveDailyLog(user.uid, nextLog);
      setLog(nextLog);
      setExercises(nextLog.workouts.length ? nextLog.workouts : [newExercise()]);
      setNotice("Workout saved. Nice work showing up.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack">
      {error && <div className="error-card" role="alert">{error}</div>}
      {notice && <div className="success-card" role="status"><Check size={16} />{notice}</div>}
      {loading && <div className="loading-card">Loading today's workout…</div>}
      {!loading && log && <>
      <div className="workout-topline"><span className="date-pill">{dateLabel}</span><span className="workout-unit">WEIGHT IN LBS</span></div>
      <form onSubmit={handleSave}>
        <section className="workout-split-card">
          <div className="split-card-copy"><span className="section-eyebrow">TODAY'S TRAINING</span><h2>What are we working on?</h2><p>Choose a split to get exercise suggestions tailored to your session.</p></div>
          <label className="split-select-wrap"><span>SPLIT</span><select value={activeSplit} onChange={(event) => updateSplit(event.target.value)}>{splitOptions.map((split) => <option key={split}>{split}</option>)}</select><ChevronDown className="select-chevron" size={16} /></label>
          <div className="split-side-icon"><Dumbbell size={25} strokeWidth={1.4} /></div>
        </section>
        {activeSplit === "Rest" ? (
          <section className="rest-day-card"><div className="rest-icon"><span>✳</span></div><span className="section-eyebrow">REST DAY</span><h2>Recovery is part of the plan.</h2><p>Take it easy today. Your next session will thank you.</p><button className="primary-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save rest day"} {!busy && <Check size={15} />}</button></section>
        ) : (
          <>
            <section className="exercise-section">
              <div className="exercise-section-heading"><div><span className="section-eyebrow">YOUR SESSION</span><h2>Exercises <span className="exercise-count">{exercises.filter((item) => item.exercise_name).length}</span></h2></div><div className="volume-total"><span>SESSION VOLUME</span><strong>{formatNumber(volume)} <small>lb</small></strong></div></div>
              <div className="exercise-header-row"><span>EXERCISE</span><span>SETS</span><span>REPS</span><span>WEIGHT · LB</span><span /></div>
              <div className="exercise-list">
                {exercises.map((exercise, index) => (
                  <div className="exercise-row" key={`exercise-${index}`}>
                    <div className="exercise-name-field">
                      <input list={`exercise-options-${index}`} value={exercise.exercise_name} onChange={(event) => updateExercise(index, "exercise_name", event.target.value)} placeholder="Search or enter an exercise" aria-label={`Exercise ${index + 1} name`} />
                      <datalist id={`exercise-options-${index}`}>
                        {library.filter((item) => item.split_category === activeSplit).map((item) => <option key={item.id} value={item.exercise_name} />)}
                      </datalist>
                    </div>
                    {["sets", "reps", "weight"].map((field) => <input key={field} type="number" min="0" step={field === "weight" ? "any" : "1"} inputMode="decimal" value={exercise[field]} onChange={(event) => updateExercise(index, field, Number(event.target.value))} aria-label={`${field} for ${exercise.exercise_name || `exercise ${index + 1}`}`} />)}
                    <button className="remove-exercise" type="button" aria-label={`Remove exercise ${index + 1}`} disabled={exercises.length === 1} onClick={() => setExercises((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              <button className="add-exercise" type="button" onClick={() => setExercises((current) => [...current, newExercise()])}><span><Plus size={15} /></span> Add another exercise</button>
            </section>
            <div className="workout-save-row"><span><Check size={14} /> Your progress saves to today's log</span><button className="primary-button" type="submit" disabled={busy}>{busy ? "Saving workout…" : "Save workout"} {!busy && <Check size={15} />}</button></div>
          </>
        )}
      </form>
      </>}
    </div>
  );
}
