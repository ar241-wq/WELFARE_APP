import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = Cookies.get('refresh');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, { refresh });
          Cookies.set('access', data.access, { expires: 1 });
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          clearTokens();
          if (typeof window !== 'undefined') window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export function setTokens(access: string, refresh: string) {
  Cookies.set('access', access, { expires: 1 });
  Cookies.set('refresh', refresh, { expires: 7 });
}

export function clearTokens() {
  Cookies.remove('access');
  Cookies.remove('refresh');
}

export function getAccessToken() {
  return Cookies.get('access');
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const { data } = await api.post('/api/auth/login/', { email, password });
  setTokens(data.access, data.refresh);
  return data;
}

export async function register(payload: {
  name: string; email: string; password: string; role: string;
}) {
  const { data } = await api.post('/api/auth/register/', payload);
  setTokens(data.access, data.refresh);
  return data;
}

export async function logout() {
  const refresh = Cookies.get('refresh');
  try { await api.post('/api/auth/logout/', { refresh }); } catch { /* noop */ }
  clearTokens();
}

export async function getMe() {
  const { data } = await api.get('/api/auth/me/');
  return data;
}

// ─── Company / Employees ───────────────────────────────────────────────────

export async function getEmployees() {
  const { data } = await api.get('/api/companies/employees/');
  return Array.isArray(data) ? data : data?.results ?? data;
}

export async function createEmployee(payload: { full_name: string; email: string; password: string; team_id?: number }) {
  const { data } = await api.post('/api/companies/employees/', payload);
  return data;
}

export async function allocateCredits(payload: {
  employee_ids?: number[]; team_id?: number; amount: number; month: string;
}) {
  const { data } = await api.post('/api/companies/allocate/', payload);
  return data;
}

export async function getCompanySettings() {
  const { data } = await api.get('/api/companies/settings/');
  return data;
}

export async function updateCompanySettings(payload: {
  monthly_budget_per_employee?: number; credits_rollover?: boolean;
}) {
  const { data } = await api.patch('/api/companies/settings/', payload);
  return data;
}

export async function getTeams() {
  const { data } = await api.get('/api/companies/teams/');
  return Array.isArray(data) ? data : data?.results ?? data;
}

export async function createTeam(payload: { name: string; manager_id?: number }) {
  const { data } = await api.post('/api/companies/teams/', payload);
  return data;
}

export async function getTeamDetail(id: number) {
  const { data } = await api.get(`/api/companies/teams/${id}/`);
  return data;
}

export async function updateTeam(id: number, payload: { name?: string }) {
  const { data } = await api.patch(`/api/companies/teams/${id}/`, payload);
  return data;
}

export async function deleteTeam(id: number) {
  await api.delete(`/api/companies/teams/${id}/`);
}

export async function updateEmployee(id: number, payload: { full_name?: string; team_id?: number | null; wallet_balance?: number }) {
  const { data } = await api.patch(`/api/companies/employees/${id}/`, payload);
  return data;
}

// ─── Approvals ─────────────────────────────────────────────────────────────

export async function getPerkRequests() {
  const { data } = await api.get('/api/approvals/requests/');
  return data;
}

export async function approveRequest(id: number, status: 'approved' | 'rejected') {
  const { data } = await api.patch(`/api/approvals/requests/${id}/`, { status });
  return data;
}

export async function getBundles() {
  const { data } = await api.get('/api/approvals/bundles/');
  return data;
}

export async function createBundle(payload: { name: string; perk_ids: number[] }) {
  const { data } = await api.post('/api/approvals/bundles/', payload);
  return data;
}

export async function assignBundle(bundleId: number, payload: {
  team_id?: number; employee_id?: number;
}) {
  const { data } = await api.post(`/api/approvals/bundles/${bundleId}/assign/`, payload);
  return data;
}

// ─── Life Moments ──────────────────────────────────────────────────────────

export async function getPendingLifeEvents() {
  const { data } = await api.get('/api/life-moments/pending/');
  return data;
}

export async function approveCarePackage(id: number, creditBoost: number) {
  const { data } = await api.post(`/api/life-moments/${id}/approve/`, {
    credit_boost: creditBoost,
  });
  return data;
}

// ─── Analytics ─────────────────────────────────────────────────────────────

export async function getAnalytics() {
  const [spend, utilization, topPerks] = await Promise.all([
    api.get('/api/analytics/spend/'),
    api.get('/api/analytics/utilization/'),
    api.get('/api/analytics/top-perks/'),
  ]);
  return {
    spend: spend.data,
    utilization: utilization.data,
    topPerks: topPerks.data,
  };
}

export async function getProviderStats() {
  const { data } = await api.get('/api/analytics/provider-stats/');
  return data;
}

// ─── Catalog / Perks ───────────────────────────────────────────────────────

export async function getMyPerks() {
  const { data } = await api.get('/api/catalog/perks/manage/');
  return Array.isArray(data) ? data : data?.results ?? data;
}

export async function getPerk(id: number) {
  const { data } = await api.get(`/api/catalog/perks/${id}/`);
  return data;
}

export async function createPerk(payload: FormData | Record<string, unknown>) {
  const isFormData = payload instanceof FormData;
  const { data } = await api.post('/api/catalog/perks/manage/', payload, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return data;
}

export async function updatePerk(id: number, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/api/catalog/perks/manage/${id}/`, payload);
  return data;
}

export async function deletePerk(id: number) {
  await api.delete(`/api/catalog/perks/manage/${id}/`);
}

export async function getCategories() {
  const { data } = await api.get('/api/catalog/categories/');
  return data;
}

// ─── Collaborations ────────────────────────────────────────────────────────

export async function getCollaborations() {
  const { data } = await api.get('/api/collaborations/');
  return Array.isArray(data) ? data : data?.results ?? data;
}

export async function inviteCollaboration(payload: { email: string; message?: string }) {
  const { data } = await api.post('/api/collaborations/', payload);
  return data;
}

export async function respondCollaboration(id: number, action: 'accept' | 'decline') {
  const { data } = await api.patch(`/api/collaborations/${id}/respond/`, { action });
  return data;
}

export async function getPackageDeals() {
  const { data } = await api.get('/api/collaborations/packages/');
  return Array.isArray(data) ? data : data?.results ?? data;
}

export async function createPackageDeal(payload: { collaboration_id: number; name: string; description?: string; total_price?: number }) {
  const { data } = await api.post('/api/collaborations/packages/', payload);
  return data;
}

export async function updatePackageDeal(id: number, payload: { name?: string; description?: string; total_price?: number; perk_ids?: number[]; target_employer_email?: string }) {
  const { data } = await api.patch(`/api/collaborations/packages/${id}/`, payload);
  return data;
}

export async function offerPackageDeal(id: number) {
  const { data } = await api.post(`/api/collaborations/packages/${id}/offer/`);
  return data;
}

export async function deletePackageDeal(id: number) {
  await api.delete(`/api/collaborations/packages/${id}/`);
}

export async function getEmployerPackageOffers() {
  const { data } = await api.get('/api/collaborations/offers/');
  return Array.isArray(data) ? data : data?.results ?? data;
}

export async function respondPackageOffer(id: number, action: 'accept' | 'reject') {
  const { data } = await api.patch(`/api/collaborations/offers/${id}/`, { action });
  return data;
}

export default api;
