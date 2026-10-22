import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { starterExercises } from "../data/exercises.js";
import { getLastSevenDates, getLocalDateString, isValidLogDate } from "../utils/date.js";

const defaultGoals = { calories: 2200, protein: 160, carbs: 220, fats: 70 };

function requireDatabase() {
  if (!db) throw new Error("Firebase is not configured. Add the project values to .env.local.");
  return db;
}

export async function ensureUserProfile(user) {
  const database = requireDatabase();
  const userRef = doc(database, "users", user.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    await setDoc(userRef, { uid: user.uid, email: user.email, macro_goals: defaultGoals });
    return { uid: user.uid, email: user.email, macro_goals: defaultGoals };
  }
  return snapshot.data();
}

export async function updateMacroGoals(uid, goals) {
  const database = requireDatabase();
  await setDoc(doc(database, "users", uid), { macro_goals: goals }, { merge: true });
}

export async function saveBodyMetrics(uid, bodyMetrics) {
  const database = requireDatabase();
  const userRef = doc(database, "users", uid);

  await runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const current = snapshot.exists() ? snapshot.data() : {};
    transaction.set(
      userRef,
      {
        body_metrics: {
          ...bodyMetrics,
          updated_at: new Date().toISOString(),
        },
        macro_goals: {
          ...defaultGoals,
          ...(current.macro_goals || {}),
          calories: bodyMetrics.calorie_target,
        },
      },
      { merge: true },
    );
  });
}

export async function getOrCreateTodayLog(uid) {
  return getOrCreateLogForDate(uid, getLocalDateString());
}

export async function getOrCreateLogForDate(uid, date) {
  if (!isValidLogDate(date) || date > getLocalDateString()) {
    throw new Error("Choose a valid workout date.");
  }
  const database = requireDatabase();
  const logId = `${date}_${uid}`;
  const logRef = doc(database, "daily_logs", logId);
  const snapshot = await getDoc(logRef);
  if (snapshot.exists()) return snapshot.data();

  const newLog = {
    log_id: logId,
    user_id: uid,
    date,
    split_type: "Rest",
    macros_consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    workouts: [],
  };
  await setDoc(logRef, newLog);
  return newLog;
}

export async function saveDailyLog(uid, date, log) {
  if (!isValidLogDate(date) || date > getLocalDateString()) {
    throw new Error("Choose a valid workout date.");
  }
  const database = requireDatabase();
  const logId = `${date}_${uid}`;
  await setDoc(
    doc(database, "daily_logs", logId),
    { ...log, log_id: logId, user_id: uid, date },
    { merge: true },
  );
}

export async function saveWorkoutSession(uid, date, splitType, workouts, dailyLog) {
  if (!isValidLogDate(date) || date > getLocalDateString()) {
    throw new Error("Choose a valid workout date.");
  }
  if (!Array.isArray(workouts) || workouts.length === 0) {
    throw new Error("Add at least one exercise before saving a workout.");
  }

  const database = requireDatabase();
  const dailyLogRef = doc(database, "daily_logs", `${date}_${uid}`);
  const session = {
    session_id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    user_id: uid,
    date,
    split_type: splitType,
    workouts,
    volume_lb: workouts.reduce(
      (total, workout) =>
        total +
        (Number(workout.sets) || 0) *
          (Number(workout.reps) || 0) *
          (Number(workout.weight) || 0),
      0,
    ),
    created_at: new Date().toISOString(),
  };

  await runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(dailyLogRef);
    const current = snapshot.exists() ? snapshot.data() : dailyLog;
    transaction.set(
      dailyLogRef,
      {
        ...current,
        log_id: `${date}_${uid}`,
        user_id: uid,
        date,
        split_type: splitType,
        workouts: [...(current.workouts || []), ...workouts],
        workout_sessions: [...(current.workout_sessions || []), session],
      },
      { merge: true },
    );
  });

  return session;
}

