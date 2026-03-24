// Date helpers
function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}
function ds(d) { return d.toISOString().slice(0, 10); }
function addD(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function diff(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
function tod() { return ds(new Date()); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

// Deadline status: 'overdue' | 'due-today' | null (done tasks are excluded)
function deadlineStatus(task) {
  if (task.status === 'done' || !task.end) return null;
  const t = tod();
  if (task.end < t) return 'overdue';
  if (task.end === t) return 'due-today';
  return null;
}
