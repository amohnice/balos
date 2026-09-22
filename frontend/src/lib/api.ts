import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  details?: unknown;
}

function normalizeApiResponse<T>(payload: unknown): ApiResponse<T> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    const hasData = Object.prototype.hasOwnProperty.call(record, 'data');

    return {
      ...record,
      success: typeof record.success === 'boolean' ? record.success : true,
      data: (hasData && record.data !== undefined ? record.data : null) as T,
    };
  }

  return {
    success: true,
    data: (payload ?? null) as T,
  };
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Unable to reach the server. Please try again.');
  }

  const contentType = response.headers.get('content-type') ?? '';
  let payload: unknown = null;

  if (response.status !== 204) {
    if (contentType.includes('application/json')) {
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
    } else {
      const text = await response.text();
      payload = { success: response.ok, error: text || 'Invalid response from server' };
    }
  }

  const normalized = normalizeApiResponse<T>(payload);

  if (!response.ok || normalized.success === false) {
    const message = normalized.error || normalized.message || 'Request failed';
    throw new Error(message);
  }

  return normalized;
}

export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string; businessName: string }) =>
      apiRequest<{ token: string; user: import('./auth').StoredUser; business?: unknown }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      apiRequest<{ token: string; user: import('./auth').StoredUser; businesses?: unknown[] }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => apiRequest<{ user: import('./auth').StoredUser; businesses: unknown[] }>('/auth/me'),
  },
  businesses: {
    list: () => apiRequest<unknown[]>('/businesses'),
    get: (id: string) => apiRequest<unknown>(`/businesses/${id}`),
    update: (id: string, data: { name?: string; description?: string; location?: string }) =>
      apiRequest<unknown>(`/businesses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    create: (data: { name: string; description?: string; location?: string }) =>
      apiRequest<unknown>('/businesses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMembers: (id: string) => apiRequest<unknown[]>(`/businesses/${id}/members`),
    addMember: (id: string, data: { name: string; email: string; password: string; role: string }) =>
      apiRequest<unknown>(`/businesses/${id}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateMember: (businessId: string, memberId: string, data: { role?: string; isActive?: boolean }) =>
      apiRequest<unknown>(`/businesses/${businessId}/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  suppliers: {
    list: (businessId: string) => apiRequest<unknown[]>(`/businesses/${businessId}/suppliers`),
    create: (
      businessId: string,
      data: { name: string; phone?: string; email?: string; location?: string; notes?: string }
    ) =>
      apiRequest<unknown>(`/businesses/${businessId}/suppliers`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (businessId: string, supplierId: string, data: unknown) =>
      apiRequest<unknown>(`/businesses/${businessId}/suppliers/${supplierId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (businessId: string, supplierId: string) =>
      apiRequest<unknown>(`/businesses/${businessId}/suppliers/${supplierId}`, {
        method: 'DELETE',
      }),
  },
  bales: {
    list: (businessId: string) => apiRequest<unknown[]>(`/businesses/${businessId}/bales`),
    get: (businessId: string, baleId: string) => apiRequest<unknown>(`/businesses/${businessId}/bales/${baleId}`),
    create: (businessId: string, data: unknown) =>
      apiRequest<unknown>(`/businesses/${businessId}/bales`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (businessId: string, baleId: string, data: unknown) =>
      apiRequest<unknown>(`/businesses/${businessId}/bales/${baleId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  categories: {
    list: (baleId: string) => apiRequest<unknown[]>(`/bales/${baleId}/categories`),
    get: (id: string) => apiRequest<unknown>(`/categories/${id}`),
    create: (baleId: string, data: unknown) =>
      apiRequest<unknown>(`/bales/${baleId}/categories`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    approve: (id: string) =>
      apiRequest<unknown>(`/categories/${id}/approve`, {
        method: 'PATCH',
      }),
    updatePrice: (id: string, data: { newPrice: number; reason?: string }) =>
      apiRequest<unknown>(`/categories/${id}/price`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    markdown: (id: string, data: { newPrice: number; reason?: string }) =>
      apiRequest<unknown>(`/categories/${id}/markdown`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  sales: {
    list: (businessId: string, params?: { limit?: number; offset?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
      if (params?.offset !== undefined) searchParams.set('offset', String(params.offset));
      const query = searchParams.toString();

      return apiRequest<unknown[]>(`/businesses/${businessId}/sales${query ? `?${query}` : ''}`);
    },
    create: (businessId: string, data: { items: unknown[]; paymentMethod?: string; notes?: string }) =>
      apiRequest<unknown>(`/businesses/${businessId}/sales`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getActiveCategories: (businessId: string) =>
      apiRequest<unknown[]>(`/businesses/${businessId}/sales/active-categories`),
  },
  dashboard: {
    get: (businessId: string) => apiRequest<unknown>(`/businesses/${businessId}/dashboard`),
  },
};