export async function getWorkoutHistory(uid) {
  const database = requireDatabase();
  const dailyLogQuery = query(
    collection(database, "daily_logs"),
    where("user_id", "==", uid),
    limit(100),
  );

  const dailyLogsSnapshot = await getDocs(dailyLogQuery);
  const sessions = dailyLogsSnapshot.docs.flatMap((snapshot) => {
    const log = snapshot.data();
    const savedSessions = (log.workout_sessions || []).map((session) => ({
      ...session,
      user_id: uid,
      date: session.date || log.date,
      legacy: false,
    }));

    if (!log.workouts?.length || log.split_type === "Rest") return savedSessions;

    const savedExerciseCount = savedSessions.reduce(
      (count, session) => count + (session.workouts?.length || 0),
      0,
    );
    const earlierExercises = log.workouts.slice(
      0,
      Math.max(0, log.workouts.length - savedExerciseCount),
    );
    if (earlierExercises.length === 0) return savedSessions;

    const legacySession = {
      session_id: `legacy-${log.log_id}`,
      user_id: uid,
      date: log.date,
      split_type: log.split_type,
      workouts: earlierExercises,
      volume_lb: earlierExercises.reduce(
        (total, workout) =>
          total +
          (Number(workout.sets) || 0) *
            (Number(workout.reps) || 0) *
            (Number(workout.weight) || 0),
        0,
      ),
      legacy: true,
    };

    return [...savedSessions, legacySession];
  });

  return sessions
    .sort((first, second) => {
      const dateOrder = String(second.date).localeCompare(String(first.date));
      if (dateOrder !== 0) return dateOrder;
      return String(second.created_at || "").localeCompare(String(first.created_at || ""));
    })
    .slice(0, 100);
}

export async function addFoodEntryToToday(uid, foodEntry) {
  const database = requireDatabase();
  const date = getLocalDateString();
  const logId = `${date}_${uid}`;
  const logRef = doc(database, "daily_logs", logId);

  await runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(logRef);
    const current = snapshot.exists() ? snapshot.data() : {};
    const consumed = current.macros_consumed || {};
    const additions = foodEntry.macros;

    transaction.set(
      logRef,
      {
        log_id: logId,
        user_id: uid,
        date,
        split_type: current.split_type || "Rest",
        workouts: current.workouts || [],
        macros_consumed: Object.fromEntries(
          Object.keys(defaultGoals).map((key) => [
            key,
            (Number(consumed[key]) || 0) + (Number(additions[key]) || 0),
          ]),
        ),
        food_entries: [...(current.food_entries || []), foodEntry],
      },
      { merge: true },
    );
  });
}

export async function saveCustomFood(uid, food) {
  const database = requireDatabase();
  const userRef = doc(database, "users", uid);
  let savedFoods = [];

  await runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const userData = snapshot.exists() ? snapshot.data() : {};
    const existingFoods = userData.custom_foods || [];
    const normalizedName = food.name.trim().toLocaleLowerCase();
    const savedFood = {
      ...food,
      id: `custom-${normalizedName.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      source: "My foods",
      name: food.name.trim(),
    };
    const matchingIndex = existingFoods.findIndex(
      (item) => item.name.trim().toLocaleLowerCase() === normalizedName,
    );

    savedFoods = [...existingFoods];
    if (matchingIndex >= 0) savedFoods[matchingIndex] = savedFood;
    else savedFoods.push(savedFood);

    transaction.set(userRef, { custom_foods: savedFoods }, { merge: true });
  });

  return savedFoods;
}

export async function getRecentLogs(uid) {
  const database = requireDatabase();
  const dates = getLastSevenDates();
  const snapshots = await Promise.all(
    dates.map((date) => getDoc(doc(database, "daily_logs", `${date}_${uid}`))),
  );
  return snapshots.map((snapshot, index) =>
    snapshot.exists()
      ? snapshot.data()
      : {
          date: dates[index],
          macros_consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 },
          workouts: [],
        },
  );
}

export async function getExerciseLibrary() {
  const database = requireDatabase();
  const snapshot = await getDocs(collection(database, "exercise_library"));
  if (snapshot.empty) return starterExercises;
  return snapshot.docs.map((exercise) => ({ id: exercise.id, ...exercise.data() }));
}
