import { createContext, useContext, useEffect, useState } from "react";
import { readList, USERS_KEY, writeList } from "../data/commerceStore";

const AuthContext = createContext(null);
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

  useEffect(() => {
    const syncSession = () => {
      const storedUser = readStoredValue(AUTH_KEY, null);
      if (!storedUser) {
        setUser(null);
        return;
      }

      const account = readList(USERS_KEY).find(
        (userEntry) => userEntry.email.toLowerCase() === storedUser.email.toLowerCase()
      );
      if (account?.status?.toLowerCase() === "blocked") {
        localStorage.removeItem(AUTH_KEY);
        setUser(null);
        return;
      }

      setUser(storedUser);
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener("shopease:data-change", syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("shopease:data-change", syncSession);
    };
  }, []);

  const startSession = (account) => {
    const activeUser = {
      id: account.id || account.email.toLowerCase(),
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

    if (account.role === "admin" && users.some((userEntry) => userEntry.role === "admin")) {
      throw new Error("An admin account is already configured.");
    }

    const newAccount = {
      ...account,
      id: account.id || account.email.toLowerCase(),
      status: "active",
    };
    writeList(USERS_KEY, [...users, newAccount]);
    startSession(newAccount);
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

    if (account.status?.toLowerCase() === "blocked") {
      throw new Error("This account has been blocked. Contact the store administrator.");
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