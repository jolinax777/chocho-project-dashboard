import { useEffect, useMemo, useState } from 'react';
import { fetchAllData } from './api';

const tabs = [
  { id: 'dashboard', label: '總覽', icon: '⌂' },
  { id: 'tasks', label: '任務', icon: '▦' },
  { id: 'categories', label: '分類', icon: '◒' },
  { id: 'reports', label: '日報', icon: '☰' },
  { id: 'blockers', label: '卡關', icon: '!' },
  { id: 'ideas', label: '想法', icon: '✦' }
];

const statusGroups = [
  { key: 'todo', title: '待辦', aliases: ['todo', '待辦', '未開始', 'open'] },
  { key: 'doing', title: '進行中', aliases: ['doing', '進行中', 'in progress', 'progress'] },
  { key: 'blocked', title: '卡關', aliases: ['blocked', '卡關', '阻塞'] },
  { key: 'done', title: '已完成', aliases: ['done', '完成', '已完成', 'closed'] },
  { key: 'idea', title: '想法池', aliases: ['idea', '想法', '想法池'] }
];

const metricLabels = {
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

function arrayFrom(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.list)) return value.list;
  if (Array.isArray(value?.rows)) return value.rows;
  if (value && typeof value === 'object') return Object.values(value).filter((item) => typeof item === 'object');
  return [];
}

function pick(item, keys, fallback = '') {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function numberPick(source, keys, fallback = 0) {
  const value = pick(source, keys, fallback);
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function getTaskStatus(task) {
  return pick(task, ['status', '狀態', 'state'], '待辦');
}

function getGroupKey(task) {
  const status = normalizeText(getTaskStatus(task));
  const group = statusGroups.find((item) => item.aliases.some((alias) => status.includes(alias)));
  return group?.key || 'todo';
}

function formatDate(value) {
  if (!value) return '未填';
  return String(value);
}

function getDashboardData(raw, tasks, blockers, ideas) {
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

function ProgressBar({ value, label }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress-wrap" aria-label={label}>
      <div className="progress-meta">
        <span>{label}</span>
        <strong>{safeValue.toFixed(0)}%</strong>
      </div>
      <div className="progress-track">
        <span className="progress-fill" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [payloads, setPayloads] = useState({});
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState('');
  const [filters, setFilters] = useState({ status: 'all', category: 'all', query: '' });

  const loadData = async () => {
    setLoading(true);
    const { result, errors: apiErrors } = await fetchAllData();
    setPayloads(result);
    setErrors(apiErrors);
    setLastLoadedAt(new Date().toLocaleString('zh-TW', { hour12: false }));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const tasks = useMemo(() => arrayFrom(payloads.tasks?.data), [payloads.tasks]);
  const categories = useMemo(() => arrayFrom(payloads.categories?.data), [payloads.categories]);
  const reports = useMemo(() => arrayFrom(payloads.reports?.data?.reports || payloads.reports?.data), [payloads.reports]);
  const blockers = useMemo(() => arrayFrom(payloads.blockers?.data), [payloads.blockers]);
  const ideas = useMemo(() => arrayFrom(payloads.ideas?.data), [payloads.ideas]);
  const members = useMemo(() => arrayFrom(payloads.members?.data), [payloads.members]);
  const dashboard = useMemo(
    () => getDashboardData(payloads.dashboard, tasks, blockers, ideas),
    [payloads.dashboard, tasks, blockers, ideas]
  );

  const categoryOptions = useMemo(() => {
    const names = new Set(tasks.map((task) => pick(task, ['category', '分類'], '未分類')));
    categories.forEach((category) => names.add(pick(category, ['name', 'category', '分類'], '未分類')));
    return [...names].filter(Boolean);
  }, [tasks, categories]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const groupKey = getGroupKey(task);
      const category = pick(task, ['category', '分類'], '未分類');
      const text = normalizeText(Object.values(task).join(' '));
      return (
        (filters.status === 'all' || groupKey === filters.status) &&
        (filters.category === 'all' || category === filters.category) &&
        (!filters.query || text.includes(normalizeText(filters.query)))
      );
    });
  }, [tasks, filters]);

  const progress = dashboard.totalTasks ? (dashboard.completedTasks / dashboard.totalTasks) * 100 : 0;
  const currentTab = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">潮巢 Nestory</p>
          <h1>Project Dashboard</h1>
        </div>
        <button className="refresh-button" type="button" onClick={loadData} disabled={loading}>
          <span aria-hidden="true">↻</span>
          {loading ? '讀取中' : '重新整理'}
        </button>
      </header>

      <main className="content">
        <section className="hero-panel">
          <div>
            <p className="eyebrow">Project Bot 只讀儀表板</p>
            <h2>{currentTab?.label}</h2>
          </div>
          <div className="update-pill">最後更新：{lastLoadedAt || dashboard.generatedAt || '尚未讀取'}</div>
        </section>

        {errors.length > 0 && (
          <div className="error-banner">
            <strong>部分 API 讀取失敗</strong>
            <span>{errors.join(' / ')}</span>
          </div>
        )}

        {loading ? (
          <LoadingView />
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardView data={dashboard} progress={progress} />}
            {activeTab === 'tasks' && (
              <TasksView
                tasks={filteredTasks}
                filters={filters}
                setFilters={setFilters}
                categoryOptions={categoryOptions}
              />
            )}
            {activeTab === 'categories' && <CategoriesView categories={categories} tasks={tasks} />}
            {activeTab === 'reports' && <ReportsView reports={reports} members={members} />}
            {activeTab === 'blockers' && <BlockersView blockers={blockers} />}
            {activeTab === 'ideas' && <IdeasView ideas={ideas} />}
          </>
        )}
      </main>

      <nav className="bottom-nav" aria-label="主導覽">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function LoadingView() {
  return (
    <div className="loading-grid">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="skeleton-card" key={index} />
      ))}
    </div>
  );
}

