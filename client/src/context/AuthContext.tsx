// Provides authentication state and auth actions to the React app.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, login as apiLogin, register as apiRegister, type User } from "../lib/api";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Stores the logged-in user and exposes login/register/logout helpers.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("midmind_token");
    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("midmind_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Logs in through the API, saves the token, and updates user state.
  async function login(email: string, password: string) {
    const data = await apiLogin(email, password);
    localStorage.setItem("midmind_token", data.token);
    setUser(data.user);
  }

  // Registers through the API, saves the token, and updates user state.
  async function register(name: string, email: string, password: string) {
    const data = await apiRegister(name, email, password);
    localStorage.setItem("midmind_token", data.token);
    setUser(data.user);
  }

  // Clears the saved token and returns the app to a logged-out state.
  function logout() {
    localStorage.removeItem("midmind_token");
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Lets components read the current auth state and actions.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
