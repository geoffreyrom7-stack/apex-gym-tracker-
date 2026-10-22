import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const pageTitles = {
  "/dashboard": ["Your legend is built daily.", "Track the work. Earn your place on Olympus."],
  "/workout": ["Enter the arena.", "Log your session and build on what you did last time."],
  "/nutrition": ["Fuel the ascent.", "Every meal is an offering to your next level."],
  "/settings": ["Shape your quest.", "Set the targets behind your next level."],
};

export default function AppShell() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [title, subtitle] = pageTitles[pathname] || pageTitles["/dashboard"];

  return (
    <div className="app-shell">
      <Sidebar email={user?.email} />
      <main className="main-content" id="route-content">
        <header className="page-heading">
          <div className="eyebrow"><span className="live-dot" /> APEX / OLYMPIAN TRAINING</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        <Outlet />
        <footer className="app-footer"><span>APEX / OLYMPIAN TRAINING</span><span>FORGE YOUR LEGEND.</span></footer>
      </main>
    </div>
  );
}
