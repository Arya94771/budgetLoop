import { inr } from '../lib/utils';

const bar = { ok: 'bg-emerald-500', warning: 'bg-amber-400', exceeded: 'bg-rose-500' };
const text = { ok: 'text-slate-500', warning: 'text-amber-400', exceeded: 'text-rose-400' };
const note = { ok: '', warning: ' · nearing limit', exceeded: ' · limit crossed' };

export default function BudgetBar({ budget }) {
  const { category, limit, spent, percent, status } = budget || {};
  const safeLimit = Number(limit);
  const safeSpent = Number(spent);
  const safePercent = Number(percent);
  const variant = Object.hasOwn(bar, status) ? status : 'ok';
  const displayedPercent = Number.isFinite(safePercent) ? safePercent : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{category || 'Budget'}</span>
        <span className="text-slate-400">
          {inr(Number.isFinite(safeSpent) ? safeSpent : 0)} / {inr(Number.isFinite(safeLimit) ? safeLimit : 0)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${bar[variant]}`} style={{ width: `${Math.min(Math.max(displayedPercent, 0), 100)}%` }} />
      </div>
      <p className={`mt-1 text-xs ${text[variant]}`}>
        {displayedPercent}% used{note[variant]}
      </p>
    </div>
  );
}