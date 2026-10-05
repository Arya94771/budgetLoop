import { useEffect, useState } from 'react';
import { Plus, Download, Pencil, Trash2, Search } from 'lucide-react';
import api from '../api';
import ExpenseModal from '../components/ExpenseModal';
import { CATEGORIES, CATEGORY_COLORS, inr, fmtDate, errMsg } from '../lib/utils';
import { inputCls, btnPrimary, btnGhost, cardCls, ErrorMsg } from '../components/ui';

export default function Expenses() {
  const [filters, setFilters] = useState({ search: '', category: '', from: '', to: '', sort: '-date' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [reload, setReload] = useState(0);

  // search ko debounce karte hain taaki har key pe API call na jaye
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(filters.search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = { page, limit: 10, sort: filters.sort };
    if (search) params.search = search;
    if (filters.category) params.category = filters.category;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    api
      .get('/expenses', { params })
      .then((res) => {
        if (!cancelled) {
          setResult(res.data);
          setError('');
        }
      })
      .catch((err) => !cancelled && setError(errMsg(err)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [page, search, filters.category, filters.from, filters.to, filters.sort, reload]);

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    if (key !== 'search') setPage(1);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      if (result.data.length === 1 && page > 1) setPage(page - 1);
      else setReload((r) => r + 1);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const exportCsv = async () => {
    try {
      const res = await api.get('/expenses/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expenses.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <div className="flex gap-2">
          <button onClick={exportCsv} className={btnGhost}>
            <Download size={16} className="mr-1.5 inline" />
            Export CSV
          </button>
          <button onClick={() => setModal({})} className={btnPrimary}>
            <Plus size={16} className="mr-1 inline" />
            Add
          </button>
        </div>
      </div>

   
   <div className={cardCls}>
  <QuickAdd onParsed={(draft) => setModal(draft)} />
</div>

      <div className={`${cardCls} grid gap-3 sm:grid-cols-2 lg:grid-cols-6`}>
        <div className="relative lg:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className={`${inputCls} pl-9`} placeholder="Search title..." value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
        </div>
        <select className={inputCls} value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input className={inputCls} type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} />
        <input className={inputCls} type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} />
        <select className={inputCls} value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
          <option value="-date">Newest first</option>
          <option value="date">Oldest first</option>
          <option value="-amount">Highest amount</option>
          <option value="amount">Lowest amount</option>
        </select>
      </div>

      <ErrorMsg>{error}</ErrorMsg>

      <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900">
        {loading ? (
          <p className="p-6 text-slate-400">Loading...</p>
        ) : result.data.length === 0 ? (
          <p className="p-6 text-slate-400">No expenses found.</p>
        ) : (
          result.data.map((e) => (
            <div key={e._id} className="flex items-center gap-3 px-4 py-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CATEGORY_COLORS[e.category] }} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {e.category} · {fmtDate(e.date)}
                  {e.note ? ` · ${e.note}` : ''}
                </p>
              </div>
              <span className="font-semibold">{inr(e.amount)}</span>
              <button onClick={() => setModal(e)} className="p-1.5 text-slate-500 hover:text-emerald-400" title="Edit">
                <Pencil size={16} />
              </button>
              <button onClick={() => remove(e._id)} className="p-1.5 text-slate-500 hover:text-rose-400" title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{result.total} expenses</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={btnGhost}>Prev</button>
          <span>Page {page} / {result.totalPages || 1}</span>
          <button disabled={page >= result.totalPages} onClick={() => setPage(page + 1)} className={btnGhost}>Next</button>
        </div>
      </div>

      {modal && (
        <ExpenseModal
          initial={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            setReload((r) => r + 1);
          }}
        />
      )}
    </div>
  );
}