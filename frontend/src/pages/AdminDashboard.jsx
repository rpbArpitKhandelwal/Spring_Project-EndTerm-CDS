import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search, ChevronDown, X, AlertCircle } from 'lucide-react';
import { useApp, useToast } from '../App';
import { getAllComplaints, updateComplaintStatus, assignComplaint, addComment, getAllUsers } from '../api/api';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

const STATUSES = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

function Spinner() {
  return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>;
}

function MetricBar({ complaints }) {
  const count = s => complaints.filter(c => c.status === s).length;
  return (
    <div className="flex items-center gap-8 py-4 border-b border-gray-200 mb-6 text-sm">
      {[
        { label: 'Total',       value: complaints.length,      cls: 'text-gray-900' },
        { label: 'New',         value: count('NEW'),            cls: 'text-gray-600' },
        { label: 'Assigned',    value: count('ASSIGNED'),       cls: 'text-blue-600' },
        { label: 'In Progress', value: count('IN_PROGRESS'),    cls: 'text-amber-600' },
        { label: 'Resolved',    value: count('RESOLVED'),       cls: 'text-green-600' },
        { label: 'Closed',      value: count('CLOSED'),         cls: 'text-gray-500' },
      ].map(m => (
        <span key={m.label}>
          <span className={`font-semibold ${m.cls}`}>{m.value}</span>{' '}
          <span className="text-gray-400">{m.label}</span>
        </span>
      ))}
    </div>
  );
}

function ManageModal({ complaint, onClose, onDone, adminId, agents }) {
  const toast = useToast();
  const [status, setStatus] = useState(complaint.status);
  const [agentId, setAgentId] = useState(complaint.assignedAgent?.id || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      if (status !== complaint.status) await updateComplaintStatus(complaint.id, status);
      if (note.trim()) await addComment(complaint.id, { message: note, userId: adminId });
      if (agentId && agentId !== complaint.assignedAgent?.id)
        await assignComplaint(complaint.id, adminId, agentId);
      toast('Complaint updated', 'success');
      onDone(); onClose();
    } catch (e) { toast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <code className="text-xs text-gray-400 font-mono">{complaint.ticketId}</code>
            <h2 className="text-sm font-semibold text-gray-900 mt-0.5 truncate max-w-xs">{complaint.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={16} /></button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Assign to Agent</label>
            <select className="form-select" value={agentId} onChange={e => setAgentId(e.target.value)}>
              <option value="">No specific agent</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Internal note</label>
            <textarea className="form-textarea" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note visible to staff…" />
          </div>
        </div>

        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save changes'}</button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { currentUser, users } = useApp();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const agents = (users || []).filter(u => u.role === 'AGENT');

  const fetch = async () => {
    setLoading(true);
    try { const r = await getAllComplaints(); setComplaints(r.data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  if (!currentUser || currentUser.role !== 'ADMIN') return (
    <div className="p-8"><div className="alert-error"><AlertCircle size={15} />Admin access required. Switch to an ADMIN user.</div></div>
  );

  const filtered = complaints.filter(c => {
    const okStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const okSearch = !search || [c.title, c.ticketId, c.user?.name, c.category].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    return okStatus && okSearch;
  });

  return (
    <div className="p-8">
      {selected && <ManageModal complaint={selected} adminId={currentUser.id} agents={agents} onClose={() => setSelected(null)} onDone={fetch} />}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">All Complaints</h1>
          <p className="page-sub">Manage and resolve support tickets</p>
        </div>
        <button className="btn-secondary btn-sm" onClick={fetch}><RefreshCw size={13} />Refresh</button>
      </div>

      <MetricBar complaints={complaints} />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="form-input pl-8" placeholder="Search tickets…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ALL">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">No complaints match your filters.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Ticket</th>
                <th className="table-th">Title</th>
                <th className="table-th">User</th>
                <th className="table-th">Priority</th>
                <th className="table-th">Status</th>
                <th className="table-th">Agent</th>
                <th className="table-th">Date</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-td"><code className="text-xs font-mono text-gray-400">{c.ticketId}</code></td>
                  <td className="table-td font-medium max-w-48 truncate cursor-pointer hover:text-blue-600" onClick={() => navigate(`/complaint/${c.id}`)}>{c.title}</td>
                  <td className="table-td text-gray-500">{c.user?.name}</td>
                  <td className="table-td"><PriorityBadge priority={c.priority} /></td>
                  <td className="table-td"><StatusBadge status={c.status} /></td>
                  <td className="table-td text-gray-400 text-xs">{c.assignedAgent?.name || '—'}</td>
                  <td className="table-td text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                  <td className="table-td">
                    <button className="btn-secondary btn-sm" onClick={() => setSelected(c)}>Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
