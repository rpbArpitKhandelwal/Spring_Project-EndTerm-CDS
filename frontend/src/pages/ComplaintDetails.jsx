import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Paperclip, Send, AlertCircle } from 'lucide-react';
import { useApp, useToast } from '../App';
import {
  getComplaintById, getComments, addComment, updateComplaintStatus,
  assignComplaint, getAttachments, uploadAttachment, getDownloadUrl,
} from '../api/api';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

const STATUSES = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const COMMENT_STYLES = {
  SYSTEM_LOG:   'text-gray-400 text-xs italic pl-6 border-l-2 border-gray-100',
  AGENT_NOTE:   '',
  USER_COMMENT: '',
};

function Spinner() {
  return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>;
}

function CommentThread({ complaintId }) {
  const { currentUser } = useApp();
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const r = await getComments(complaintId); setComments(r.data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [complaintId]);

  const post = async e => {
    e.preventDefault();
    if (!text.trim() || !currentUser) return;
    setPosting(true);
    try { await addComment(complaintId, { message: text, userId: currentUser.id }); setText(''); fetch(); }
    catch (err) { toast(err.response?.data?.message || 'Failed', 'error'); }
    finally { setPosting(false); }
  };

  const avatarColor = role => role === 'ADMIN' ? 'bg-purple-600' : role === 'AGENT' ? 'bg-orange-500' : 'bg-blue-500';

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity</h3>
      {loading ? <Spinner /> : (
        <div className="flex flex-col gap-4 mb-6">
          {comments.length === 0 && <p className="text-sm text-gray-400">No activity yet.</p>}
          {comments.map(c => {
            if (c.commentType === 'SYSTEM_LOG') return (
              <div key={c.id} className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-xs text-gray-400 whitespace-nowrap">{c.message}</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
            );
            return (
              <div key={c.id} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(c.user?.role)}`}>
                  {c.user?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{c.user?.name || 'Unknown'}</span>
                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    {c.commentType === 'AGENT_NOTE' && (
                      <span className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-medium">Agent note</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{c.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {currentUser && (
        <form onSubmit={post} className="flex items-start gap-3 pt-4 border-t border-gray-100">
          <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${
            currentUser.role === 'ADMIN' ? 'bg-purple-600' : currentUser.role === 'AGENT' ? 'bg-orange-500' : 'bg-blue-500'}`}>
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1">
            <textarea className="form-textarea w-full" rows={2} value={text}
              onChange={e => setText(e.target.value)} placeholder="Add a comment…" />
            <button className="btn-primary btn-sm mt-2" type="submit" disabled={posting || !text.trim()}>
              <Send size={12} />{posting ? 'Posting…' : 'Comment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function AttachmentPanel({ complaintId }) {
  const { currentUser } = useApp();
  const toast = useToast();
  const [list, setList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetch = async () => {
    try { const r = await getAttachments(complaintId); setList(r.data); } catch {}
  };

  useEffect(() => { fetch(); }, [complaintId]);

  const upload = async e => {
    const file = e.target.files[0]; if (!file || !currentUser) return;
    setUploading(true);
    try { await uploadAttachment(complaintId, currentUser.id, file); toast('File uploaded', 'success'); fetch(); }
    catch (err) { toast(err.response?.data || 'Upload failed', 'error'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const size = b => b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`;
  const icon = t => t?.startsWith('image/') ? '🖼' : '📄';

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Attachments</h3>
      {list.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {list.map(a => (
            <a key={a.id} href={getDownloadUrl(a.id)} target="_blank" rel="noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-sm text-gray-700">
              <span>{icon(a.fileType)}</span>
              <span className="flex-1 truncate text-xs font-medium">{a.fileName}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{size(a.fileSize)}</span>
            </a>
          ))}
        </div>
      )}
      {currentUser && (
        <label className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 cursor-pointer border border-dashed border-gray-300 rounded-md px-3 py-2 hover:border-gray-400 transition-colors">
          <Paperclip size={13} />{uploading ? 'Uploading…' : 'Attach file (image or PDF)'}
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={upload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, users } = useApp();
  const toast = useToast();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [agentId, setAgentId] = useState('');
  const [saving, setSaving] = useState(false);

  const agents = (users || []).filter(u => u.role === 'AGENT');

  const fetch = async () => {
    setLoading(true);
    try { const r = await getComplaintById(id); setComplaint(r.data); setStatus(r.data.status); setAgentId(r.data.assignedAgent?.id || ''); }
    catch { toast('Complaint not found', 'error'); navigate('/'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [id]);

  const saveStatus = async () => {
    setSaving(true);
    try {
      if (status !== complaint.status) await updateComplaintStatus(complaint.id, status);
      if (agentId && parseInt(agentId) !== complaint.assignedAgent?.id)
        await assignComplaint(complaint.id, currentUser.id, agentId);
      toast('Changes saved', 'success');
      fetch();
    } catch (e) { toast(e.response?.data?.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-8"><Spinner /></div>;
  if (!complaint) return null;

  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'AGENT';

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Title row */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <code className="text-xs font-mono text-gray-400 mb-1 block">{complaint.ticketId}</code>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{complaint.title}</h1>
          <div className="flex items-center gap-3">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <span className="text-sm text-gray-400">{complaint.category}</span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main: description + activity */}
        <div className="col-span-2 flex flex-col gap-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
          </div>
          <div className="card p-5">
            <CommentThread complaintId={complaint.id} />
          </div>
        </div>

        {/* Sidebar: metadata + controls */}
        <div className="flex flex-col gap-4">
          {/* Metadata */}
          <div className="card p-4 flex flex-col gap-3 text-sm">
            {[
              { label: 'Submitted by', value: complaint.user?.name },
              { label: 'Email', value: complaint.user?.email },
              { label: 'Created', value: new Date(complaint.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
              { label: 'Last updated', value: new Date(complaint.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
              { label: 'Agent', value: complaint.assignedAgent?.name || 'Unassigned' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">{label}</span>
                <span className="text-gray-900 text-xs font-medium truncate max-w-32">{value}</span>
              </div>
            ))}
          </div>

          {/* Staff controls */}
          {isStaff && (
            <div className="card p-4 flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Controls</h3>
              <div>
                <label className="form-label">Status</label>
                <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              {currentUser?.role === 'ADMIN' && (
                <div>
                  <label className="form-label">Assign agent</label>
                  <select className="form-select" value={agentId} onChange={e => setAgentId(e.target.value)}>
                    <option value="">Unassigned</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <button className="btn-primary justify-center w-full" onClick={saveStatus} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}

          {/* Attachments */}
          <div className="card p-4">
            <AttachmentPanel complaintId={complaint.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
