const test = require('node:test');
const assert = require('node:assert/strict');
const { parseDate, parseMoney } = require('../utils/validation');
const { monthRange } = require('../utils/period');
const { addPeriod } = require('../utils/recurrence');

test('money parser accepts exact cents and rejects invalid precision or coercions', () => {
  assert.equal(parseMoney('100.25'), 100.25);
  assert.equal(parseMoney(0.1), 0.1);
  assert.equal(parseMoney('0', 0), 0);
  assert.equal(parseMoney('100.001'), null);
  assert.equal(parseMoney(''), null);
  assert.equal(parseMoney('Infinity'), null);
  assert.equal(parseMoney(-1), null);
});

test('date parser accepts real ISO calendar dates only', () => {
  assert.equal(parseDate('2024-02-29').toISOString(), '2024-02-29T00:00:00.000Z');
  assert.equal(parseDate('2025-02-29'), null);
  assert.equal(parseDate('2026-13-01'), null);
  assert.equal(parseDate('2026-10-05T00:00:00Z'), null);
});

test('month ranges are UTC-bounded and reject malformed query values', () => {
  const range = monthRange('2026-10');
  assert.equal(range.start.toISOString(), '2026-10-01T00:00:00.000Z');
  assert.equal(range.end.toISOString(), '2026-11-01T00:00:00.000Z');
  assert.equal(monthRange(['2026-10']), null);
  assert.equal(monthRange('2026-13'), null);
});

test('monthly recurrence preserves its original schedule day over short months', () => {
  const jan31 = new Date('2025-01-31T00:00:00.000Z');
  const feb28 = addPeriod(jan31, 'monthly', 31);
  const mar31 = addPeriod(feb28, 'monthly', 31);
  assert.equal(feb28.toISOString(), '2025-02-28T00:00:00.000Z');
  assert.equal(mar31.toISOString(), '2025-03-31T00:00:00.000Z');
  assert.equal(
    addPeriod(new Date('2024-01-31T00:00:00.000Z'), 'monthly', 31).toISOString(),
    '2024-02-29T00:00:00.000Z'
  );
});