function DashboardView({ data, progress }) {
  const metrics = Object.entries(metricLabels).map(([key, label]) => ({ key, label, value: data[key] ?? 0 }));
  return (
    <section className="page-stack">
      <div className="overview-card">
        <div>
          <p className="eyebrow">整體完成率</p>
          <h3>{data.completedTasks} / {data.totalTasks} 任務完成</h3>
        </div>
        <ProgressBar value={progress} label="總進度" />
      </div>
      <div className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.key}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>
      <p className="inline-note">API 最後產生時間：{data.generatedAt || '尚未提供'}</p>
    </section>
  );
}

function TasksView({ tasks, filters, setFilters, categoryOptions }) {
  return (
    <section className="page-stack">
      <div className="filter-bar">
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="all">全部狀態</option>
          {statusGroups.map((group) => (
            <option value={group.key} key={group.key}>{group.title}</option>
          ))}
        </select>
        <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <option value="all">全部分類</option>
          {categoryOptions.map((category) => (
            <option value={category} key={category}>{category}</option>
          ))}
        </select>
        <input
          type="search"
          placeholder="搜尋任務、負責人、備註"
          value={filters.query}
          onChange={(event) => setFilters({ ...filters, query: event.target.value })}
        />
      </div>
      {tasks.length === 0 ? (
        <EmptyState text="目前沒有符合條件的任務。" />
      ) : (
        <div className="kanban-grid">
          {statusGroups.map((group) => {
            const groupTasks = tasks.filter((task) => getGroupKey(task) === group.key);
            return (
              <section className="task-column" key={group.key}>
                <div className="column-title">
                  <h3>{group.title}</h3>
                  <span>{groupTasks.length}</span>
                </div>
                {groupTasks.length === 0 ? (
                  <EmptyState text={`目前沒有${group.title}項目。`} />
                ) : (
                  groupTasks.map((task, index) => <TaskCard task={task} key={`${pick(task, ['id', '任務名稱', 'title', 'name'], 'task')}-${index}`} />)
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TaskCard({ task }) {
  return (
    <article className="task-card">
      <div className="task-card-head">
        <h4>{pick(task, ['title', 'name', 'taskName', '任務名稱', '想法內容'], '未命名任務')}</h4>
        <span className={`status-badge status-${getGroupKey(task)}`}>{getTaskStatus(task)}</span>
      </div>
      <dl>
        <div><dt>分類</dt><dd>{pick(task, ['category', '分類'], '未分類')}</dd></div>
        <div><dt>優先級</dt><dd>{pick(task, ['priority', '優先級'], '未填')}</dd></div>
        <div><dt>負責人</dt><dd>{pick(task, ['owner', 'assignee', '負責人', '提出者'], '未填')}</dd></div>
        <div><dt>建立</dt><dd>{formatDate(pick(task, ['createdAt', 'createdDate', '建立日期']))}</dd></div>
        <div><dt>完成</dt><dd>{formatDate(pick(task, ['completedAt', 'completedDate', '完成日期']))}</dd></div>
      </dl>
    </article>
  );
}

function CategoriesView({ categories, tasks }) {
  const list = categories.length > 0 ? categories : buildCategoriesFromTasks(tasks);
  return (
    <section className="category-grid">
      {list.length === 0 ? (
        <EmptyState text="目前沒有分類資料。" />
      ) : (
        list.map((category, index) => {
          const total = numberPick(category, ['totalTasks', 'total', '總任務數'], 0);
          const done = numberPick(category, ['completedTasks', 'doneCount', '已完成數'], 0);
          const rate = numberPick(category, ['completionRate', '完成率'], total ? (done / total) * 100 : 0);
          return (
            <article className="category-card" key={`${pick(category, ['name', 'category', '分類'], '未分類')}-${index}`}>
              <h3>{pick(category, ['name', 'category', '分類'], '未分類')}</h3>
              <ProgressBar value={rate} label="完成率" />
              <div className="mini-stats">
                <span>總任務 {total}</span>
                <span>已完成 {done}</span>
                <span>待辦 {numberPick(category, ['todoCount', '待辦數'], 0)}</span>
                <span>進行中 {numberPick(category, ['doingCount', '進行中數'], 0)}</span>
                <span>卡關 {numberPick(category, ['blockerCount', '卡關數'], 0)}</span>
                <span>想法 {numberPick(category, ['ideaCount', '想法池數'], 0)}</span>
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}

function buildCategoriesFromTasks(tasks) {
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

function ReportsView({ reports, members }) {
  const reported = reports.map((report) => pick(report, ['member', 'name', '姓名', '回報人'], '')).filter(Boolean);
  const missing = members
    .map((member) => pick(member, ['name', '姓名', 'member'], ''))
    .filter((name) => name && !reported.includes(name));

  return (
    <section className="page-stack">
      <div className="report-summary">
        <article>
          <h3>今日已回報</h3>
          <p>{reported.length ? reported.join('、') : '目前尚無回報'}</p>
        </article>
        <article>
          <h3>尚未回報</h3>
          <p>{missing.length ? missing.join('、') : '目前沒有尚未回報名單'}</p>
        </article>
      </div>
      <div className="list-grid">
        {reports.length === 0 ? (
          <EmptyState text="目前沒有日報資料。" />
        ) : (
          reports.slice(0, 12).map((report, index) => (
            <article className="list-card" key={index}>
              <h3>{pick(report, ['member', 'name', '姓名', '回報人'], '未命名成員')}</h3>
              <InfoLine label="今日完成" value={pick(report, ['completedToday', '今日完成', 'todayDone'], '未填')} />
              <InfoLine label="進行中" value={pick(report, ['inProgress', '進行中'], '未填')} />
              <InfoLine label="明日待辦" value={pick(report, ['tomorrowTodo', '明日待辦'], '未填')} />
              <InfoLine label="卡關" value={pick(report, ['blockers', '卡關'], '未填')} />
              <InfoLine label="新想法" value={pick(report, ['ideas', '新想法'], '未填')} />
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function BlockersView({ blockers }) {
  return (
    <ListView
      items={blockers}
      empty="目前沒有卡關項目。"
      titleKeys={['title', 'name', 'taskName', '任務名稱']}
      lines={[
        ['分類', ['category', '分類']],
        ['提出者', ['reporter', 'owner', '提出者', '負責人']],
        ['建立日期', ['createdAt', 'createdDate', '建立日期']],
        ['備註', ['note', 'notes', '備註']]
      ]}
    />
  );
}

function IdeasView({ ideas }) {
  return (
    <ListView
      items={ideas}
      empty="目前沒有想法項目。"
      titleKeys={['content', 'idea', 'title', '想法內容']}
      lines={[
        ['分類', ['category', '分類']],
        ['提出者', ['reporter', 'owner', '提出者']],
        ['建立日期', ['createdAt', 'createdDate', '建立日期']]
      ]}
    />
  );
}

function ListView({ items, empty, titleKeys, lines }) {
  return (
    <section className="list-grid">
      {items.length === 0 ? (
        <EmptyState text={empty} />
      ) : (
        items.map((item, index) => (
          <article className="list-card" key={index}>
            <h3>{pick(item, titleKeys, '未命名項目')}</h3>
            {lines.map(([label, keys]) => <InfoLine label={label} value={pick(item, keys, '未填')} key={label} />)}
          </article>
        ))
      )}
    </section>
  );
}

function InfoLine({ label, value }) {
  return (
    <p className="info-line">
      <span>{label}</span>
      <strong>{String(value || '未填')}</strong>
    </p>
  );
}

export default App;
