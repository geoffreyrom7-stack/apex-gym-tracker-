import { useEffect, useState } from "react";
import { Check, ChevronDown, Dumbbell, Plus, Trash2 } from "../components/Icons.jsx";
import { splitOptions } from "../data/exercises.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getExerciseLibrary, getOrCreateLogForDate, saveDailyLog } from "../services/firestore.js";
import { formatNumber, getWorkoutVolume } from "../utils/format.js";
import { getLocalDateString, isValidLogDate } from "../utils/date.js";

const newExercise = () => ({ exercise_name: "", sets: 3, reps: 10, weight: 0 });
const POUNDS_PER_KILOGRAM = 2.2046226218;

function getInitialWorkoutDate(uid) {
  const today = getLocalDateString();
  const savedDate = window.localStorage.getItem(`apex-workout-date-${uid}`);
  return savedDate && isValidLogDate(savedDate) && savedDate <= today
    ? savedDate
    : today;
}

function toDisplayWeight(pounds, unit) {
  if (pounds === "" || pounds == null) return "";
  const value = Number(pounds);
  if (!Number.isFinite(value)) return "";
  return unit === "kg"
    ? String(Number((value / POUNDS_PER_KILOGRAM).toFixed(2)))
    : String(Number(value.toFixed(2)));
}

