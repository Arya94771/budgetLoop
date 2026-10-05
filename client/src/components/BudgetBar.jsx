import { inr } from '../lib/utils';

const bar = { ok: 'bg-emerald-500', warning: 'bg-amber-400', exceeded: 'bg-rose-500' };
const text = { ok: 'text-slate-500', warning: 'text-amber-400', exceeded: 'text-rose-400' };
const note = { ok: '', warning: ' · nearing limit', exceeded: ' · limit crossed' };

export default function BudgetBar({ budget }) {
  const { category, limit, spent, percent, status } = budget;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{category}</span>
        <span className="text-slate-400">
          {inr(spent)} / {inr(limit)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${bar[status]}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <p className={`mt-1 text-xs ${text[status]}`}>
        {percent}% used{note[status]}
      </p>
    </div>
  );
}