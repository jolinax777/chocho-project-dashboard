import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { fetchAllData } from './api';
import { statusGroups, tabs } from './constants';
import {
  arrayFrom,
  buildCategoriesFromTasks,
  formatDate,
  getDashboardData,
  getGroupKey,
  getTaskStatus,
  normalizeText,
  numberPick,
  pick
} from './dataUtils';

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
  try {
    const { result, errors: apiErrors } = await fetchAllData();
    setPayloads(result);
    setErrors(apiErrors);
    setLastLoadedAt(new Date().toLocaleString('zh-TW', { hour12: false }));
  } catch (error) {
    setErrors([error?.message || '資料載入失敗']);
  } finally {
    setLoading(false);
  }
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
  const displayTime = lastLoadedAt || dashboard.generatedAt || '尚未同步';

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        blockerCount={blockers.length}
        lastLoadedAt={displayTime}
      />

      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="date-line">{new Date().toLocaleDateString('zh-TW', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1>{currentTab?.label}</h1>
          </div>
          <button className="refresh-button" type="button" onClick={loadData} disabled={loading}>
            <i className="ti ti-refresh" aria-hidden="true" />
            {loading ? '同步中' : '重新整理'}
          </button>
        </header>

        <main className="content">
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
              {activeTab === 'dashboard' && (
                <DashboardView data={dashboard} progress={progress} categories={categories} tasks={tasks} />
              )}
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
      </div>

      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} blockerCount={blockers.length} />
    </div>
  );
}

function Sidebar({ activeTab, setActiveTab, blockerCount, lastLoadedAt }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">潮</div>
        <div>
          <p className="brand-name">潮巢 <span>NESTORY</span></p>
          <p className="brand-subtitle">Project Bot · 只讀模式</p>
        </div>
      </div>

      <nav className="side-nav" aria-label="主導覽">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${activeTab === tab.id ? 'active' : ''} ${tab.id === 'blockers' ? 'danger' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={tab.icon} aria-hidden="true" />
            <span>{tab.label}</span>
            {tab.id === 'blockers' && blockerCount > 0 && <b>{blockerCount}</b>}
          </button>
        ))}
      </nav>

      <div className="sync-note">
        <span>最後同步</span>
        <strong>{lastLoadedAt}</strong>
      </div>
    </aside>
  );
}

function MobileNav({ activeTab, setActiveTab, blockerCount }) {
  return (
    <nav className="mobile-nav" aria-label="手機主導覽">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? 'active' : ''}
          onClick={() => setActiveTab(tab.id)}
        >
          <span>
            <i className={tab.icon} aria-hidden="true" />
            {tab.id === 'blockers' && blockerCount > 0 && <b>{blockerCount}</b>}
          </span>
          {tab.label}
        </button>
      ))}
    </nav>
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

function DashboardView({ data, progress, categories, tasks }) {
  const statusCounts = {
    todo: data.todoCount,
    doing: data.doingCount,
    blocked: data.blockerCount,
    done: data.completedTasks
  };
  const categoryList = categories.length > 0 ? categories : buildCategoriesFromTasks(tasks);

  return (
    <section className="page-stack dashboard-page">
      <div className="dashboard-cards">
        <article className="vinyl-card">
          <div className="vinyl-content">
            <p className="section-kicker">Total Progress</p>
            <strong>{Math.round(progress)}%</strong>
            <span>{data.completedTasks} / {data.totalTasks} tasks completed</span>
          </div>
          <div className="vinyl-disc" aria-hidden="true" />
          <div className="vinyl-progress">
            <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
          </div>
        </article>

        <div className="stat-mini-grid">
          <MiniStat label="待辦" value={data.todoCount} tone="todo" />
          <MiniStat label="進行中" value={data.doingCount} tone="doing" />
          <MiniStat label="卡關" value={data.blockerCount} tone="blocked" />
          <MiniStat label="已完成" value={data.completedTasks} tone="done" />
        </div>

        <article className="today-card">
          <p className="section-kicker">Today</p>
          <TodayLine label="今日完成任務" value={data.todayCompletedCount} />
          <TodayLine label="已回報成員" value={data.reportedTodayCount} />
          <TodayLine label="尚未回報" value={data.notReportedTodayCount} />
          <TodayLine label="新增想法" value={data.todayIdeaCount} />
        </article>
      </div>

      <div className="chart-grid">
        <StatusDoughnutChart counts={statusCounts} />
        <CategoryBarChart categories={categoryList} />
      </div>

      <p className="inline-note">API 最後產生時間：{data.generatedAt || '尚未提供'}</p>
    </section>
  );
}

