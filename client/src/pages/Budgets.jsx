import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../api';
import BudgetBar from '../components/BudgetBar';
import { CATEGORIES, monthKey, errMsg } from '../lib/utils';
import { inputCls, btnPrimary, cardCls, ErrorMsg } from '../components/ui';

export default function Budgets() {
  const [month, setMonth] = useState(monthKey());
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({ category: 'Food', limit: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/budgets', { params: { month } })
      .then((res) => {
        if (!cancelled) {
          setBudgets(res.data);
          setError('');
        }
      })
      .catch((err) => !cancelled && setError(errMsg(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month, reload]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/budgets', { category: form.category, limit: Number(form.limit) });
      setForm({ ...form, limit: '' });
      setReload((r) => r + 1);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      setReload((r) => r + 1);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <input type="month" className={`${inputCls} w-auto`} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
      </div>

      <form onSubmit={save} className={`${cardCls} flex flex-col gap-3 sm:flex-row`}>
        <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="All">All (overall monthly budget)</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input className={inputCls} type="number" min="1" placeholder="Monthly limit (₹)" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} required />
        <button disabled={busy} className={`${btnPrimary} whitespace-nowrap`}>{busy ? 'Saving...' : 'Set budget'}</button>
      </form>
      <p className="-mt-2 text-xs text-slate-500">Same category dobara set karoge toh purana limit update ho jayega.</p>

      <ErrorMsg>{error}</ErrorMsg>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : budgets.length === 0 ? (
        <div className={`${cardCls} text-center text-slate-400`}>No budgets yet.</div>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => (
            <div key={b._id} className={`${cardCls} flex items-center gap-4`}>
              <div className="flex-1">
                <BudgetBar budget={b} />
              </div>
              <button onClick={() => remove(b._id)} className="p-1.5 text-slate-500 hover:text-rose-400" title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}