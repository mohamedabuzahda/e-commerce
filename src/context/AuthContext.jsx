import { createContext, useContext, useEffect, useState } from "react";
import { API_URL } from "../admin/adminApi";
import { readList, USERS_KEY, writeList } from "../data/commerceStore";

const AuthContext = createContext(null);
const AUTH_KEY = "shopEaseUser";
const TOKEN_KEY = "token";

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
  const [apiSessionLoading, setApiSessionLoading] = useState(() => {
    const storedUser = readStoredValue(AUTH_KEY, null);
    return Boolean(storedUser && storedUser.role !== "admin" && !localStorage.getItem(TOKEN_KEY));
  });

  useEffect(() => {
    let recoveryInProgress = false;

    const syncSession = async () => {
      const storedUser = readStoredValue(AUTH_KEY, null);
      if (!storedUser) {
        setUser(null);
        setApiSessionLoading(false);
        return;
      }

      const account = readList(USERS_KEY).find(
        (userEntry) => userEntry.email.toLowerCase() === storedUser.email.toLowerCase()
      );
      if (account?.status?.toLowerCase() === "blocked") {
        localStorage.removeItem(AUTH_KEY);
        setUser(null);
        setApiSessionLoading(false);
        return;
      }

      setUser(storedUser);
      if (storedUser.role === "admin" || localStorage.getItem(TOKEN_KEY)) {
        setApiSessionLoading(false);
        return;
      }

      if (!account?.password || recoveryInProgress) {
        setApiSessionLoading(false);
        return;
      }

      recoveryInProgress = true;
      setApiSessionLoading(true);
      try {
        let remoteSession;
        try {
          remoteSession = await authenticateRemote(storedUser.email, account.password, account);
        } catch (authError) {
          if (account.role !== "admin" && authError.message.includes("(401)")) {
            remoteSession = await registerRemoteCustomer(account);
          } else {
            throw authError;
          }
        }

        const currentUser = readStoredValue(AUTH_KEY, null);
        if (currentUser?.email?.toLowerCase() === storedUser.email.toLowerCase()) {
          localStorage.setItem(TOKEN_KEY, remoteSession.token);
          setUser(remoteSession.account);
        }
      } catch {
        // Keep the local session active; protected requests will show their API error.
      } finally {
        recoveryInProgress = false;
        setApiSessionLoading(false);
      }
    };

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener("shopease:data-change", syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("shopease:data-change", syncSession);
    };
  }, []);

  const startSession = (account, token = null) => {
    const activeUser = {
      id: account.id || account.email.toLowerCase(),
      name: account.name,
      email: account.email,
      role: account.role,
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(activeUser));
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    setUser(activeUser);
  };

  const register = async (account) => {
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

    if (account.role !== "admin") {
      const remoteSession = await registerRemoteCustomer(newAccount);
      writeList(USERS_KEY, [...users, newAccount]);
      startSession(remoteSession.account, remoteSession.token);
      return;
    }

    writeList(USERS_KEY, [...users, newAccount]);
    startSession(newAccount);
  };

  const login = async (email, password) => {
    const users = readStoredValue(USERS_KEY, []);
    const account = users.find(
      (userEntry) =>
        userEntry.email.toLowerCase() === email.toLowerCase() &&
        userEntry.password === password
    );

    if (account?.status?.toLowerCase() === "blocked") {
      throw new Error("This account has been blocked. Contact the store administrator.");
    }

    try {
      const remoteSession = await authenticateRemote(email.trim(), password, account);
      startSession(remoteSession.account, remoteSession.token);
    } catch (remoteError) {
      if (account && account.password === password && account.role !== "admin" && remoteError.message.includes("(401)")) {
        const remoteSession = await registerRemoteCustomer(account);
        startSession(remoteSession.account, remoteSession.token);
        return;
      }

      if (account?.role === "admin" && account.password === password) {
        startSession(account);
        return;
      }

      throw remoteError;
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout, apiSessionLoading }}>
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

async function authRequest(endpoint, payload) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responseText = await response.text();
  let data;

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = { message: responseText };
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.title || `Request failed (${response.status})`);
  }

  return data;
}

function getAuthData(response) {
  const result = response?.data || response;
  const user = result?.user || result?.account || result?.profile || {};
  const token = result?.token || result?.accessToken || result?.access_token || result?.jwt;
  return { user, token: typeof token === "string" ? token : null };
}

function getRemoteAccount(remoteUser, fallback, email) {
  const name = remoteUser.name
    || remoteUser.fullName
    || [remoteUser.firstName, remoteUser.lastName].filter(Boolean).join(" ")
    || fallback?.name
    || email;

  return {
    id: remoteUser.id || fallback?.id || email.toLowerCase(),
    name,
    email: remoteUser.email || fallback?.email || email,
    role: fallback?.role || remoteUser.role || "customer",
  };
}

async function authenticateRemote(email, password, fallbackAccount) {
  const response = await authRequest("/api/Auth/login", { email, password });
  const { user, token } = getAuthData(response);

  if (!token) throw new Error("The database API did not return an access token.");
  return { account: getRemoteAccount(user, fallbackAccount, email), token };
}

async function registerRemoteCustomer(account) {
  const [firstName, ...lastNameParts] = account.name.trim().split(/\s+/);
  const response = await authRequest("/api/Auth/register", {
    firstName,
    lastName: lastNameParts.join(" ") || firstName,
    email: account.email,
    password: account.password,
    role: "Customer",
  });
  const { user, token } = getAuthData(response);

  if (token) return { account: getRemoteAccount(user, account, account.email), token };
  return authenticateRemote(account.email, account.password, account);
}