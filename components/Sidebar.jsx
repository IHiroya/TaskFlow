// ── SIDEBAR ──
function Sidebar({ backlogs, tasks, onEditBl, onAddBl, onAddTask, onEditTask }) {
  const [open, setSidebarOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(
    () => Object.fromEntries(backlogs.map(b => [b.id, false]))
  );

  React.useEffect(() => {
    setExpanded(e => {
      const n = { ...e };
      backlogs.forEach(b => { if (!(b.id in n)) n[b.id] = false; });
      return n;
    });
  }, [backlogs]);

  return (
    <div className={`sidebar ${open ? 'open' : 'closed'}`}>
      {/* Toggle button — always visible */}
      <div className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
        {open ? '←' : '☰'}
      </div>

      {open ? (
        /* ── FULL PANEL ── */
        <div className="sidebar-inner">
          <div className="sidebar-hdr">
            <div className="sidebar-title">バックログ</div>
            <button className="btn-add-bl" onClick={onAddBl}>＋ バックログ追加</button>
          </div>
          <div className="sidebar-list">
            {backlogs.map(bl => {
              const blTasks = tasks.filter(t => t.blId === bl.id);
              const isOpen = expanded[bl.id];
              return (
                <div key={bl.id} className="bl-item">
                  <div className="bl-item-hdr" onClick={() => setExpanded(e => ({ ...e, [bl.id]: !e[bl.id] }))}>
                    <div className="bl-color" style={{ background: bl.color }} />
                    <span className="bl-name">{bl.name}</span>
                    <span className="bl-cnt">{blTasks.length}</span>
                    <div onClick={e => e.stopPropagation()}>
                      <button className="bl-mini-btn" onClick={() => onEditBl(bl)}>✎</button>
                    </div>
                    <span className={`bl-chevron${isOpen ? ' open' : ''}`}>▶</span>
                  </div>
                  {isOpen && (
                    <div className="bl-tasks">
                      {blTasks.map(t => (
                        <div key={t.id} className="bl-task-row" onClick={() => onEditTask(t)}>
                          <div className="t-status-dot" style={{ background: STATUS_COLORS[t.status] }} />
                          <span className="bl-task-name">{t.title}</span>
                          <span className="bl-task-date">{fmt(t.end)}</span>
                        </div>
                      ))}
                      <div className="bl-add-task" onClick={() => onAddTask(bl.id)}>＋ タスク追加</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── ICON BAR ── */
        <div className="sidebar-icons">
          {/* Add backlog */}
          <button className="sidebar-icon-btn" onClick={() => { setSidebarOpen(true); onAddBl(); }}>
            <span style={{ fontSize: 16, color: 'var(--text3)' }}>＋</span>
            <span className="sidebar-icon-tooltip">バックログ追加</span>
          </button>
          {/* One dot per backlog */}
          {backlogs.map(bl => (
            <button key={bl.id} className="sidebar-icon-btn" onClick={() => setSidebarOpen(true)}>
              <div className="sidebar-icon-dot" style={{ background: bl.color }} />
              <span className="sidebar-icon-tooltip">{bl.name}（{tasks.filter(t => t.blId === bl.id).length}）</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
