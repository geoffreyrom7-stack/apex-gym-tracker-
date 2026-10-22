import { NavLink } from "react-router-dom";
import { Activity, Dumbbell, LayoutDashboard, Settings, Utensils } from "./Icons.jsx";
import ApexMark from "./ApexMark.jsx";

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
          <ApexMark />
          <span>APEX<span className="brand-period">.</span></span>
        </a>
        <div className="side-section-label">THE SANCTUARY</div>
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
            <svg className="sanctuary-wreath" viewBox="0 0 100 100" fill="none" aria-hidden="true">
              <path d="M35 80C13 63 16 29 42 14M65 80C87 63 84 29 58 14" />
              <path d="m28 67-13-1m10-13-12-6m16-6-9-10m18 0-3-12m32 48 13-1M74 54l12-6M68 41l9-10m-18 0 3-12" />
            </svg>
            <div className="note-icon"><SparklesIcon /></div>
            <p>Train among legends.</p>
            <span>Earn your place on Olympus.</span>
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
