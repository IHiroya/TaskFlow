// ── CONFIRM DIALOG ──
function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 200 }} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ width: 360, padding: '28px 28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>⚠️</span>
          <div className="modal-title" style={{ margin: 0, fontSize: 16 }}>{title}</div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
        <div className="modal-actions" style={{ marginTop: 0 }}>
          <button className="btn-cancel" onClick={onCancel}>キャンセル</button>
          <button className="btn-save" style={{ background: '#ff5050' }} onClick={onConfirm}>削除する</button>
        </div>
      </div>
    </div>
  );
}

// ── BACKLOG MODAL ──
function BacklogModal({ backlog, onSave, onDelete, onClose }) {
  const [form, setForm] = React.useState(backlog || { name: '', color: BL_COLORS[0] });
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-title">{backlog ? 'バックログを編集' : '新しいバックログ'}</div>
          <div className="form-group">
            <label className="form-label">バックログ名</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="例：バックエンドAPI開発" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">カラー</label>
            <div className="color-swatches">
              {BL_COLORS.map(c => (
                <div key={c} className={`color-swatch${form.color === c ? ' selected' : ''}`}
                  style={{ background: c }} onClick={() => set('color', c)} />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            {backlog && <button className="btn-delete" onClick={() => setConfirmDelete(true)}>削除</button>}
            <button className="btn-cancel" onClick={onClose}>キャンセル</button>
            <button className="btn-save" onClick={() => form.name && onSave(form)}>保存</button>
          </div>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title="バックログを削除"
          message={`「${form.name}」を削除します。配下のタスクもすべて削除されます。この操作は取り消せません。`}
          onConfirm={() => { onDelete(backlog.id); onClose(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

// ── TASK MODAL ──
function TaskModal({ task, backlogs, defaultBlId, prefill, onSave, onDelete, onClose }) {
  const [form, setForm] = React.useState(task || {
    title: '', description: '',
    status: prefill?.status || 'todo',
    blId: defaultBlId || (backlogs[0]?.id || ''),
    start: tod(), end: ds(addD(new Date(), 7))
  });
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-title">{task ? 'タスクを編集' : '新しいタスク'}</div>
          <div className="form-group">
            <label className="form-label">バックログ</label>
            <select className="form-select" value={form.blId} onChange={e => set('blId', e.target.value)}>
              {backlogs.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">タイトル</label>
            <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="タスク名を入力..." autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">説明</label>
            <textarea className="form-textarea" value={form.description}
              onChange={e => set('description', e.target.value)} placeholder="詳細を入力..." />
          </div>
          <div className="form-group">
            <label className="form-label">ステータス</label>
            <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">開始日</label>
              <input type="date" className="form-input" value={form.start} onChange={e => set('start', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">終了日</label>
              <input type="date" className="form-input" value={form.end} onChange={e => set('end', e.target.value)} />
            </div>
          </div>
          <div className="modal-actions">
            {task && <button className="btn-delete" onClick={() => setConfirmDelete(true)}>削除</button>}
            <button className="btn-cancel" onClick={onClose}>キャンセル</button>
            <button className="btn-save" onClick={() => form.title && onSave(form)}>保存</button>
          </div>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title="タスクを削除"
          message={`「${form.title}」を削除します。この操作は取り消せません。`}
          onConfirm={() => { onDelete(task.id); onClose(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

// ── GANTT POPOVER ──
function GanttPopover({ task, backlogs, anchorRect, onSave, onDelete, onClose }) {
  const [form, setForm] = React.useState({ ...task });
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const ref = React.useRef(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  React.useEffect(() => {
    function onDown(e) { if (ref.current && !ref.current.contains(e.target) && !confirmDelete) onClose(); }
    setTimeout(() => document.addEventListener('mousedown', onDown), 0);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose, confirmDelete]);

  const style = React.useMemo(() => {
    const W = 320, H = 420;
    let left = anchorRect ? anchorRect.left : window.innerWidth / 2 - W / 2;
    let top = anchorRect ? anchorRect.bottom + 8 : 80;
    if (left + W > window.innerWidth - 16) left = window.innerWidth - W - 16;
    if (left < 8) left = 8;
    if (top + H > window.innerHeight - 16) top = anchorRect ? anchorRect.top - H - 8 : window.innerHeight - H - 16;
    return { top, left, width: W };
  }, [anchorRect]);

  return (
    <>
      <div ref={ref} className="gantt-popover" style={style}>
        <div className="gantt-pop-hdr">
          <div className="gantt-pop-status-dot" style={{ background: STATUS_COLORS[form.status] }} />
          <input className="gantt-pop-title" value={form.title}
            onChange={e => set('title', e.target.value)} placeholder="タスク名..." autoFocus />
          <button className="gantt-pop-close" onClick={onClose}>✕</button>
        </div>
        <div className="gantt-pop-row">
          <div className="gantt-pop-label">バックログ</div>
          <select className="gantt-pop-select" value={form.blId} onChange={e => set('blId', e.target.value)}>
            {backlogs.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <textarea className="gantt-pop-desc" value={form.description || ''}
          onChange={e => set('description', e.target.value)} placeholder="説明（任意）..." rows={2} />
        <div className="gantt-pop-row">
          <div className="gantt-pop-label">ステータス</div>
          <div className="gantt-status-group">
            {STATUSES.map(s => (
              <button key={s} className="gantt-status-chip"
                style={form.status === s
                  ? { background: STATUS_COLORS[s], color: '#000', borderColor: STATUS_COLORS[s] }
                  : { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] }}
                onClick={() => set('status', s)}>{STATUS_LABELS[s]}</button>
            ))}
          </div>
        </div>
        <div className="gantt-pop-row">
          <div className="gantt-pop-label">期間</div>
          <div className="gantt-pop-dates">
            <input type="date" className="gantt-pop-date" value={form.start || ''} onChange={e => set('start', e.target.value)} />
            <span className="gantt-pop-arrow">→</span>
            <input type="date" className="gantt-pop-date" value={form.end || ''} onChange={e => set('end', e.target.value)} />
          </div>
        </div>
        {form.start && form.end && (
          <div className="gantt-pop-dur">{Math.max(1, diff(form.start, form.end) + 1)} 日間</div>
        )}
        <div className="gantt-pop-actions">
          <button className="gantt-pop-delete" onClick={() => setConfirmDelete(true)}>削除</button>
          <button className="gantt-pop-save" onClick={() => { if (form.title) { onSave(form); onClose(); } }}>保存</button>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title="タスクを削除"
          message={`「${form.title}」を削除します。この操作は取り消せません。`}
          onConfirm={() => { onDelete(task.id); onClose(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

// ── HELP MODAL ──
const HELP_CONTENT = {
  kanban: {
    title: 'カンバンの使い方',
    sections: [
      {
        heading: 'バックログを追加する',
        rows: [
          { icon: '☰', text: <><strong>左上の ☰</strong> をクリックしてサイドバーを開く</> },
          { icon: '＋', text: <><strong>「＋ バックログ追加」</strong> をクリックして名前とカラーを設定</> },
        ]
      },
      {
        heading: 'タスクを追加する',
        rows: [
          { icon: '📋', text: <>各カラム下部の <strong>「＋ タスク追加」</strong> をクリック</> },
          { icon: '📁', text: <>サイドバーのバックログ内 <strong>「＋ タスク追加」</strong> からも追加可能</> },
          { icon: '✎', text: <><strong>バックログ・ステータス・開始日・終了日</strong> を設定して「保存」</> },
        ]
      },
      {
        heading: 'タスクを操作する',
        rows: [
          { icon: '🖱', text: <><strong>カードをドラッグ</strong> して別カラムにドロップするとステータスが変わる</> },
          { icon: '⚠', text: <>期限超過は<strong style={{ color: '#ff4444' }}>赤</strong>、今日期限は<strong style={{ color: '#ffb400' }}>黄色</strong>のバッジで表示</> },
          { icon: '✏', text: <><strong>カードをクリック</strong> して編集・削除</> },
        ]
      },
    ]
  },
  gantt: {
    title: 'ガントチャートの使い方',
    sections: [
      {
        heading: 'バックログ・タスクを追加する',
        rows: [
          { icon: '☰', text: <><strong>左上の ☰</strong> でサイドバーを開き <strong>「＋ バックログ追加」</strong></> },
          { icon: '＋', text: <>左パネルの <strong>「＋ タスク追加」</strong> でそのバックログにタスクを追加</> },
          { icon: '✏', text: <>グリッドの<strong>空白部分をドラッグ</strong> すると期間を引いてタスク作成</> },
        ]
      },
      {
        heading: 'バーを操作する',
        rows: [
          { icon: '↔', text: <><strong>バーの中央をドラッグ</strong> すると日程ごと移動</> },
          { icon: '◀', text: <><strong>バー左端をドラッグ</strong> すると開始日を変更</> },
          { icon: '▶', text: <><strong>バー右端をドラッグ</strong> すると終了日を変更</> },
          { icon: '✎', text: <>左パネルの <strong>✎ ボタン</strong> でタスクを編集</> },
        ]
      },
      {
        heading: 'ナビゲーション',
        rows: [
          { icon: '📅', text: <><strong>「今日」</strong> ボタンで現在の日付に戻る</> },
          { icon: '‹›', text: <><strong>‹ › ボタン</strong> で14日単位で前後に移動</> },
        ]
      },
    ]
  },
  calendar: {
    title: 'カレンダーの使い方',
    sections: [
      {
        heading: 'タスクを確認する',
        rows: [
          { icon: '📅', text: <>タスクは<strong>開始日〜終了日の期間中</strong>すべての日付に表示</> },
          { icon: '🎨', text: <><strong>バックログのカラー</strong> でタスクを色分け表示</> },
          { icon: '⚠', text: <>期限超過は<strong style={{ color: '#ff4444' }}>赤</strong>、今日期限は<strong style={{ color: '#ffb400' }}>黄色</strong>で強調表示</> },
        ]
      },
      {
        heading: 'タスクを操作する',
        rows: [
          { icon: '✏', text: <><strong>ピルをクリック</strong> してタスクを編集</> },
          { icon: '‹›', text: <><strong>‹ › ボタン</strong> で月を移動、<strong>「今月」</strong> で当月に戻る</> },
          { icon: '＋', text: <>タスク追加は<strong>カンバンビュー</strong>またはサイドバーから</> },
        ]
      },
    ]
  },
};

function HelpModal({ view, onClose }) {
  const content = HELP_CONTENT[view];
  if (!content) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="help-modal">
        <div className="help-title">❓ {content.title}</div>
        <div className="help-subtitle">TaskFlow の基本的な使い方を説明します</div>
        {content.sections.map((sec, si) => (
          <div key={si} className="help-section">
            {si > 0 && <hr className="help-divider" />}
            <div className="help-section-title">
              <span>▍</span>{sec.heading}
            </div>
            {sec.rows.map((row, ri) => (
              <div key={ri} className="help-row">
                <div className="help-icon">{row.icon}</div>
                <div className="help-text">{row.text}</div>
              </div>
            ))}
          </div>
        ))}
        <button className="help-close" onClick={onClose}>閉じる</button>
      </div>
    </div>
  );
}
