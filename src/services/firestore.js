import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { starterExercises } from "../data/exercises.js";
import { getLastSevenDates, getLocalDateString } from "../utils/date.js";

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

export async function getOrCreateTodayLog(uid) {
  const database = requireDatabase();
  const date = getLocalDateString();
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

export async function saveDailyLog(uid, log) {
  const database = requireDatabase();
  const date = getLocalDateString();
  const logId = `${date}_${uid}`;
  await setDoc(
    doc(database, "daily_logs", logId),
    { ...log, log_id: logId, user_id: uid, date },
    { merge: true },
  );
}

export async function addMacrosToToday(uid, additions) {
  const database = requireDatabase();
  const date = getLocalDateString();
  const logRef = doc(database, "daily_logs", `${date}_${uid}`);

  await runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(logRef);
    const current = snapshot.exists() ? snapshot.data() : {};
    const consumed = current.macros_consumed || {};
    transaction.set(
      logRef,
      {
        log_id: `${date}_${uid}`,
        user_id: uid,
        date,
        split_type: current.split_type || "Rest",
        workouts: current.workouts || [],
        macros_consumed: Object.fromEntries(
          Object.entries(additions).map(([key, amount]) => [
            key,
            (Number(consumed[key]) || 0) + amount,
          ]),
        ),
      },
      { merge: true },
    );
  });
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
