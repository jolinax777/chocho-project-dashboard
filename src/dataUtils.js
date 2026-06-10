import { statusGroups } from './constants';

export function arrayFrom(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.list)) return value.list;
  if (Array.isArray(value?.rows)) return value.rows;
  if (value && typeof value === 'object') return Object.values(value).filter((item) => typeof item === 'object');
  return [];
}

export function pick(item, keys, fallback = '') {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

export function numberPick(source, keys, fallback = 0) {
  const value = pick(source, keys, fallback);
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

export function getTaskStatus(task) {
  return pick(task, ['status', '狀態', 'state'], '待辦');
}

export function getGroupKey(task) {
  const status = normalizeText(getTaskStatus(task));
  const group = statusGroups.find((item) => item.aliases.some((alias) => status.includes(alias)));
  return group?.key || 'todo';
}

export function formatDate(value) {
  if (!value) return '未填';
  return String(value);
}

export function getDashboardData(raw, tasks, blockers, ideas) {
  const data = raw?.data || {};
  const totalTasks = numberPick(data, ['totalTasks', 'total', '總任務數'], tasks.length);
  const completedTasks = numberPick(
    data,
    ['completedTasks', 'doneCount', '已完成數'],
    tasks.filter((task) => getGroupKey(task) === 'done').length
  );

  return {
    totalTasks,
    completedTasks,
    todoCount: numberPick(data, ['todoCount', '待辦數'], tasks.filter((task) => getGroupKey(task) === 'todo').length),
    doingCount: numberPick(data, ['doingCount', 'inProgressCount', '進行中數'], tasks.filter((task) => getGroupKey(task) === 'doing').length),
    blockerCount: numberPick(data, ['blockerCount', 'blockedCount', '卡關數'], blockers.length),
    ideaCount: numberPick(data, ['ideaCount', 'ideasCount', '想法池數'], ideas.length),
    reportedTodayCount: numberPick(data, ['reportedTodayCount', 'todayReportedCount', '今日已回報人數'], 0),
    notReportedTodayCount: numberPick(data, ['notReportedTodayCount', 'missingReportCount', '今日尚未回報人數'], 0),
    todayCompletedCount: numberPick(data, ['todayCompletedCount', '今日完成任務數'], 0),
    todayIdeaCount: numberPick(data, ['todayIdeaCount', 'todayNewIdeasCount', '今日新增想法數'], 0),
    generatedAt: raw?.generatedAt || pick(data, ['generatedAt', '最後更新時間'], '')
  };
}

export function buildCategoriesFromTasks(tasks) {
  const map = new Map();
  tasks.forEach((task) => {
    const name = pick(task, ['category', '分類'], '未分類');
    const current = map.get(name) || { name, totalTasks: 0, completedTasks: 0, todoCount: 0, doingCount: 0, blockerCount: 0, ideaCount: 0 };
    current.totalTasks += 1;
    const key = getGroupKey(task);
    if (key === 'done') current.completedTasks += 1;
    if (key === 'todo') current.todoCount += 1;
    if (key === 'doing') current.doingCount += 1;
    if (key === 'blocked') current.blockerCount += 1;
    if (key === 'idea') current.ideaCount += 1;
    map.set(name, current);
  });
  return [...map.values()];
}
