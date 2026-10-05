import { useEffect, useState } from 'react';
import { Trash2, Pause, Play } from 'lucide-react';
import api from '../api';
import { CATEGORIES, inr, fmtDate, toInputDate, errMsg } from '../lib/utils';
import { inputCls, btnPrimary, cardCls, ErrorMsg } from '../components/ui';

const empty = () => ({ title: '', amount: '', category: 'Bills', frequency: 'monthly', startDate: toInputDate() });

export default function Recurring() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/recurring')
      .then((res) => {
        if (!cancelled) {
          setItems(res.data);
          setError('');
        }
      })
      .catch((err) => !cancelled && setError(errMsg(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/recurring', { ...form, amount: Number(form.amount) });
      await api.post('/recurring/process').catch(() => {});
      setForm(empty());
      setReload((r) => r + 1);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (item) => {
    try {
      await api.patch(`/recurring/${item._id}`, { active: !item.active });
      setReload((r) => r + 1);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this recurring expense? Already created expenses stay.')) return;
    try {
      await api.delete(`/recurring/${id}`);
      setReload((r) => r + 1);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Recurring</h1>

      <form onSubmit={create} className={`${cardCls} grid gap-3 sm:grid-cols-2 lg:grid-cols-6`}>
        <input className={`${inputCls} lg:col-span-2`} name="title" placeholder="Title (e.g. Netflix)" value={form.title} onChange={onChange} required />
        <input className={inputCls} type="number" name="amount" placeholder="Amount" min="0.01" step="0.01" value={form.amount} onChange={onChange} required />
        <select className={inputCls} name="category" value={form.category} onChange={onChange}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className={inputCls} name="frequency" value={form.frequency} onChange={onChange}>
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
        </select>
        <input className={inputCls} type="date" name="startDate" value={form.startDate} onChange={onChange} required />
        <button disabled={busy} className={`${btnPrimary} sm:col-span-2 lg:col-span-6`}>{busy ? 'Saving...' : 'Add recurring expense'}</button>
      </form>
      <p className="-mt-2 text-xs text-slate-500">Due hone par ye apne aap expenses ban jaate hain (dashboard khulte hi).</p>

      <ErrorMsg>{error}</ErrorMsg>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : items.length === 0 ? (
        <div className={`${cardCls} text-center text-slate-400`}>No recurring expenses yet.</div>
      ) : (
        <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900">
          {items.map((r) => (
            <div key={r._id} className={`flex items-center gap-3 px-4 py-3 ${r.active ? '' : 'opacity-50'}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.title}</p>
                <p className="text-xs text-slate-500">
                  {r.category} · {r.frequency} · next {fmtDate(r.nextDate)}
                  {r.active ? '' : ' · paused'}
                </p>
              </div>
              <span className="font-semibold">{inr(r.amount)}</span>
              <button onClick={() => toggle(r)} className="p-1.5 text-slate-500 hover:text-emerald-400" title={r.active ? 'Pause' : 'Resume'}>
                {r.active ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button onClick={() => remove(r._id)} className="p-1.5 text-slate-500 hover:text-rose-400" title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}