function MiniStat({ label, value, tone }) {
  return (
    <article className={`mini-stat mini-stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function TodayLine({ label, value }) {
  return (
    <p className="today-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function StatusDoughnutChart({ counts }) {
  const canvasRef = useRef(null);
  const labels = ['待辦', '進行中', '卡關', '已完成'];
  const values = [counts.todo, counts.doing, counts.blocked, counts.done];
  const colors = ['#8a8680', '#e8b84b', '#e05c4a', '#7ab38a'];

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    const chart = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }]
      },
      options: {
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#141416',
            titleColor: '#f5e6c8',
            bodyColor: '#f0ece4',
            borderColor: '#2a2a2e',
            borderWidth: 1
          }
        }
      }
    });
    return () => chart.destroy();
  }, [counts.todo, counts.doing, counts.blocked, counts.done]);

  return (
    <article className="chart-card">
      <div className="chart-head">
        <div>
          <p className="section-kicker">Status Mix</p>
          <h3>任務狀態分佈</h3>
        </div>
      </div>
      <div className="chart-body">
        <canvas ref={canvasRef} />
      </div>
      <div className="chart-legend">
        {labels.map((label, index) => (
          <span key={label}>
            <i style={{ background: colors[index] }} />
            {label} {values[index] || 0}
          </span>
        ))}
      </div>
    </article>
  );
}

function CategoryBarChart({ categories }) {
  const canvasRef = useRef(null);
  const palette = ['#9b6dff', '#e8b84b', '#7ab38a', '#e05c4a', '#d4853a'];
  const labels = categories.slice(0, 8).map((category) => pick(category, ['name', 'category', '分類'], '未分類'));
  const values = categories.slice(0, 8).map((category) => {
    const total = numberPick(category, ['totalTasks', 'total', '總任務數'], 0);
    const done = numberPick(category, ['completedTasks', 'doneCount', '已完成數'], 0);
    return numberPick(category, ['completionRate', '完成率'], total ? (done / total) * 100 : 0);
  });

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    const chart = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: labels.map((_, index) => palette[index % palette.length]),
            borderRadius: 5
          }
        ]
      },
      options: {
        scales: {
          x: {
            ticks: { color: '#8a8680' },
            grid: { display: false }
          },
          y: {
            min: 0,
            max: 100,
            ticks: { color: '#8a8680', callback: (value) => `${value}%` },
            grid: { color: 'rgba(245, 230, 200, .08)' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#141416',
            titleColor: '#f5e6c8',
            bodyColor: '#f0ece4',
            callbacks: { label: (context) => `${context.parsed.y}%` }
          }
        }
      }
    });
    return () => chart.destroy();
  }, [labels.join('|'), values.join('|')]);

  return (
    <article className="chart-card">
      <div className="chart-head">
        <div>
          <p className="section-kicker">Category Rate</p>
          <h3>分類完成率</h3>
        </div>
      </div>
      {categories.length === 0 ? <EmptyState text="目前沒有分類圖表資料。" /> : <div className="chart-body"><canvas ref={canvasRef} /></div>}
    </article>
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
              <section className={`task-column column-${group.key}`} key={group.key}>
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
  const groupKey = getGroupKey(task);
  return (
    <article className={`task-card task-card-${groupKey}`}>
      <div className="task-card-head">
        <h4>{pick(task, ['title', 'name', 'taskName', '任務名稱', '想法內容'], '未命名任務')}</h4>
        <span className={`status-badge status-${groupKey}`}>{getTaskStatus(task)}</span>
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
      tone="blocker"
      tag="卡關"
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
      tone="idea"
      tag="想法"
      lines={[
        ['分類', ['category', '分類']],
        ['提出者', ['reporter', 'owner', '提出者']],
        ['建立日期', ['createdAt', 'createdDate', '建立日期']]
      ]}
    />
  );
}

function ListView({ items, empty, titleKeys, lines, tone = 'default', tag = '項目' }) {
  return (
    <section className="list-grid">
      {items.length === 0 ? (
        <EmptyState text={empty} />
      ) : (
        items.map((item, index) => (
          <article className={`list-card list-card-${tone}`} key={index}>
            <span className="list-dot" aria-hidden="true" />
            <div className="list-card-title">
              <h3>{pick(item, titleKeys, '未命名項目')}</h3>
              <span>{tag}</span>
            </div>
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
