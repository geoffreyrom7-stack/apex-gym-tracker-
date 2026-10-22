import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateLabel } from "../utils/date.js";
import { formatNumber, getWorkoutVolume } from "../utils/format.js";

export default function ProgressChart({ logs, calorieGoal }) {
  const data = logs.map((log) => ({
    day: formatDateLabel(log.date),
    calories: Number(log.macros_consumed?.calories) || 0,
    goal: calorieGoal,
    volume: getWorkoutVolume(log.workouts),
  }));

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 2, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--olympus-bronze)" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "var(--olympus-ash)", fontSize: 11 }} axisLine={false} tickLine={false} dy={9} />
          <YAxis yAxisId="calories" tick={{ fill: "var(--chart-axis)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
          <YAxis yAxisId="volume" orientation="right" hide />
          <Tooltip
            contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--olympus-bronze)", borderRadius: 12, color: "var(--olympus-marble)", fontSize: 12 }}
            labelStyle={{ color: "var(--olympus-ash)", marginBottom: 7 }}
            formatter={(value, name) => [formatNumber(value), name === "calories" ? "Calories" : name === "goal" ? "Calorie goal" : "Lift volume (lb)"]}
          />
          <Legend verticalAlign="top" align="right" iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: "var(--olympus-ash)", paddingBottom: 15 }} />
          <Line yAxisId="calories" type="monotone" dataKey="calories" name="Calories" stroke="var(--olympus-terracotta)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--olympus-terracotta)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
          <Line yAxisId="calories" type="monotone" dataKey="goal" name="Goal" stroke="var(--olympus-laurel)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
          <Line yAxisId="volume" type="monotone" dataKey="volume" name="Lift volume" stroke="var(--olympus-gold)" strokeWidth={2} dot={{ r: 2, fill: "var(--olympus-gold)", strokeWidth: 0 }} activeDot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
