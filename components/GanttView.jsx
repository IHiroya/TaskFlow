// ── GANTT VIEW ──
function GanttView({ backlogs, tasks, onUpdate, onDelete, onCreateTask }) {
  const todayStr = tod();
  const [offset, setOffset] = React.useState(-7);
  const DAYS = 60;
  const [collapsed, setCollapsed] = React.useState(
    () => Object.fromEntries(backlogs.map(b => [b.id, false]))
  );

  React.useEffect(() => {
    setCollapsed(c => {
      const n = { ...c };
      backlogs.forEach(b => { if (!(b.id in n)) n[b.id] = false; });
      return n;
    });
  }, [backlogs]);

  const [dragState, setDragState] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [tooltip, setTooltip] = React.useState(null);
  const [popover, setPopover] = React.useState(null);
  const [createPrev, setCreatePrev] = React.useState(null);
  const previewRef = React.useRef(null);
  const draggedRef = React.useRef(false);

  React.useEffect(() => { previewRef.current = preview; }, [preview]);
  const isDragging = !!dragState;

  const days = React.useMemo(() => Array.from({ length: DAYS }, (_, i) => {
    const d = addD(new Date(), offset + i);
    const dow = d.getDay();
    return { date: d, str: ds(d), isToday: ds(d) === todayStr, isSat: dow === 6, isSun: dow === 0 };
  }), [offset, todayStr]);

  const first = days[0].str;
  const totalW = DAYS * DAY_W;
  const xFor = s => diff(first, s) * DAY_W;
  const wFor = (s, e) => Math.max((diff(s, e) + 1) * DAY_W, DAY_W);
  const todayX = xFor(todayStr);

  const rows = React.useMemo(() => {
    const result = [];
    backlogs.forEach(bl => {
      const blTasks = tasks.filter(t =>
        t.blId === bl.id && t.start && t.end &&
        t.end >= days[0].str && t.start <= days[days.length - 1].str
      );
      result.push({ type: 'group', bl, count: blTasks.length });
      if (!collapsed[bl.id]) {
        blTasks.forEach(t => result.push({ type: 'task', task: t, bl }));
        result.push({ type: 'add', bl });
      }
    });
    return result;
  }, [backlogs, tasks, days, collapsed]);

  const renderedRows = React.useMemo(() =>
    rows.map(r => r.type === 'task' && preview && r.task.id === preview.id ? { ...r, task: preview } : r),
    [rows, preview]
  );

  function startDrag(e, task, type) {
    e.stopPropagation();
    e.preventDefault();
    const sx = e.clientX, os = task.start, oe = task.end;
    let moved = false;
    draggedRef.current = false;
    setDragState({ type, task });

    function onMove(ev) {
      if (!moved && Math.abs(ev.clientX - sx) > 4) {
        moved = true;
        draggedRef.current = true;
      }
      if (!moved) return;
      const dd = Math.round((ev.clientX - sx) / DAY_W);
      let u;
      if (type === 'move') {
        u = { ...task, start: ds(addD(new Date(os), dd)), end: ds(addD(new Date(oe), dd)) };
      } else if (type === 'resize-right') {
        const ne = ds(addD(new Date(oe), dd));
        if (ne < os) return;
        u = { ...task, end: ne };
      } else if (type === 'resize-left') {
        const ns = ds(addD(new Date(os), dd));
        if (ns > oe) return;
        u = { ...task, start: ns };
      }
      if (u) setPreview(u);
    }

    function onUp() {
      if (draggedRef.current && previewRef.current) onUpdate(previewRef.current);
      setDragState(null);
      setPreview(null);
      setTooltip(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function handleCreateStart(e, rowKey, blId) {
    if (isDragging) return;
    e.preventDefault();
    const se = document.getElementById('gantt-scroll');
    if (!se) return;
    const seRect = se.getBoundingClientRect();
    const sl = se.scrollLeft;
    const x0 = e.clientX - seRect.left + sl;

    function onMove(ev) {
      const cx = ev.clientX - seRect.left + se.scrollLeft;
      setCreatePrev({ rowKey, left: Math.min(x0, cx), width: Math.abs(cx - x0) });
    }

    function onUp(ev) {
      const cx = ev.clientX - seRect.left + se.scrollLeft;
      const l = Math.min(x0, cx), r = Math.max(x0, cx);
      if (r - l > DAY_W / 2) {
        const s = ds(addD(new Date(first), Math.floor(l / DAY_W)));
        const en = ds(addD(new Date(first), Math.floor(r / DAY_W)));
        onCreateTask({ blId, start: s, end: en });
      }
      setCreatePrev(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  return (
    <div className="gantt-container">
      <div className="gantt-toolbar">
        <span className="gantt-toolbar-title">ガントチャート</span>
        <div className="gantt-nav">
          <button className="nav-btn" onClick={() => setOffset(o => o - 14)}>‹</button>
          <button className="nav-btn" onClick={() => {
            setOffset(-7);
            const se = document.getElementById('gantt-scroll');
            if (se) se.scrollLeft = 0;
          }}>今日</button>
          <button className="nav-btn" onClick={() => setOffset(o => o + 14)}>›</button>
        </div>
        <span className="gantt-period">{fmt(days[0].str)} – {fmt(days[DAYS - 1].str)}</span>
        <div className="gantt-hints">
          <span className="gantt-hint-chip">↔ ドラッグで移動</span>
          <span className="gantt-hint-chip">◀▶ 端で期間変更</span>
          <span className="gantt-hint-chip">空白ドラッグで作成</span>
        </div>
      </div>

      <div className="gantt-body">
        {/* Left labels */}
        <div className="gantt-left">
          <div className="gantt-left-header">タスク</div>
          <div className="gantt-left-rows" id="gantt-left-rows">
            {renderedRows.map(row => {
              if (row.type === 'group') return (
                <div key={row.bl.id + '-g'} className="gantt-group-row"
                  onClick={() => setCollapsed(c => ({ ...c, [row.bl.id]: !c[row.bl.id] }))}>
                  <div className="gantt-group-color" style={{ background: row.bl.color }} />
                  <span className="gantt-group-name">{row.bl.name}</span>
                  <span className="gantt-group-count">{row.count}</span>
                  <span className={`gantt-group-chevron${!collapsed[row.bl.id] ? ' open' : ''}`}>▶</span>
                </div>
              );
              if (row.type === 'add') return (
                <div key={row.bl.id + '-add'} className="gantt-row-add"
                  onClick={() => onCreateTask({ blId: row.bl.id })}>
                  ＋ タスク追加
                </div>
              );
              const { task, bl } = row;
              return (
                <div key={task.id} className="gantt-row-label"
                  onClick={() => setPopover({ task, rect: null })}>
                  <div className="gantt-row-dot" style={{ background: STATUS_COLORS[task.status] }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div className="gantt-row-name">{task.title}</div>
                    <div className="gantt-row-dates">{fmt(task.start)} – {fmt(task.end)}</div>
                  </div>
                  <button className="gantt-row-edit-btn"
                    onClick={e => { e.stopPropagation(); setPopover({ task, rect: e.currentTarget.getBoundingClientRect() }); }}>✎</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right grid */}
        <div className="gantt-right">
          <div className="gantt-scroll" id="gantt-scroll" onScroll={e => {
            const lr = document.getElementById('gantt-left-rows');
            if (lr) lr.scrollTop = e.target.scrollTop;
          }}>
            <div className="gantt-grid" style={{ width: totalW, minWidth: totalW }}>
              <div className="gantt-header-row">
                {days.map(d => (
                  <div key={d.str}
                    className={`gantt-day-header${d.isToday ? ' today' : ''}${d.isSat ? ' saturday' : ''}${d.isSun ? ' sunday' : ''}`}
                    style={{ width: DAY_W }}>
                    <span className="day-num">{d.date.getDate()}</span>
                    <span className="day-name">{'日月火水木金土'[d.date.getDay()]}</span>
                  </div>
                ))}
              </div>

              {todayX >= 0 && todayX <= totalW && (
                <div className="gantt-today-line" style={{ left: todayX + DAY_W / 2 }} />
              )}

              <div className="gantt-rows">
                {renderedRows.map((row) => {
                  const rowKey = row.type === 'group' ? row.bl.id + '-g' :
                    row.type === 'add' ? row.bl.id + '-add' : row.task.id;

                  if (row.type === 'group') return (
                    <div key={rowKey} className="gantt-grid-group" style={{ width: totalW }}>
                      {days.map(d => (
                        <div key={d.str} className="gantt-grid-group-cell"
                          style={{
                            width: DAY_W,
                            background: d.isSat ? 'rgba(74,158,255,0.06)'
                              : d.isSun ? 'rgba(255,80,80,0.06)'
                              : row.bl.color + '0a'
                          }} />
                      ))}
                    </div>
                  );

                  if (row.type === 'add') return (
                    <div key={rowKey} className="gantt-data-row" style={{ width: totalW }}>
                      {days.map(d => (
                        <div key={d.str}
                          className={`gantt-cell${d.isSat ? ' saturday' : ''}${d.isSun ? ' sunday' : ''}${d.isToday ? ' today-col' : ''}`}
                          style={{ width: DAY_W }} />
                      ))}
                      <div className="gantt-create-zone"
                        onMouseDown={e => handleCreateStart(e, rowKey, row.bl.id)} />
                      {createPrev && createPrev.rowKey === rowKey && (
                        <div className="gantt-create-preview"
                          style={{ left: createPrev.left, width: createPrev.width }} />
                      )}
                    </div>
                  );

                  const { task, bl } = row;
                  const isActive = dragState?.task?.id === task.id;
                  const dl = deadlineStatus(task);
                  const x = xFor(task.start), w = wFor(task.start, task.end);
                  const cx = Math.max(0, x), cw = Math.min(w + Math.min(0, x), totalW - cx);

                  return (
                    <div key={task.id} className="gantt-data-row" style={{ width: totalW }}>
                      {days.map(d => (
                        <div key={d.str}
                          className={`gantt-cell${d.isSat ? ' saturday' : ''}${d.isSun ? ' sunday' : ''}${d.isToday ? ' today-col' : ''}`}
                          style={{ width: DAY_W }} />
                      ))}
                      <div className="gantt-create-zone"
                        onMouseDown={e => handleCreateStart(e, task.id, bl.id)} />
                      {createPrev && createPrev.rowKey === task.id && (
                        <div className="gantt-create-preview"
                          style={{ left: createPrev.left, width: createPrev.width }} />
                      )}
                      <div className="gantt-bar-layer">
                        {cw > 0 && (
                          <div
                            className={`gantt-bar${isActive ? ' is-dragging' : ''}${dl ? ' ' + dl : ''}`}
                            style={{ left: cx, width: cw, background: bl.color }}
                            onMouseDown={e => e.stopPropagation()}
                            onMouseEnter={e => setTooltip({ task, bl, x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => !isDragging && setTooltip(null)}
                            onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                          >
                            <div className="gantt-bar-resize gantt-bar-resize-left"
                              onMouseDown={e => { e.stopPropagation(); startDrag(e, task, 'resize-left'); }}>⋮</div>
                            <div className="gantt-bar-inner"
                              onMouseDown={e => { e.stopPropagation(); startDrag(e, task, 'move'); }}>
                              {task.title}
                              {isActive && preview && (
                                <span className="gantt-drag-dates">{fmt(preview.start)}–{fmt(preview.end)}</span>
                              )}
                            </div>
                            <div className="gantt-bar-resize gantt-bar-resize-right"
                              onMouseDown={e => { e.stopPropagation(); startDrag(e, task, 'resize-right'); }}>⋮</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {tooltip && (
        <div className="gantt-tooltip" style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}>
          <div className="gantt-tooltip-title">{tooltip.task.title}</div>
          <span className="gantt-tooltip-bl" style={{ background: tooltip.bl.color + '22', color: tooltip.bl.color }}>
            {tooltip.bl.name}
          </span>
          {tooltip.task.description && <div className="gantt-tooltip-desc">{tooltip.task.description}</div>}
          <div className="gantt-tooltip-dates">
            <span style={{ color: STATUS_COLORS[tooltip.task.status] }}>{STATUS_LABELS[tooltip.task.status]}</span>
            &nbsp;·&nbsp;
            {fmt(preview && dragState?.task?.id === tooltip.task.id ? preview.start : tooltip.task.start)}
            &nbsp;→&nbsp;
            {fmt(preview && dragState?.task?.id === tooltip.task.id ? preview.end : tooltip.task.end)}
            &nbsp;·&nbsp;
            {Math.max(1, diff(
              preview && dragState?.task?.id === tooltip.task.id ? preview.start : tooltip.task.start,
              preview && dragState?.task?.id === tooltip.task.id ? preview.end : tooltip.task.end
            ) + 1)}日間
          </div>
        </div>
      )}

      {popover && (
        <GanttPopover
          task={popover.task}
          backlogs={backlogs}
          anchorRect={popover.rect}
          onSave={t => { onUpdate(t); setPopover(null); }}
          onDelete={id => { onDelete(id); setPopover(null); }}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}
