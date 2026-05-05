import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { useApp, useToast } from '../App';
import { getComplaintsByUser, createComplaint } from '../api/api';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

const CATEGORIES = ['Authentication', 'Billing', 'Performance', 'Bug', 'Feature Request', 'Other'];

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
        <AlertCircle size={22} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">No complaints yet</h3>
      <p className="text-sm text-gray-500 mb-4">Submit your first ticket and we'll help you resolve it.</p>
      <button className="btn-primary" onClick={onNew}><Plus size={14} /> New complaint</button>
    </div>
  );
}

function CreateForm({ userId, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: '', description: '', category: '', priority: 'MEDIUM', userId });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await createComplaint({ ...form, userId });
      toast(`Complaint submitted — Ticket ${res.data.ticketId}`, 'success');
      onDone();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to submit', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-xl">
      <h1 className="page-title mb-1">New Complaint</h1>
      <p className="page-sub mb-6">Fill in the details and we'll create a support ticket.</p>
      <div className="card p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="form-label">Title *</label>
            <input className="form-input" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brief description of the issue" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Category *</label>
              <select className="form-select" required value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Priority *</label>
              <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" rows={4} required value={form.description}
              onChange={e => set('description', e.target.value)} placeholder="Describe the issue in detail…" />
          </div>
          <div className="flex gap-3 pt-1">
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit complaint'}</button>
            <button className="btn-secondary" type="button" onClick={onDone}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserDashboard({ showCreate }) {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(showCreate ? 'new' : 'list');

  const fetch = async () => {
    if (!currentUser) return;
    setLoading(true);
    try { const r = await getComplaintsByUser(currentUser.id); setComplaints(r.data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [currentUser]);

  if (!currentUser) return (
    <div className="p-8"><div className="alert-info"><AlertCircle size={15} />Select a user from the sidebar to continue.</div></div>
  );

  if (tab === 'new') return <CreateForm userId={currentUser.id} onDone={() => { setTab('list'); fetch(); }} />;

  const total = complaints.length;
  const inProgress = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolved = complaints.filter(c => c.status === 'RESOLVED').length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-sub">Track and manage your support tickets</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" onClick={fetch}><RefreshCw size={13} /></button>
          <button className="btn-primary" onClick={() => setTab('new')}><Plus size={14} />New complaint</button>
        </div>
      </div>

      {/* Inline metrics */}
      {total > 0 && (
        <div className="flex items-center gap-8 mb-6 pb-5 border-b border-gray-200 text-sm">
          <span><span className="font-semibold text-gray-900">{total}</span> <span className="text-gray-500">Total</span></span>
          <span><span className="font-semibold text-amber-600">{inProgress}</span> <span className="text-gray-500">In progress</span></span>
          <span><span className="font-semibold text-green-600">{resolved}</span> <span className="text-gray-500">Resolved</span></span>
          <span><span className="font-semibold text-gray-900">{complaints.filter(c => c.status === 'NEW').length}</span> <span className="text-gray-500">New</span></span>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? <Spinner /> : complaints.length === 0 ? (
          <EmptyState onNew={() => setTab('new')} />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Ticket</th>
                <th className="table-th">Title</th>
                <th className="table-th">Category</th>
                <th className="table-th">Priority</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(c => (
                <tr key={c.id} className="table-row" onClick={() => navigate(`/complaint/${c.id}`)}>
                  <td className="table-td"><code className="text-xs text-gray-500 font-mono">{c.ticketId}</code></td>
                  <td className="table-td font-medium max-w-xs truncate">{c.title}</td>
                  <td className="table-td text-gray-500">{c.category}</td>
                  <td className="table-td"><PriorityBadge priority={c.priority} /></td>
                  <td className="table-td"><StatusBadge status={c.status} /></td>
                  <td className="table-td text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
