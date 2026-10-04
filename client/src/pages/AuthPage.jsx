import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full rounded-lg bg-slate-800/60 border border-slate-700 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-400 transition';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl bg-slate-900 p-8 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Budget<span className="text-emerald-400">Loop</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{isLogin ? 'Welcome back' : 'Create your account'}</p>
        </div>

        {!isLogin && (
          <input className={input} name="name" placeholder="Name" value={form.name} onChange={onChange} required />
        )}
        <input className={input} type="email" name="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input className={input} type="password" name="password" placeholder="Password (min 6)" value={form.password} onChange={onChange} required minLength={6} />

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button disabled={busy} className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-semibold py-3 transition">
          {busy ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
        </button>

        <p className="text-sm text-slate-400 text-center">
          {isLogin ? 'No account? ' : 'Already have one? '}
          <Link className="text-emerald-400 hover:underline" to={isLogin ? '/register' : '/login'}>
            {isLogin ? 'Register' : 'Login'}
          </Link>
        </p>
      </form>
    </div>
  );
}