import { useState } from "react";
import { Activity, ArrowRight, Check, Dumbbell, Flame, Utensils } from "../components/Icons.jsx";
import ApexMark from "../components/ApexMark.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { isFirebaseConfigured } from "../firebase.js";

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      await (isSignup ? signUp(email, password) : signIn(email, password));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setMessage("");
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <a className="brand login-brand" href="/"><ApexMark /><span>APEX<span className="brand-period">.</span></span></a>
        <div className="visual-content">
          <div className="visual-kicker"><span /> BUILT FOR THE HUNT</div>
          <h1>Built to<br />outwork.<br /><em>Born to rise.</em></h1>
          <p>Track every rep. Own every choice. Close in on your next level.</p>
          <div className="visual-stats">
            <div><span className="visual-stat-icon lime"><Dumbbell size={17} /></span><div><strong>Train with intent</strong><span>Make every rep count.</span></div></div>
            <div><span className="visual-stat-icon orange"><Flame size={17} /></span><div><strong>Fuel the hunt</strong><span>Nutrition, under control.</span></div></div>
            <div><span className="visual-stat-icon blue"><Activity size={17} /></span><div><strong>Track your edge</strong><span>Progress, no guesswork.</span></div></div>
          </div>
        </div>
        <div className="login-footnote">APEX / NO SHORTCUTS. JUST PROGRESS.</div>
      </section>
      <section className="login-form-side">
        <div className="login-form-wrap">
          <div className="login-mobile-brand"><ApexMark />APEX<span className="brand-period">.</span></div>
          <div className="form-kicker">YOUR PERSONAL TRAINING SYSTEM</div>
          <h2>{isSignup ? "Claim your edge." : "Back to the hunt."}</h2>
          <p className="login-subtitle">{isSignup ? "Create your account. The work starts here." : "Your next level is waiting."}</p>
          {message && <div className="form-alert" role="alert">{message}</div>}
          {!isFirebaseConfigured && (
            <div className="setup-alert" role="status">
              <strong>Firebase setup needed</strong>
              <span>Copy <code>.env.example</code> to <code>.env.local</code>, add your project settings, and restart the dev server.</span>
            </div>
          )}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" autoComplete={isSignup ? "new-password" : "current-password"} placeholder="At least 6 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label>
            <button className="primary-button auth-submit" type="submit" disabled={busy || !isFirebaseConfigured}>
              {busy ? "One moment…" : isSignup ? "Create your account" : "Sign in"}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>
          <div className="auth-divider"><span />OR<span /></div>
          <button className="google-button" type="button" onClick={handleGoogle} disabled={busy || !isFirebaseConfigured}>
            <GoogleMark /> Continue with Google
          </button>
          <p className="auth-switch">{isSignup ? "Already have an account?" : "New to APEX?"} <button type="button" onClick={() => { setIsSignup(!isSignup); setMessage(""); }}>{isSignup ? "Sign in" : "Create an account"}</button></p>
          <div className="privacy-note"><Check size={13} /> Your training data stays yours.</div>
        </div>
      </section>
    </main>
  );
}

function GoogleMark() {
  return <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.98 47 31.95 47 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.38 14.38 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.92 23.92 0 0 0 0 24c0 3.88.93 7.56 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.94-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>;
}
