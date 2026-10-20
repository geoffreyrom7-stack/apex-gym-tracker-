import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NutritionPage from "./pages/NutritionPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import WorkoutPage from "./pages/WorkoutPage.jsx";

export default function App() {
  const { user, profile, loading, error, signOutUser, refreshProfile } = useAuth();
  const [splashState, setSplashState] = useState("visible");

  useEffect(() => {
    if (loading) return undefined;
    const exitTimer = window.setTimeout(() => setSplashState("leaving"), 1450);
    const finishTimer = window.setTimeout(() => setSplashState("done"), 1900);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(finishTimer);
    };
  }, [loading]);

  if (splashState !== "done") return <SplashScreen exiting={splashState === "leaving"} />;
  if (loading) return <div className="boot-screen"><span className="boot-mark">A.</span><span>Getting your space ready…</span></div>;
  if (!user) {
    return <Routes><Route path="*" element={<LoginPage />} /></Routes>;
  }
  if (!profile && error) return <div className="boot-error"><strong>Couldn't load your profile</strong><span>{error}</span><button className="primary-button" onClick={signOutUser}>Sign out</button></div>;
  if (!profile) return <div className="boot-screen"><span className="boot-mark">A.</span><span>Setting up your profile…</span></div>;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage profile={profile} />} />
        <Route path="/workout" element={<WorkoutPage />} />
        <Route path="/nutrition" element={<NutritionPage profile={profile} />} />
        <Route path="/settings" element={<SettingsPage profile={profile} onProfileUpdate={refreshProfile} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
