import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { getNotifications, markRead, markAllRead } from '../api/api';

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_COLORS = { SUCCESS: 'text-green-500', WARNING: 'text-amber-500', ERROR: 'text-red-500', INFO: 'text-blue-500' };

export default function NotificationBell({ userId }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  const fetch = async () => {
    if (!userId) return;
    try { const r = await getNotifications(userId); setItems(r.data.slice(0, 15)); } catch {}
  };

  useEffect(() => { fetch(); const t = setInterval(fetch, 5000); return () => clearInterval(t); }, [userId]);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  const unread = items.filter(n => !n.read).length;

  const handleMark = async id => {
    await markRead(id);
    setItems(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAll = async () => {
    await markAllRead(userId);
    setItems(p => p.map(n => ({ ...n, read: true })));
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">
              Notifications {unread > 0 && <span className="text-blue-600">({unread})</span>}
            </span>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0
              ? <p className="text-sm text-gray-500 text-center py-8">All caught up!</p>
              : items.map(n => (
                <div key={n.id} onClick={() => !n.read && handleMark(n.id)}
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${n.read ? '' : 'bg-blue-50/40'}`}>
                  <p className={`text-sm ${n.read ? 'text-gray-600 font-normal' : 'text-gray-900 font-medium'} leading-snug`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
