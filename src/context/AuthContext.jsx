import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);
const USERS_KEY = "shopEaseUsers";
const AUTH_KEY = "shopEaseUser";

function readStoredValue(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredValue(AUTH_KEY, null));

  const startSession = (account) => {
    const activeUser = {
      name: account.name,
      email: account.email,
      role: account.role,
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(activeUser));
    setUser(activeUser);
  };

  const register = (account) => {
    const users = readStoredValue(USERS_KEY, []);
    const existingUser = users.find(
      (userEntry) => userEntry.email.toLowerCase() === account.email.toLowerCase()
    );

    if (existingUser) {
      throw new Error("An account with this email already exists.");
    }

    localStorage.setItem(USERS_KEY, JSON.stringify([...users, account]));
    startSession(account);
  };

  const login = (email, password) => {
    const users = readStoredValue(USERS_KEY, []);
    const account = users.find(
      (userEntry) =>
        userEntry.email.toLowerCase() === email.toLowerCase() &&
        userEntry.password === password
    );

    if (!account) {
      throw new Error("Email or password is incorrect.");
    }

    startSession(account);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}