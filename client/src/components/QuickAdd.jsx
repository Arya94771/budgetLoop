import { useState } from 'react';
import { Sparkles } from 'lucide-react';
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
            className={`${inputCls} pl-9`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Try: "pizza 250 yesterday" or "auto 80"'
            maxLength={200}
          />
        </div>
        <button disabled={busy} className={btnPrimary}>{busy ? 'Reading...' : 'Add with AI'}</button>
      </div>
      <ErrorMsg>{error}</ErrorMsg>
    </form>
  );
}