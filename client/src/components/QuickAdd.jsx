import { useState } from 'react';
import { LoaderCircle, Sparkles } from 'lucide-react';
import api from '../api';
import { errMsg } from '../lib/utils';
import { inputCls, btnPrimary, ErrorMsg } from './ui';

export default function QuickAdd({ onParsed }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/expenses/parse', { text });
      onParsed(data);
      setText('');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Sparkles size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
          <input
            className={`${inputCls} pl-9 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Try: "pizza 250 yesterday" or "auto 80"'
            maxLength={200}
            aria-label="Describe an expense"
          />
        </div>
        <button disabled={busy || !text.trim()} className={`${btnPrimary} inline-flex items-center justify-center gap-2`}>
          {busy && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
          {busy ? 'Reading...' : 'Add with AI'}
        </button>
      </div>
      <ErrorMsg>{error}</ErrorMsg>
    </form>
  );
}