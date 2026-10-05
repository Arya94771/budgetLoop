import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Recurring = lazy(() => import('./pages/Recurring'));

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-slate-400">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-slate-400">Loading...</div>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="p-10 text-slate-400">Loading...</div>}>
          <Routes>
            <Route path="/login" element={<GuestOnly><AuthPage mode="login" /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><AuthPage mode="register" /></GuestOnly>} />
            <Route element={<Protected><Layout /></Protected>}>
              <Route index element={<Dashboard />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="budgets" element={<Budgets />} />
              <Route path="recurring" element={<Recurring />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
