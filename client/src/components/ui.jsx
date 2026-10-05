export const inputCls =
  'w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-400 transition [color-scheme:dark]';
export const btnPrimary =
  'rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60';
export const btnGhost =
  'rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-40';
export const cardCls = 'rounded-2xl border border-slate-800 bg-slate-900 p-5';

export const ErrorMsg = ({ children }) =>
  children ? <p className="text-sm text-rose-400">{children}</p> : null;