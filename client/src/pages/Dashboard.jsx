import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hi, {user.name}</h1>
        <button onClick={logout} className="text-sm text-slate-400 hover:text-white">Logout</button>
      </div>
    </div>
  );
}
export default function Dashboard() {
  return <p className="text-slate-400">Dashboard coming up...</p>;
}