exports.monthRange = (m) => {
  const now = new Date();
  let y = now.getFullYear();
  let mo = now.getMonth() + 1;
  if (m) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(m)) return null;
    [y, mo] = m.split('-').map(Number);
  }
  return { start: new Date(y, mo - 1, 1), end: new Date(y, mo, 1) };
};