import { API_BASE_URL, API_TYPES } from './config';

function buildUrl(type) {
  const url = new URL(API_BASE_URL);
  url.searchParams.set('type', type);
  return url.toString();
}

async function fetchJson(type) {
  if (!API_BASE_URL || API_BASE_URL.includes('/xxxx/')) {
    throw new Error('請先在 src/config.js 填入 Apps Script API_BASE_URL。');
  }

  const response = await fetch(buildUrl(type), {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API 連線失敗：HTTP ${response.status}`);
  }

  const payload = await response.json();

  if (payload?.success === false) {
    throw new Error(payload?.message || payload?.error || 'API 回傳 success: false');
  }

  return {
    success: payload?.success !== false,
    type: payload?.type || type,
    generatedAt: payload?.generatedAt || payload?.updatedAt || '',
    data: payload?.data ?? payload ?? {}
  };
}

export const fetchDashboard = () => fetchJson(API_TYPES.dashboard);
export const fetchTasks = () => fetchJson(API_TYPES.tasks);
export const fetchReports = () => fetchJson(API_TYPES.reports);
export const fetchMembers = () => fetchJson(API_TYPES.members);
export const fetchCategories = () => fetchJson(API_TYPES.categories);
export const fetchBlockers = () => fetchJson(API_TYPES.blockers);
export const fetchIdeas = () => fetchJson(API_TYPES.ideas);

export async function fetchAllData() {
  const entries = await Promise.allSettled([
    fetchDashboard(),
    fetchTasks(),
    fetchReports(),
    fetchMembers(),
    fetchCategories(),
    fetchBlockers(),
    fetchIdeas()
  ]);

  const keys = ['dashboard', 'tasks', 'reports', 'members', 'categories', 'blockers', 'ideas'];
  const result = {};
  const errors = [];

  entries.forEach((entry, index) => {
    const key = keys[index];
    if (entry.status === 'fulfilled') {
      result[key] = entry.value;
    } else {
      result[key] = { success: false, type: key, generatedAt: '', data: {} };
      errors.push(`${key}: ${entry.reason?.message || '讀取失敗'}`);
    }
  });

  return { result, errors };
}
