export const tabs = [
  { id: 'dashboard', label: '總覽', icon: 'ti ti-layout-dashboard' },
  { id: 'tasks', label: '任務', icon: 'ti ti-list-check' },
  { id: 'categories', label: '分類', icon: 'ti ti-chart-dots-3' },
  { id: 'reports', label: '日報', icon: 'ti ti-notebook' },
  { id: 'blockers', label: '卡關', icon: 'ti ti-alert-triangle' },
  { id: 'ideas', label: '想法', icon: 'ti ti-bulb' }
];

export const statusGroups = [
  { key: 'todo', title: '待辦', aliases: ['todo', '待辦', '未開始', 'open'] },
  { key: 'doing', title: '進行中', aliases: ['doing', '進行中', 'in progress', 'progress'] },
  { key: 'blocked', title: '卡關', aliases: ['blocked', '卡關', '阻塞'] },
  { key: 'done', title: '已完成', aliases: ['done', '完成', '已完成', 'closed'] },
  { key: 'idea', title: '想法池', aliases: ['idea', '想法', '想法池'] }
];

export const metricLabels = {
  completedTasks: '已完成',
  totalTasks: '總任務',
  todoCount: '待辦數',
  doingCount: '進行中數',
  blockerCount: '卡關數',
  ideaCount: '想法池數',
  reportedTodayCount: '今日已回報',
  notReportedTodayCount: '今日尚未回報',
  todayCompletedCount: '今日完成任務',
  todayIdeaCount: '今日新增想法'
};

export const statusColors = {
  todo: '#8a8680',
  doing: '#e8b84b',
  blocked: '#e05c4a',
  done: '#7ab38a',
  idea: '#9b6dff'
};
