import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp, useToast } from '../App';
import { getComplaintsByAgent, getUnassignedComplaints, updateComplaintStatus, claimComplaint, addComment } from '../api/api';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

const AGENT_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

function Spinner() {
  return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>;
}

function UpdateModal({ complaint, agentId, onClose, onDone }) {
  const toast = useToast();
  const [status, setStatus] = useState(complaint.status);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      if (status !== complaint.status) await updateComplaintStatus(complaint.id, status);
      if (note.trim()) await addComment(complaint.id, { message: note, userId: agentId });
      toast('Ticket updated', 'success');
      onDone(); onClose();
    } catch (e) { toast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Update Ticket</h2>
        <code className="text-xs text-gray-400 font-mono mb-4 block">{complaint.ticketId}</code>
        <div className="flex flex-col gap-4">
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              {AGENT_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Agent note</label>
            <textarea className="form-textarea" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add an internal note…" />
          </div>
        </div>
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AgentDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [mine, setMine] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('mine');
  const [modal, setModal] = useState(null);
  const [claiming, setClaiming] = useState(null);

  const fetch = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([getComplaintsByAgent(currentUser.id), getUnassignedComplaints()]);
      setMine(r1.data); setQueue(r2.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [currentUser]);

  const claim = async id => {
    setClaiming(id);
    try { await claimComplaint(id, currentUser.id); toast('Ticket claimed', 'success'); fetch(); }
    catch (e) { toast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setClaiming(null); }
  };

  if (!currentUser || currentUser.role !== 'AGENT') return (
    <div className="p-8"><div className="alert-error"><AlertCircle size={15} />Agent access required.</div></div>
  );

  const rows = tab === 'mine' ? mine : queue;

  return (
    <div className="p-8">
      {modal && <UpdateModal complaint={modal} agentId={currentUser.id} onClose={() => setModal(null)} onDone={fetch} />}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Task Queue</h1>
          <p className="page-sub">Your assigned tickets and open queue</p>
        </div>
        <button className="btn-secondary btn-sm" onClick={fetch}><RefreshCw size={13} />Refresh</button>
      </div>

      {/* Stats row */}
      <div className="flex gap-8 text-sm mb-6 pb-5 border-b border-gray-200">
        <span><span className="font-semibold text-gray-900">{mine.length}</span> <span className="text-gray-400">Assigned to me</span></span>
        <span><span className="font-semibold text-amber-600">{mine.filter(c => c.status === 'IN_PROGRESS').length}</span> <span className="text-gray-400">In progress</span></span>
        <span><span className="font-semibold text-green-600">{mine.filter(c => c.status === 'RESOLVED').length}</span> <span className="text-gray-400">Resolved</span></span>
        <span><span className="font-semibold text-blue-600">{queue.length}</span> <span className="text-gray-400">Open queue</span></span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {[['mine', `My tickets (${mine.length})`], ['queue', `Open queue (${queue.length})`]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : rows.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <CheckCircle size={32} className="text-green-400 mb-3" />
            <p className="text-sm font-medium text-gray-700">{tab === 'mine' ? 'No tickets assigned to you' : 'No open tickets in queue'}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="table-th">Ticket</th>
                <th className="table-th">Title</th>
                <th className="table-th">User</th>
                <th className="table-th">Priority</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-td"><code className="text-xs font-mono text-gray-400">{c.ticketId}</code></td>
                  <td className="table-td font-medium max-w-48 truncate cursor-pointer hover:text-blue-600" onClick={() => navigate(`/complaint/${c.id}`)}>{c.title}</td>
                  <td className="table-td text-gray-500">{c.user?.name}</td>
                  <td className="table-td"><PriorityBadge priority={c.priority} /></td>
                  <td className="table-td"><StatusBadge status={c.status} /></td>
                  <td className="table-td text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      {tab === 'queue'
                        ? <button className="btn-primary btn-sm" disabled={claiming === c.id} onClick={() => claim(c.id)}>{claiming === c.id ? '…' : 'Claim'}</button>
                        : <button className="btn-secondary btn-sm" onClick={() => setModal(c)}>Update</button>
                      }
                    </div>
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
