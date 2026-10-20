import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase.js";
import { ensureUserProfile } from "../services/firestore.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setError("");
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        setProfile(await ensureUserProfile(nextUser));
      } catch (profileError) {
        setError(profileError.message);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      async signIn(email, password) {
        if (!auth) throw new Error("Add Firebase settings to .env.local to enable sign in.");
        setError("");
        await signInWithEmailAndPassword(auth, email, password);
      },
      async signUp(email, password) {
        if (!auth) throw new Error("Add Firebase settings to .env.local to enable sign up.");
        setError("");
        await createUserWithEmailAndPassword(auth, email, password);
      },
      async signInWithGoogle() {
        if (!auth) throw new Error("Add Firebase settings to .env.local to enable sign in.");
        setError("");
        await signInWithPopup(auth, new GoogleAuthProvider());
      },
      async signOutUser() {
        if (auth) await signOut(auth);
      },
      async refreshProfile() {
        if (auth?.currentUser) setProfile(await ensureUserProfile(auth.currentUser));
      },
    }),
    [user, profile, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
