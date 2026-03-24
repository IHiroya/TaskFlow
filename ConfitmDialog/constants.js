const DAY_W = 40;
const STATUSES = ['todo', 'inprogress', 'done'];
const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
const STATUS_COLORS = { todo: 'var(--todo)', inprogress: 'var(--prog)', done: 'var(--done)' };
const BL_COLORS = ['#7c6af7', '#e8ff47', '#ff8c42', '#4a9eff', '#4ade80', '#f472b6', '#fb923c', '#a78bfa'];

const INIT_BL = [
  { id: 'bl1', name: 'サンプルバックログ', color: '#7c6af7' },
];

function _initTasks() {
  return [
    {
      id: 't1', blId: 'bl1', title: 'サンプルタスク',
      description: 'これはサンプルのタスクです', status: 'todo',
      start: ds(new Date()), end: ds(addD(new Date(), 7))
    },
  ];
}
