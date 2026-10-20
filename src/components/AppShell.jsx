import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const pageTitles = {
  "/dashboard": ["Your training, in focus.", "Track the work. Own your progress."],
  "/workout": ["Make it count.", "Log your session and build on what you did last time."],
  "/nutrition": ["Fuel the hunt.", "Every meal is a chance to support your goals."],
  "/settings": ["Set your targets.", "Define the numbers behind your next level."],
};

export default function AppShell() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [title, subtitle] = pageTitles[pathname] || pageTitles["/dashboard"];

  return (
    <div className="app-shell">
      <Sidebar email={user?.email} />
      <main className="main-content">
        <header className="page-heading">
          <div className="eyebrow"><span className="live-dot" /> APEX / DAILY TRAINING SYSTEM</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        <Outlet />
        <footer className="app-footer"><span>APEX / DAILY TRAINING SYSTEM</span><span>SHOW UP. LOG IT. REPEAT.</span></footer>
      </main>
    </div>
  );
}
