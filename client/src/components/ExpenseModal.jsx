import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../api';
import { CATEGORIES, toInputDate, errMsg } from '../lib/utils';
import { inputCls, btnPrimary, btnGhost, ErrorMsg } from './ui';

export default function ExpenseModal({ initial, onClose, onSaved }) {
  const editing = Boolean(initial?._id);
  const [form, setForm] = useState({
    title: initial?.title || '',
    amount: initial?.amount ?? '',
    category: initial?.category || 'Food',
    date: toInputDate(initial?.date || new Date()),
    note: initial?.note || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) await api.put(`/expenses/${initial._id}`, payload);
      else await api.post('/expenses', payload);
      onSaved();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editing ? 'Edit expense' : 'Add expense'}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <input className={inputCls} name="title" placeholder="Title" value={form.title} onChange={onChange} required maxLength={100} />
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} type="number" name="amount" placeholder="Amount" min="0.01" step="0.01" value={form.amount} onChange={onChange} required />
          <input className={inputCls} type="date" name="date" value={form.date} onChange={onChange} required />
        </div>
        <select className={inputCls} name="category" value={form.category} onChange={onChange}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input className={inputCls} name="note" placeholder="Note (optional)" value={form.note} onChange={onChange} maxLength={300} />

        <ErrorMsg>{error}</ErrorMsg>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          <button disabled={busy} className={btnPrimary}>{busy ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}