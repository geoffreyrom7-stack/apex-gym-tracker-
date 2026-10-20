import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, ArrowUpRight, Beef, CalendarDays, Dumbbell, Flame, Leaf, Plus, Sparkles, Target, Utensils } from "../components/Icons.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import ProgressChart from "../components/ProgressChart.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getOrCreateTodayLog, getRecentLogs } from "../services/firestore.js";
import { getLocalDateString } from "../utils/date.js";
import { formatNumber, getWorkoutVolume } from "../utils/format.js";

const macroItems = [
  { key: "calories", label: "Calories", unit: "kcal", color: "#c1121f", icon: Flame },
  { key: "protein", label: "Protein", unit: "g", color: "#f2f2f2", icon: Beef },
  { key: "carbs", label: "Carbs", unit: "g", color: "#a6a6a6", icon: Leaf },
  { key: "fats", label: "Fats", unit: "g", color: "#777777", icon: Target },
];

export default function DashboardPage({ profile }) {
  const { user } = useAuth();
  const [log, setLog] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getOrCreateTodayLog(user.uid), getRecentLogs(user.uid)])
      .then(([today, recent]) => {
        if (!active) return;
        setLog(today);
        setLogs(recent);
      })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.uid]);

  if (loading) return <div className="loading-card">Loading your training data…</div>;
  if (error) return <div className="error-card" role="alert">{error}</div>;

  const consumed = log?.macros_consumed || {};
  const goals = profile?.macro_goals || {};
  const totalVolume = getWorkoutVolume(log?.workouts);
  const dateLabel = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <div className="page-stack">
      <div className="today-strip"><CalendarDays size={15} /><span>{dateLabel}</span><span className="strip-divider" /><span className="strip-status"><span className="live-dot" /> DAY IN PROGRESS</span></div>
      <section className="summary-grid">
        <article className="hero-card">
          <div className="hero-glow" />
          <div className="hero-content">
            <span className="card-kicker"><Sparkles size={13} /> APEX / TODAY'S TARGET</span>
            <h2>{log?.split_type === "Rest" ? "Recovery is training, too." : `${log?.split_type || "Today's"} day.`}</h2>
            <p>{log?.split_type === "Rest" ? "Recover with intent. Come back sharper." : "No wasted motion. Make every rep matter."}</p>
            <Link className="hero-link" to="/workout">{log?.split_type === "Rest" ? "Plan your session" : "Open workout log"} <ArrowRight size={15} /></Link>
          </div>
          <div className="hero-art" aria-hidden="true"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-orbit orbit-three" /><div className="hero-art-core"><Dumbbell size={36} strokeWidth={1.2} /></div><span className="hero-art-dot dot-a" /><span className="hero-art-dot dot-b" /></div>
          <span className="hero-index">01 / STAY SHARP</span>
        </article>
        <article className="stat-card">
          <div className="stat-top"><span className="stat-icon"><Dumbbell size={16} /></span><span className="stat-caption">TODAY'S LIFT</span><ArrowUpRight className="stat-arrow" size={16} /></div>
          <div className="stat-main">{log?.workouts?.length ? formatNumber(totalVolume) : "—"}<span>{log?.workouts?.length ? " lb volume" : " no sets yet"}</span></div>
          <div className="stat-bottom"><span className="stat-line" /><span>{log?.workouts?.length || 0} exercises logged</span></div>
          <Link className="card-action" to="/workout">Log a workout <ArrowRight size={14} /></Link>
        </article>
        <article className="stat-card stat-card-cal">
          <div className="stat-top"><span className="stat-icon flame"><Flame size={16} /></span><span className="stat-caption">CALORIES IN</span><ArrowUpRight className="stat-arrow" size={16} /></div>
          <div className="stat-main">{formatNumber(consumed.calories)}<span> / {formatNumber(goals.calories)} kcal</span></div>
          <div className="mini-progress"><span style={{ width: `${Math.min(((consumed.calories || 0) / (goals.calories || 1)) * 100, 100)}%` }} /></div>
          <Link className="card-action" to="/nutrition">Add a meal <ArrowRight size={14} /></Link>
        </article>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="section-eyebrow">THE DAILY CHECK-IN</span><h2>Fuel & recovery</h2></div><Link className="text-link" to="/nutrition">Log nutrition <ArrowRight size={14} /></Link></div>
        <div className="macro-grid">
          {macroItems.map((item) => <ProgressRing key={item.key} {...item} value={consumed[item.key]} goal={goals[item.key]} />)}
        </div>
      </section>

      <section className="section-block progress-section">
        <div className="section-heading"><div><span className="section-eyebrow">THE BIGGER PICTURE</span><h2>Your last 7 days</h2></div><span className="chart-caption"><Activity size={14} /> DAILY MOMENTUM</span></div>
        <div className="chart-card">
          <div className="chart-heading"><div><strong>Consistency over intensity.</strong><span>Calories and lifting volume, day by day.</span></div><span className="chart-period">7 DAYS <ArrowRight size={12} /></span></div>
          <ProgressChart logs={logs} calorieGoal={Number(goals.calories) || 0} />
          <div className="chart-foot"><span><span className="foot-dot lime-dot" />Calories eaten</span><span><span className="foot-dot gray-dot" />Daily calorie goal</span><span><span className="foot-dot blue-dot" />Training volume · lb</span></div>
        </div>
      </section>

      <section className="bottom-cta">
        <div className="cta-icon"><Utensils size={18} /></div>
        <div><strong>Made a meal? Log it while it's fresh.</strong><span>Small check-ins make a clearer picture.</span></div>
        <Link to="/nutrition" className="cta-button">Log food <Plus size={15} /></Link>
      </section>
    </div>
  );
}
