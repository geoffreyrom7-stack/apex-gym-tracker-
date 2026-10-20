import { formatNumber } from "../utils/format.js";

export default function ProgressRing({ label, value = 0, goal = 0, unit, color, icon: Icon }) {
  const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const remainder = Math.max(goal - value, 0);

  return (
    <article className="macro-card">
      <div className="macro-card-top">
        <span className="macro-icon" style={{ color, backgroundColor: `${color}16` }}>
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <span className="macro-label">{label}</span>
      </div>
      <div className="ring-row">
        <div
          className="progress-ring"
          style={{ "--ring-color": color, "--ring-progress": `${percentage}%` }}
          role="img"
          aria-label={`${label}: ${formatNumber(value)} of ${formatNumber(goal)} ${unit}`}
        >
          <div className="ring-center"><strong>{Math.round(percentage)}%</strong></div>
        </div>
        <div className="macro-values">
          <strong>{formatNumber(value)}<span>{unit}</span></strong>
          <span className="macro-goal">of {formatNumber(goal)} {unit}</span>
          <span className="macro-remaining">{formatNumber(remainder)} left</span>
        </div>
      </div>
    </article>
  );
}
