// ── APP ──
function App() {
  const [backlogs, setBacklogs] = React.useState(INIT_BL);
  const [tasks, setTasks] = React.useState(() => _initTasks());
  const [view, setView] = React.useState('kanban');
  const [taskModal, setTaskModal] = React.useState(null);
  const [blModal, setBlModal] = React.useState(null);
  const [showHelp, setShowHelp] = React.useState(false);

  function saveBl(form) {
    setBacklogs(bs => {
      const ex = bs.find(b => b.id === form.id);
      return ex ? bs.map(b => b.id === form.id ? { ...form } : b) : [...bs, { ...form, id: uid() }];
    });
    setBlModal(null);
  }

  function deleteBl(id) {
    setBacklogs(bs => bs.filter(b => b.id !== id));
    setTasks(ts => ts.filter(t => t.blId !== id));
    setBlModal(null);
  }

  function saveTask(form) {
    setTasks(ts => {
      const ex = ts.find(t => t.id === form.id);
      return ex ? ts.map(t => t.id === form.id ? { ...form } : t) : [...ts, { ...form, id: uid() }];
    });
    setTaskModal(null);
  }

  function deleteTask(id) { setTasks(ts => ts.filter(t => t.id !== id)); setTaskModal(null); }
  function updateTask(t) { setTasks(ts => ts.map(x => x.id === t.id ? t : x)); }

  return (
    <>
      <div className="header">
        <div className="logo"><div className="logo-dot" />TaskFlow</div>
        <div className="tab-group">
          <button className={`tab${view === 'kanban' ? ' active' : ''}`} onClick={() => setView('kanban')}>カンバン</button>
          <button className={`tab${view === 'gantt' ? ' active' : ''}`} onClick={() => setView('gantt')}>ガント</button>
          <button className={`tab${view === 'calendar' ? ' active' : ''}`} onClick={() => setView('calendar')}>カレンダー</button>
        </div>
        <div className="spacer" />
        <span className="hdr-count">{tasks.length} tasks</span>
        <button className="help-btn" onClick={() => setShowHelp(true)}>?</button>
      </div>

      <div className="main">
        <div className="layout">
          <Sidebar
            backlogs={backlogs}
            tasks={tasks}
            onEditBl={bl => setBlModal({ backlog: bl })}
            onAddBl={() => setBlModal({})}
            onAddTask={blId => setTaskModal({ task: null, defaultBlId: blId })}
            onEditTask={t => setTaskModal({ task: t, defaultBlId: t.blId })}
          />
          <div className="content">
            {view === 'kanban' && (
              <KanbanView
                backlogs={backlogs}
                tasks={tasks}
                onUpdate={updateTask}
                onDelete={deleteTask}
                onEdit={t => setTaskModal({ task: t, defaultBlId: t.blId })}
                onAddTask={status => setTaskModal({ task: null, defaultBlId: backlogs[0]?.id, prefill: { status } })}
              />
            )}
            {view === 'gantt' && (
              <GanttView
                backlogs={backlogs}
                tasks={tasks}
                onUpdate={updateTask}
                onDelete={deleteTask}
                onCreateTask={d => setTaskModal({ task: null, defaultBlId: d.blId || backlogs[0]?.id, prefill: d })}
              />
            )}
            {view === 'calendar' && (
              <CalendarView
                backlogs={backlogs}
                tasks={tasks}
                onEditTask={t => setTaskModal({ task: t, defaultBlId: t.blId })}
              />
            )}
          </div>
        </div>
      </div>

      {showHelp && <HelpModal view={view} onClose={() => setShowHelp(false)} />}

      {taskModal !== null && (
        <TaskModal
          task={taskModal.task}
          backlogs={backlogs}
          defaultBlId={taskModal.defaultBlId}
          prefill={taskModal.prefill}
          onSave={saveTask}
          onDelete={deleteTask}
          onClose={() => setTaskModal(null)}
        />
      )}

      {blModal !== null && (
        <BacklogModal
          backlog={blModal.backlog || null}
          onSave={saveBl}
          onDelete={deleteBl}
          onClose={() => setBlModal(null)}
        />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
