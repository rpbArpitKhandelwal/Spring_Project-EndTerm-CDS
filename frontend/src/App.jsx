import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  Inbox, Plus, LayoutDashboard, Wrench, UserCheck, UserPlus, ChevronRight, X, CheckCircle, AlertCircle
} from 'lucide-react';
import './index.css';
import { getAllUsers, createUser } from './api/api';
import NotificationBell from './components/NotificationBell';

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import ComplaintDetails from './pages/ComplaintDetails';

// ── Toast System ──────────────────────────────────────────
function ToastContainer({ toasts, remove }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium min-w-64 max-w-sm
            ${t.type === 'success' ? 'bg-white border-green-200 text-green-800' :
              t.type === 'error'   ? 'bg-white border-red-200 text-red-800' :
                                     'bg-white border-blue-200 text-blue-800'}`}>
          {t.type === 'success' ? <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" /> :
           t.type === 'error'   ? <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" /> :
                                  <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600 ml-1"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────
function Sidebar({ currentUser, setCurrentUser, users }) {
  const navigate = useNavigate();
  const role = currentUser?.role;

  const link = (to, icon, label, end = false) => (
    <NavLink to={to} end={end}
      className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
      {icon} <span>{label}</span>
    </NavLink>
  );

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <span className="text-sm font-bold text-gray-900 tracking-tight">ComplaintMS</span>
        <span className="ml-1 text-xs text-gray-400 font-normal">Support Portal</span>
      </div>

      {/* User selector */}
      <div className="px-3 py-3 border-b border-gray-100">
        <label className="text-xs text-gray-400 font-medium px-1 mb-1 block">Active user</label>
        <select className="form-select text-xs py-1.5"
          value={currentUser?.id || ''}
          onChange={e => {
            const u = users.find(x => x.id === parseInt(e.target.value));
            setCurrentUser(u || null);
            navigate('/');
          }}>
          <option value="">— select user —</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
        </select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {role === 'USER' && <>
          {link('/', <Inbox size={15} />, 'My Complaints', true)}
          {link('/create', <Plus size={15} />, 'New Complaint')}
        </>}
        {role === 'AGENT' && link('/agent', <UserCheck size={15} />, 'Task Queue')}
        {role === 'ADMIN' && link('/admin', <LayoutDashboard size={15} />, 'All Complaints')}

        <div className="mt-3 pt-3 border-t border-gray-100">
          {link('/register', <UserPlus size={15} />, 'Create Account')}
        </div>
      </nav>

      {/* Current user pill */}
      {currentUser && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 mb-0.5">Signed in as</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-400">{currentUser.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ── Top Bar ───────────────────────────────────────────────
function TopBar({ currentUser }) {
  return (
    <header className="fixed top-0 left-60 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 z-30">
      <span className="text-sm text-gray-400 flex-1">
        {currentUser ? `${currentUser.role === 'ADMIN' ? 'Admin Dashboard' : currentUser.role === 'AGENT' ? 'Agent Portal' : 'My Complaints'}` : 'Complaint Management'}
      </span>
      {currentUser && <NotificationBell userId={currentUser.id} />}
      {currentUser && (
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <span className="text-sm font-medium text-gray-700">{currentUser.name.split(' ')[0]}</span>
        </div>
      )}
    </header>
  );
}

// ── Register Page ─────────────────────────────────────────
function RegisterPage({ onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'USER' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const onSubmit = async e => {
    e.preventDefault(); setLoading(true); setMsg(null);
    try {
      const res = await createUser(form);
      toast('Account created successfully!', 'success');
      onCreated(res.data);
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      const detail = err.response?.data?.message ||
        (err.message === 'Network Error' ? 'Cannot reach backend — is Spring Boot running on port 8081?' : err.message);
      setMsg(detail);
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-md">
      <h1 className="page-title mb-1">Create Account</h1>
      <p className="page-sub mb-6">Register as USER, AGENT, or ADMIN</p>
      <div className="card p-6">
        {msg && <div className="alert-error mb-4"><AlertCircle size={15} />{msg}</div>}
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="form-label">Full name</label>
            <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Aman Kushwah" />
          </div>
          <div>
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div>
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="USER">User — Submit complaints</option>
              <option value="AGENT">Agent — Handle support tickets</option>
              <option value="ADMIN">Admin — Manage everything</option>
            </select>
          </div>
          <button className="btn-primary justify-center" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [toasts, setToasts] = useState([]);

  const toast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  const refreshUsers = () => getAllUsers().then(r => setUsers(r.data)).catch(() => {});

  useEffect(() => {
    getAllUsers().then(r => {
      setUsers(r.data);
      if (r.data.length > 0) setCurrentUser(r.data[0]);
    }).catch(() => {});
  }, []);

  const defaultPage = () => {
    if (currentUser?.role === 'ADMIN') return <AdminDashboard />;
    if (currentUser?.role === 'AGENT') return <AgentDashboard />;
    return <UserDashboard />;
  };

  return (
    <ToastContext.Provider value={toast}>
      <AppContext.Provider value={{ currentUser, users }}>
        <BrowserRouter>
          <div className="min-h-screen bg-white">
            <Sidebar currentUser={currentUser} setCurrentUser={setCurrentUser} users={users} />
            <TopBar currentUser={currentUser} />
            <main className="ml-60 pt-14 min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={defaultPage()} />
                <Route path="/create" element={<UserDashboard showCreate />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/agent" element={<AgentDashboard />} />
                <Route path="/complaint/:id" element={<ComplaintDetails />} />
                <Route path="/register" element={<RegisterPage onCreated={u => { refreshUsers(); setCurrentUser(u); }} />} />
              </Routes>
            </main>
          </div>
          <ToastContainer toasts={toasts} remove={id => setToasts(p => p.filter(t => t.id !== id))} />
        </BrowserRouter>
      </AppContext.Provider>
    </ToastContext.Provider>
  );
}
