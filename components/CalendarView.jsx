// ── CALENDAR VIEW ──
function CalendarView({ backlogs, tasks, onEditTask }) {
  const [calDate, setCalDate] = React.useState(new Date());
  const year = calDate.getFullYear(), month = calDate.getMonth();
  const todayStr = tod();

  const calDays = React.useMemo(() => {
    const first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
    const cells = [];
    for (let i = first.getDay() - 1; i >= 0; i--) cells.push({ date: addD(first, -i - 1), other: true });
    for (let d = 1; d <= last.getDate(); d++) cells.push({ date: new Date(year, month, d), other: false });
    const rem = 42 - cells.length;
    for (let i = 1; i <= rem; i++) cells.push({ date: addD(last, i), other: true });
    return cells;
  }, [year, month]);

  const getBl = id => backlogs.find(b => b.id === id);
  const mns = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="nav-btn" onClick={() => setCalDate(new Date(year, month - 1, 1))}>‹</button>
        <span className="calendar-title">{year}年 {mns[month]}</span>
        <button className="nav-btn" onClick={() => setCalDate(new Date(year, month + 1, 1))}>›</button>
        <button className="nav-btn" onClick={() => setCalDate(new Date())}
          style={{ marginLeft: 4, fontSize: 11, width: 'auto', padding: '0 10px' }}>今月</button>
        <div className="cal-legend">
          {STATUSES.map(s => (
            <div key={s} className="cal-legend-item">
              <div className="cal-legend-dot" style={{ background: STATUS_COLORS[s] }} />
              {STATUS_LABELS[s]}
            </div>
          ))}
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
            <div key={d} className={`cal-weekday${i === 0 ? ' sunday' : i === 6 ? ' saturday' : ''}`}>{d}</div>
          ))}
        </div>
        <div className="calendar-days">
          {calDays.map((cell, i) => {
            const dstr = ds(cell.date);
            const dow = cell.date.getDay();
            const dayTasks = tasks.filter(t => t.start && t.end && dstr >= t.start && dstr <= t.end);
            return (
              <div key={i}
                className={`cal-day${cell.other ? ' other-month' : ''}${dstr === todayStr ? ' today' : ''}${dow === 6 ? ' saturday' : ''}${dow === 0 ? ' sunday' : ''}`}>
                <div className="cal-day-num">{cell.date.getDate()}</div>
                {dayTasks.slice(0, 3).map(t => {
                  const bl = getBl(t.blId);
                  const dl = deadlineStatus(t);
                  const isEndDay = dstr === t.end;
                  return (
                    <div key={t.id} className="cal-task-pill"
                      style={{
                        background: dl === 'overdue' ? 'rgba(255,60,60,0.15)'
                          : dl === 'due-today' ? 'rgba(255,180,0,0.15)'
                          : (bl?.color || '#888') + '22',
                        color: dl === 'overdue' ? '#ff4444'
                          : dl === 'due-today' ? '#ffb400'
                          : bl?.color || '#888',
                        border: `1px solid ${dl === 'overdue' ? 'rgba(255,60,60,0.4)' : dl === 'due-today' ? 'rgba(255,180,0,0.4)' : (bl?.color || '#888') + '40'}`,
                      }}
                      onClick={() => onEditTask(t)}>
                      {dl === 'overdue' && isEndDay ? '⚠ ' : dl === 'due-today' && isEndDay ? '● ' : ''}{t.title}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && <div className="cal-more">+{dayTasks.length - 3}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
