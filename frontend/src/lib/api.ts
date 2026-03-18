// src/lib/api.ts — Centralised fetch wrapper for RenewX backend

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = (): string | null => localStorage.getItem('renewx_token');

const headers = (withBody = false): Record<string, string> => {
    const h: Record<string, string> = {};
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (withBody) h['Content-Type'] = 'application/json';
    return h;
};

const handleResponse = async (res: Response) => {
    const data = await res.json();
    if (!res.ok) {
        // Throw the backend error object so callers can read .message / .code
        throw Object.assign(new Error(data.message || 'Request failed'), { data });
    }
    return data;
};

export const api = {
    get: (path: string) =>
        fetch(`${BASE_URL}${path}`, { headers: headers() }).then(handleResponse),

    post: (path: string, body: unknown) =>
        fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers: headers(true),
            body: JSON.stringify(body),
        }).then(handleResponse),

    put: (path: string, body: unknown) =>
        fetch(`${BASE_URL}${path}`, {
            method: 'PUT',
            headers: headers(true),
            body: JSON.stringify(body),
        }).then(handleResponse),

    delete: (path: string) =>
        fetch(`${BASE_URL}${path}`, {
            method: 'DELETE',
            headers: headers(),
        }).then(handleResponse),
};
