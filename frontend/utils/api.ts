export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('excom_token') || undefined : undefined;
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const auth = token || getToken();
  const r = await fetch(`${API_BASE}${path}`, {
    next: { revalidate: 0 },
    headers: {
      ...(auth ? { Authorization: `Bearer ${auth}` } : {})
    }
  });
  if (!r.ok) {
    const errorData = await r.text();
    throw new Error(errorData || `GET ${path} failed`);
  }
  return r.json();
}  

export async function apiPost<T>(path: string, body?: any, token?: string): Promise<T> {
  const auth = token || getToken();
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: `Bearer ${auth}` } : {})
    },
    body: JSON.stringify(body || {})
  });
  if (!r.ok) {
    let errorMessage = `POST ${path} failed`;
    try {
      const errorText = await r.text();
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
    } catch {
      errorMessage = `POST ${path} failed with status ${r.status}`;
    }
    throw new Error(errorMessage);
  }
  return r.json();
}

export async function apiPatch<T>(path: string, body?: any, token?: string): Promise<T> {
  const auth = token || getToken();
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: `Bearer ${auth}` } : {})
    },
    body: JSON.stringify(body || {})
  });
  if (!r.ok) throw new Error(`PATCH ${path} failed`);
  return r.json();
}

export async function apiPut<T>(path: string, body?: any, token?: string): Promise<T> {
  const auth = token || getToken();
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: `Bearer ${auth}` } : {})
    },
    body: JSON.stringify(body || {})
  });
  if (!r.ok) throw new Error(`PUT ${path} failed`);
  return r.json();
}

export async function apiDelete<T>(path: string, token?: string): Promise<T> {
  const auth = token || getToken();
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: {
      ...(auth ? { Authorization: `Bearer ${auth}` } : {})
    }
  });
  if (!r.ok) throw new Error(`DELETE ${path} failed`);
  return r.json();
}