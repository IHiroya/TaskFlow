// ── KANBAN VIEW ──
function KanbanView({ backlogs, tasks, onUpdate, onDelete, onEdit, onAddTask }) {
  const [dragging, setDragging] = React.useState(null);
  const [overCol, setOverCol] = React.useState(null);

  const cols = React.useMemo(
    () => STATUSES.reduce((a, s) => ({ ...a, [s]: tasks.filter(t => t.status === s) }), {}),
    [tasks]
  );

  const getBl = id => backlogs.find(b => b.id === id);

  return (
    <div className="kanban">
      {STATUSES.map(status => (
        <div
          key={status}
          className={`kanban-col${overCol === status ? ' drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setOverCol(status); }}
          onDragLeave={() => setOverCol(null)}
          onDrop={e => {
            e.preventDefault();
            if (dragging && dragging.status !== status) onUpdate({ ...dragging, status });
            setDragging(null);
            setOverCol(null);
          }}
        >
          <div className="col-header">
            <div className="col-label">
              <div className="col-dot" style={{ background: STATUS_COLORS[status] }} />
              {STATUS_LABELS[status]}
            </div>
            <span className="col-count">{cols[status].length}</span>
          </div>
          <div className="col-tasks">
            {cols[status].length === 0 && (
              <div className="empty-col">
                <span style={{ fontSize: 20 }}>○</span>
                <span>タスクなし</span>
              </div>
            )}
            {cols[status].map(task => {
              const bl = getBl(task.blId);
              const dl = deadlineStatus(task);
              return (
                <div
                  key={task.id}
                  className={`task-card${dragging?.id === task.id ? ' dragging' : ''}${dl ? ' ' + dl : ''}`}
                  draggable
                  onDragStart={() => setDragging(task)}
                  onDragEnd={() => { setDragging(null); setOverCol(null); }}
                  onClick={() => onEdit(task)}
                >
                  {bl && (
                    <span className="task-card-bl" style={{ background: bl.color + '22', color: bl.color }}>
                      {bl.name}
                    </span>
                  )}
                  <div className="task-card-title">{task.title}</div>
                  {task.description && <div className="task-card-desc">{task.description}</div>}
                  <div className="task-card-footer">
                    <span className="task-card-dates">{fmt(task.start)} → {fmt(task.end)}</span>
                    {dl === 'overdue'   && <span className="deadline-badge overdue">⚠ 期限超過</span>}
                    {dl === 'due-today' && <span className="deadline-badge due-today">● 今日期限</span>}
                  </div>
                  <div className="status-bar" style={{ background: STATUS_COLORS[task.status] }} />
                </div>
              );
            })}
            <button className="col-add-btn" onClick={() => onAddTask(status)}>＋ タスク追加</button>
          </div>
        </div>
      ))}
    </div>
  );
}
