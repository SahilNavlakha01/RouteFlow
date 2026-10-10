const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('routeflow_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('routeflow_token', token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('routeflow_token');
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  updateProfile: (body: any) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Services
  getServices: () => request('/services'),
  createService: (body: any) => request('/services', { method: 'POST', body: JSON.stringify(body) }),
  updateService: (id: number, body: any) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteService: (id: number) => request(`/services/${id}`, { method: 'DELETE' }),

  // Locations (Societies & Blocks)
  getLocations: () => request('/locations'),
  createSociety: (body: any) => request('/locations/societies', { method: 'POST', body: JSON.stringify(body) }),
  updateSociety: (id: number, body: any) => request(`/locations/societies/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSociety: (id: number) => request(`/locations/societies/${id}`, { method: 'DELETE' }),
  createBlock: (societyId: number, body: any) => request(`/locations/societies/${societyId}/blocks`, { method: 'POST', body: JSON.stringify(body) }),
  deleteBlock: (id: number) => request(`/locations/blocks/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: (params?: { society_id?: string | number; block_id?: string | number; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.society_id) qs.append('society_id', String(params.society_id));
    if (params?.block_id) qs.append('block_id', String(params.block_id));
    if (params?.search) qs.append('search', params.search);
    return request(`/customers?${qs.toString()}`);
  },
  getCustomerById: (id: number) => request(`/customers/${id}`),
  createCustomer: (body: any) => request('/customers', { method: 'POST', body: JSON.stringify(body) }),
  updateCustomer: (id: number, body: any) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCustomer: (id: number) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Daily Entries
  getDailyEntries: (params?: { date?: string; society_id?: string | number; block_id?: string | number; customer_id?: string | number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.date) qs.append('date', params.date);
    if (params?.society_id) qs.append('society_id', String(params.society_id));
    if (params?.block_id) qs.append('block_id', String(params.block_id));
    if (params?.customer_id) qs.append('customer_id', String(params.customer_id));
    if (params?.status) qs.append('status', params.status);
    return request(`/daily-entries?${qs.toString()}`);
  },
  createDailyEntry: (body: any) => request('/daily-entries', { method: 'POST', body: JSON.stringify(body) }),
  updateDailyEntryStatus: (id: number, body: any) => request(`/daily-entries/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDailyEntry: (id: number) => request(`/daily-entries/${id}`, { method: 'DELETE' }),

  // Invoicing & Payments
  getStatement: (params: { customer_id: number; start_date?: string; end_date?: string }) => {
    const qs = new URLSearchParams({ customer_id: String(params.customer_id) });
    if (params.start_date) qs.append('start_date', params.start_date);
    if (params.end_date) qs.append('end_date', params.end_date);
    return request(`/invoices/statement?${qs.toString()}`);
  },
  recordPayment: (body: any) => request('/invoices/payments', { method: 'POST', body: JSON.stringify(body) }),
  getPayments: (customerId?: number) => {
    const qs = customerId ? `?customer_id=${customerId}` : '';
    return request(`/invoices/payments${qs}`);
  },

  // Dashboard
  getDashboardSummary: () => request('/dashboard/summary'),
};
