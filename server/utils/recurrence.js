exports.addPeriod = (date, frequency, scheduleDay = date.getUTCDate()) => {
  const next = new Date(date);
  if (frequency === 'weekly') {
    next.setUTCDate(next.getUTCDate() + 7);
    return next;
  }

  const year = next.getUTCFullYear();
  const month = next.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(scheduleDay, lastDay)));
};
