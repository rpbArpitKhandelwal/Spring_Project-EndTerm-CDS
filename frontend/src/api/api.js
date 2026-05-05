import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Users ──────────────────────────────────────────────────
export const createUser = (data) => api.post('/users', data);
export const getAllUsers = () => api.get('/users');
export const getUserById = (id) => api.get(`/users/${id}`);

// ── Complaints ─────────────────────────────────────────────
export const createComplaint = (data) => api.post('/complaints', data);
export const getAllComplaints = () => api.get('/complaints');
export const getComplaintById = (id) => api.get(`/complaints/${id}`);
export const getComplaintsByUser = (userId) => api.get(`/complaints/user/${userId}`);
export const getComplaintsByStatus = (status) => api.get(`/complaints/status/${status}`);
export const getComplaintByTicket = (ticketId) => api.get(`/complaints/ticket/${ticketId}`);
export const getComplaintsByAgent = (agentId) => api.get(`/complaints/agent/${agentId}`);
export const getUnassignedComplaints = () => api.get('/complaints/unassigned');
export const getActiveComplaints = () => api.get('/complaints/active');
export const updateComplaintStatus = (id, status) =>
  api.put(`/complaints/${id}/status`, { status });
export const assignComplaint = (id, adminId, agentId) =>
  api.put(`/complaints/${id}/assign?adminId=${adminId}${agentId ? `&agentId=${agentId}` : ''}`);
export const claimComplaint = (id, agentId) =>
  api.put(`/complaints/${id}/claim?agentId=${agentId}`);

// ── Comments ───────────────────────────────────────────────
export const addComment = (complaintId, data) =>
  api.post(`/complaints/${complaintId}/comments`, data);
export const getComments = (complaintId) =>
  api.get(`/complaints/${complaintId}/comments`);

// ── Notifications ──────────────────────────────────────────
export const getNotifications = (userId) =>
  api.get(`/notifications/user/${userId}`);
export const getUnreadCount = (userId) =>
  api.get(`/notifications/user/${userId}/unread-count`);
export const markRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllRead = (userId) => api.put(`/notifications/user/${userId}/read-all`);

// ── Attachments ────────────────────────────────────────────
export const uploadAttachment = (complaintId, userId, file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/complaints/${complaintId}/attachments?userId=${userId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getAttachments = (complaintId) =>
  api.get(`/complaints/${complaintId}/attachments`);
export const getDownloadUrl = (attachmentId) =>
  `http://localhost:8081/api/attachments/${attachmentId}/download`;

export default api;
