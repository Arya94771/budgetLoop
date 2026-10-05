exports.isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

exports.parseMoney = (value, minimum = 0.01) => {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < minimum) return null;
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents) || Math.abs(amount - cents / 100) > 1e-9) return null;
  return cents / 100;
};

exports.parseDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day) return null;
  return date;
};
