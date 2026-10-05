export const API_URL = "https://khaledashraf-001-site1.ltempurl.com";

async function renewStoredSession() {
    try {
        const activeUser = JSON.parse(localStorage.getItem("shopEaseUser") || "null");
        const users = JSON.parse(localStorage.getItem("shopEaseUsers") || "[]");
        const account = users.find((user) => user.email?.toLowerCase() === activeUser?.email?.toLowerCase());
        if (!account?.password) return null;

        const response = await fetch(`${API_URL}/api/Auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: account.email, password: account.password }),
        });
        if (!response.ok) return null;

        const result = await response.json();
        const authData = result?.data || result;
        const token = authData?.token || authData?.accessToken || authData?.access_token || authData?.jwt || authData?.jwtToken;
        if (typeof token !== "string" || !token) return null;

        localStorage.setItem("token", token);
        return token;
    } catch {
        return null;
    }
}

export async function adminRequest(endpoint, options = {}) {
    const baseHeaders = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
    };
    const sendRequest = (token) => fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...baseHeaders,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    let response = await sendRequest(localStorage.getItem("token"));
    let renewedSession = false;
    if (response.status === 401) {
        const renewedToken = await renewStoredSession();
        if (renewedToken) {
            response = await sendRequest(renewedToken);
            renewedSession = true;
        }
    }

    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = { message: text };
    }

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error(renewedSession
                ? "The database API rejected this customer account. The server must allow customers to create products."
                : "The database session could not be renewed. Sign in again, then retry.");
        }
        throw new Error(data?.message || data?.title || `Request failed (${response.status})`);
    }

    return data;
}

export function collection(data) {
    return data?.items || data?.data || data || [];
}
