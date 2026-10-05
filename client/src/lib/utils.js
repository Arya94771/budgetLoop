export const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

export const CATEGORY_COLORS = {
  Food: '#f59e0b', Travel: '#38bdf8', Shopping: '#a78bfa', Bills: '#f87171',
  Entertainment: '#f472b6', Health: '#34d399', Education: '#60a5fa', Other: '#94a3b8',
};

export const inr = (value) => {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};

export const fmtDate = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
};

export const toInputDate = (value = new Date()) => {
  if (value === null || value === undefined || value === '') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};

export const monthKey = (d = new Date()) => toInputDate(d).slice(0, 7);

export const monthLabel = (month) => {
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return '';
  return new Date(`${month}-01T00:00:00.000Z`).toLocaleDateString('en-IN', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
};

export const errMsg = (err) => err.response?.data?.message || 'Something went wrong';