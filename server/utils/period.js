exports.monthRange = (monthValue) => {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1;

  if (monthValue !== undefined) {
    if (typeof monthValue !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthValue)) return null;
    [year, month] = monthValue.split('-').map(Number);
  }

  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
};
