import { NavLink } from "react-router-dom";
import { Activity, Dumbbell, LayoutDashboard, Settings, Utensils } from "./Icons.jsx";

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/workout", label: "Workout", icon: Dumbbell },
  { to: "/nutrition", label: "Nutrition", icon: Utensils },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ email }) {
  return (
    <>
      <aside className="sidebar">
        <a className="brand" href="/dashboard" aria-label="APEX dashboard">
          <span className="brand-mark brand-letter">A</span>
          <span>APEX<span className="brand-period">.</span></span>
        </a>
        <div className="side-section-label">YOUR SPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <div className="note-icon"><SparklesIcon /></div>
            <p>Hunt the standard.</p>
            <span>Earn your edge every day.</span>
          </div>
          <div className="account-chip">
            <div className="avatar">{email?.[0]?.toUpperCase() || "A"}</div>
            <div className="account-copy"><strong>Your account</strong><span>{email || "Athlete"}</span></div>
          </div>
        </div>
      </aside>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}>
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

function SparklesIcon() {
  return <span className="sparkle-mark">✳</span>;
}
