export function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Number(value) || 0,
  );
}

export function getWorkoutVolume(workouts = []) {
  return workouts.reduce(
    (total, workout) =>
      total +
      (Number(workout.sets) || 0) *
        (Number(workout.reps) || 0) *
        (Number(workout.weight) || 0),
    0,
  );
}
