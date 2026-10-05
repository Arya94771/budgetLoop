import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CircleDollarSign, Plus } from 'lucide-react';
import api from '../api';
import ExpenseModal from '../components/ExpenseModal';
import QuickAdd from '../components/QuickAdd';
import BudgetBar from '../components/BudgetBar';
import { CATEGORY_COLORS, inr, fmtDate, monthKey, monthLabel, errMsg } from '../lib/utils';
import { inputCls, btnPrimary, cardCls, ErrorMsg, SuccessMsg } from '../components/ui';

const tip = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 };

const Stat = ({ label, value, sub }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
    <p className="text-sm text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-bold">{value ?? '—'}</p>
    {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
  </div>
);

export default function Dashboard() {
  const [month, setMonth] = useState(monthKey());
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loadedMonth, setLoadedMonth] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);
  const [reload, setReload] = useState(0);

  // due recurring expenses ko expense bana do (sirf ek baar, page khulte hi)
  useEffect(() => {
    api
      .post('/recurring/process')
      .then(({ data }) => {
        if (data.created) setReload((r) => r + 1);
      })
      .catch((err) => setError(errMsg(err)));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/summary', { params: { month } }),
      api.get('/budgets', { params: { month } }),
      api.get('/expenses', { params: { limit: 5, sort: '-date' } }),
    ])
      .then(([s, b, r]) => {
        if (cancelled) return;
        setSummary(s.data && typeof s.data === 'object' ? s.data : null);
        setBudgets(Array.isArray(b.data) ? b.data.filter((item) => item && typeof item === 'object') : []);
        setRecent(Array.isArray(r.data?.data)
          ? r.data.data.filter((item) => item && typeof item === 'object')
          : []);
        setError('');
      })
      .catch((err) => !cancelled && setError(errMsg(err)))
      .finally(() => !cancelled && setLoadedMonth(month));
    return () => {
      cancelled = true;
    };
  }, [month, reload]);

  const loading = loadedMonth !== month;
  const byCategory = Array.isArray(summary?.byCategory)
    ? summary.byCategory.filter((item) => item && typeof item === 'object')
    : [];
  const top = byCategory[0];
  const count = byCategory.reduce((sum, category) => {
    const value = Number(category.count);
    return sum + (Number.isFinite(value) && value > 0 ? value : 0);
  }, 0);
  const totalValue = Number(summary?.total);
  const total = Number.isFinite(totalValue) ? totalValue : 0;
  const alerts = budgets.filter((budget) => budget?.status && budget.status !== 'ok');
  const trend = Array.isArray(summary?.trend)
    ? summary.trend.filter((item) => item && typeof item === 'object').map((item) => ({
      month: monthLabel(item?.month),
      total: Number.isFinite(Number(item?.total)) ? Number(item.total) : 0,
    })).filter((item) => item.month)
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <input
            type="month"
            className={`${inputCls} w-auto`}
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
          <button onClick={() => setModal({})} className={btnPrimary}>
            <Plus size={16} className="mr-1 inline" />
            Add
          </button>
        </div>
      </div>

      <div className={cardCls}>
        <QuickAdd onParsed={(draft) => setModal(draft)} />
      </div>

      <ErrorMsg>{error}</ErrorMsg>
      <SuccessMsg>{notice}</SuccessMsg>

      {loading && !summary ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Spent this month" value={inr(total)} />
              <Stat label="Top category" value={top ? top.category : '-'} sub={top ? inr(top.total) : ''} />
              <Stat label="Transactions" value={count} />
              <Stat label="Budget alerts" value={alerts.length} sub={alerts.length ? 'Check budgets below' : 'All good'} />
            </div>

            {total === 0 ? (
              <div className={`${cardCls} flex flex-col items-center gap-3 py-10 text-center`}>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                  <CircleDollarSign size={28} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-100">No expenses this month yet</h2>
                  <p className="mt-1 text-sm text-slate-400">Add your first expense to see your spending here.</p>
                </div>
                <button onClick={() => setModal({})} className={btnPrimary}>
                  <Plus size={16} className="mr-1 inline" />
                  Add an expense
                </button>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className={cardCls}>
                  <h2 className="mb-3 font-semibold">By category</h2>
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <div className="h-52 w-full sm:w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={byCategory} dataKey="total" nameKey="category" innerRadius={50} outerRadius={80} paddingAngle={2}>
                            {byCategory.map((category) => (
                              <Cell key={category.category} fill={CATEGORY_COLORS[category.category]} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => inr(v)} contentStyle={tip} itemStyle={{ color: '#e2e8f0' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="w-full space-y-1.5 text-sm sm:w-1/2">
                      {byCategory.map((category) => (
                        <li key={category.category} className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLORS[category.category] }} />
                            {category.category}
                          </span>
                          <span className="text-slate-400">{inr(category.total)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className={cardCls}>
                  <h2 className="mb-3 font-semibold">Last 6 months</h2>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trend}>
                        <CartesianGrid stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} width={55} tickFormatter={(v) => `₹${v}`} />
                        <Tooltip formatter={(v) => inr(v)} contentStyle={tip} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#94a3b8' }} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                        <Bar dataKey="total" fill="#34d399" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <div className={cardCls}>
                <h2 className="mb-3 font-semibold">Budgets</h2>
                {budgets.length === 0 ? (
                  <p className="text-sm text-slate-400">No budgets set. Add one from the Budgets page.</p>
                ) : (
                  <div className="space-y-4">
                    {budgets.map((b) => (
                      <BudgetBar key={b._id} budget={b} />
                    ))}
                  </div>
                )}
              </div>

              <div className={cardCls}>
                <h2 className="mb-3 font-semibold">Recent expenses</h2>
                {recent.length === 0 ? (
                  <p className="text-sm text-slate-400">Nothing yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-800">
                    {recent.map((e) => (
                      <li key={e._id} className="flex items-center justify-between py-2.5 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{e.title}</p>
                          <p className="text-xs text-slate-500">
                            {e.category} · {fmtDate(e.date)}
                          </p>
                        </div>
                        <span className="font-semibold">{inr(e.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
      )}

      {modal && (
        <ExpenseModal
          initial={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            setNotice('Expense saved successfully.');
            setReload((r) => r + 1);
          }}
        />
      )}
    </div>
  );
}