export default function WorkoutPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => getInitialWorkoutDate(user.uid));
  const [log, setLog] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [library, setLibrary] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weightUnit, setWeightUnit] = useState("lb");
  const [hasSavedWorkout, setHasSavedWorkout] = useState(false);

  useEffect(() => {
    let active = true;
    getExerciseLibrary()
      .then((exerciseLibrary) => {
        if (active) setLibrary(exerciseLibrary);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setNotice("");
    setLog(null);
    setExercises([]);
    setHasSavedWorkout(false);

    getOrCreateLogForDate(user.uid, selectedDate)
      .then((dailyLog) => {
        if (!active) return;
        setLog(dailyLog);
        setExercises(dailyLog.workouts?.length ? dailyLog.workouts : [newExercise()]);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user.uid, selectedDate]);

  useEffect(() => {
    window.localStorage.setItem(`apex-workout-date-${user.uid}`, selectedDate);
  }, [user.uid, selectedDate]);

  const activeSplit = log?.split_type || "Rest";
  const volume = hasSavedWorkout
    ? getWorkoutVolume(log?.workouts) + getWorkoutVolume(exercises)
    : getWorkoutVolume(exercises);
  const selectedDateLabel = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${selectedDate}T12:00:00`));
  const isToday = selectedDate === getLocalDateString();

  function updateExercise(index, field, value) {
    setExercises((current) => current.map((exercise, itemIndex) => itemIndex === index ? { ...exercise, [field]: value } : exercise));
  }

  function updateWeight(index, enteredValue) {
    const pounds = enteredValue === ""
      ? ""
      : Number(enteredValue) * (weightUnit === "kg" ? POUNDS_PER_KILOGRAM : 1);
    updateExercise(index, "weight", pounds);
  }

  function updateSplit(value) {
    setLog((current) => ({ ...current, split_type: value }));
    setNotice("");
  }

  function startAnotherWorkout() {
    setExercises([newExercise()]);
    setHasSavedWorkout(true);
    setNotice("");
    setError("");
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
      const savedExercises = validExercises.map((exercise) => ({
        ...exercise,
        sets: Number(exercise.sets) || 0,
        reps: Number(exercise.reps) || 0,
        weight: Number(exercise.weight) || 0,
      }));
      const workouts = hasSavedWorkout
        ? [...(log.workouts || []), ...savedExercises]
        : savedExercises;
      const nextLog = {
        ...log,
        workouts: activeSplit === "Rest" ? [] : workouts,
      };
      await saveDailyLog(user.uid, selectedDate, nextLog);
      setLog(nextLog);
      setExercises([newExercise()]);
      setHasSavedWorkout(activeSplit !== "Rest");
      setNotice(
        activeSplit === "Rest"
          ? `Rest day saved for ${selectedDateLabel}.`
          : `Workout saved for ${selectedDateLabel}. Add another workout whenever you're ready.`,
      );
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
      {loading && <div className="loading-card">Loading workout for the selected date…</div>}
      {!loading && log && <>
      <div className="workout-topline">
        <label className="workout-date-control">
          <span>WORKOUT DATE</span>
          <input
            type="date"
            value={selectedDate}
            max={getLocalDateString()}
            onChange={(event) => {
              if (event.target.value) setSelectedDate(event.target.value);
            }}
            aria-label="Workout date"
          />
          <span className="workout-date-hint">Select a past day to log a missed session.</span>
        </label>
        <div className="workout-topline-controls">
          <div className="weight-unit-control">
            <span className="workout-unit">WEIGHT UNIT</span>
            <div className="unit-switch" role="group" aria-label="Weight input unit">
              {["lb", "kg"].map((unit) => (
                <button
                  key={unit}
                  type="button"
                  className={weightUnit === unit ? "active" : ""}
                  aria-pressed={weightUnit === unit}
                  onClick={() => setWeightUnit(unit)}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <form onSubmit={handleSave}>
        <section className="workout-split-card">
          <div className="split-card-copy"><span className="section-eyebrow">{isToday ? "TODAY'S TRAINING" : "TRAINING FOR SELECTED DATE"}</span><h2>What are we working on?</h2><p>Choose a split to get exercise suggestions tailored to your session.</p></div>
          <label className="split-select-wrap"><span>SPLIT</span><select value={activeSplit} onChange={(event) => updateSplit(event.target.value)}>{splitOptions.map((split) => <option key={split}>{split}</option>)}</select><ChevronDown className="select-chevron" size={16} /></label>
          <div className="split-side-icon"><Dumbbell size={25} strokeWidth={1.4} /></div>
        </section>
        {activeSplit === "Rest" ? (
          <section className="rest-day-card"><div className="rest-icon"><span>✳</span></div><span className="section-eyebrow">REST DAY</span><h2>Recovery is part of the plan.</h2><p>Take it easy today. Your next session will thank you.</p><button className="primary-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save rest day"} {!busy && <Check size={15} />}</button></section>
        ) : (
          <>
            <section className="exercise-section">
              <div className="exercise-section-heading"><div><span className="section-eyebrow">{isToday ? "YOUR SESSION" : "SESSION FOR SELECTED DATE"}</span><h2>Exercises <span className="exercise-count">{exercises.filter((item) => item.exercise_name).length}</span></h2></div><div className="volume-total"><span>{hasSavedWorkout ? "DAY VOLUME" : "SESSION VOLUME"}</span><strong>{formatNumber(volume)} <small>lb</small></strong></div></div>
              <div className="exercise-header-row"><span>EXERCISE</span><span>SETS</span><span>REPS</span><span>WEIGHT · {weightUnit.toUpperCase()}</span><span /></div>
              <p className="weight-conversion-note">Enter any weight. Switching units converts the value; totals are saved in lb.</p>
              <div className="exercise-list">
                {exercises.map((exercise, index) => (
                  <div className="exercise-row" key={`exercise-${index}`}>
                    <div className="exercise-name-field">
                      <input list={`exercise-options-${index}`} value={exercise.exercise_name} onChange={(event) => updateExercise(index, "exercise_name", event.target.value)} placeholder="Search or enter an exercise" aria-label={`Exercise ${index + 1} name`} />
                      <datalist id={`exercise-options-${index}`}>
                        {library.filter((item) => item.split_category === activeSplit).map((item) => <option key={item.id} value={item.exercise_name} />)}
                      </datalist>
                    </div>
                    {["sets", "reps"].map((field) => <input key={field} type="number" min="0" step="1" inputMode="numeric" value={exercise[field]} onChange={(event) => updateExercise(index, field, Number(event.target.value))} aria-label={`${field} for ${exercise.exercise_name || `exercise ${index + 1}`}`} />)}
                    <input
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      value={toDisplayWeight(exercise.weight, weightUnit)}
                      onChange={(event) => updateWeight(index, event.target.value)}
                      aria-label={`Weight in ${weightUnit} for ${exercise.exercise_name || `exercise ${index + 1}`}`}
                    />
                    <button className="remove-exercise" type="button" aria-label={`Remove exercise ${index + 1}`} disabled={exercises.length === 1} onClick={() => setExercises((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              <button className="add-exercise" type="button" onClick={() => setExercises((current) => [...current, newExercise()])}><span><Plus size={15} /></span> {hasSavedWorkout ? "Add another workout" : "Add another exercise"}</button>
            </section>
            <div className="workout-save-row">
              <span><Check size={14} /> Saves to {isToday ? "today's" : selectedDateLabel} workout log</span>
              {log.workouts?.length > 0 && !hasSavedWorkout && (
                <button className="add-session-button" type="button" onClick={startAnotherWorkout}>
                  <Plus size={14} /> Add another workout
                </button>
              )}
              <button className="primary-button" type="submit" disabled={busy}>{busy ? "Saving workout…" : "Save workout"} {!busy && <Check size={15} />}</button>
            </div>
          </>
        )}
      </form>
      </>}
    </div>
  );
}
