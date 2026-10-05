export const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

export const CATEGORY_COLORS = {
  Food: '#f59e0b', Travel: '#38bdf8', Shopping: '#a78bfa', Bills: '#f87171',
  Entertainment: '#f472b6', Health: '#34d399', Education: '#60a5fa', Other: '#94a3b8',
};

export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const toInputDate = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export const monthKey = (d = new Date()) => toInputDate(d).slice(0, 7);

export const monthLabel = (m) =>
  new Date(`${m}-01`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

export const errMsg = (err) => err.response?.data?.message || 'Something went wrong';