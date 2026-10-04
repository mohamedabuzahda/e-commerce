const API_URL = "https://khaledashraf-001-site1.ltempurl.com";/*api*/
export async function adminRequest(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
    };

    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = { message: text };
    }

    if (!response.ok) {
        throw new Error(data?.message || data?.title || `Request failed (${response.status})`);
    }

    return data;
}

export function collection(data) {
    return data?.items || data?.data || data || [];
}
