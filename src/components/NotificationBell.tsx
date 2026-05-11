import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, ClipboardList } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const LAST_READ_KEY = 'notif_last_read_at';

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'الآن';
  if (m < 60) return `منذ ${m} دق`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  return `منذ ${Math.floor(h / 24)} ي`;
}

const UPDATE_ICON: Record<string, string> = { open: '🟢', update: '💬', close: '🔒' };

interface Props {
  onNavigateToTasks?: () => void;
}

export const NotificationBell: React.FC<Props> = ({ onNavigateToTasks }) => {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lastReadAt = localStorage.getItem(LAST_READ_KEY) || new Date(0).toISOString();

  // إغلاق عند النقر خارج القائمة
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(p => !p);
  };

  const handleMarkRead = () => {
    markAllRead();
  };

  const handleGoToTasks = () => {
    setOpen(false);
    markAllRead();
    onNavigateToTasks?.();
  };

  return (
    <div className="relative" ref={ref}>
      {/* زر الجرس */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="الإشعارات"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* القائمة المنسدلة */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-moe-600" />
              <span className="font-semibold text-gray-800 text-sm">الإشعارات</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkRead}
                  className="text-xs text-moe-600 hover:text-moe-800">
                  تحديد كمقروء
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-0.5 hover:bg-gray-200 rounded">
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map(n => {
                const isUnread = new Date(n.created_at) > new Date(lastReadAt);
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isUnread ? 'bg-blue-50/40' : ''
                    }`}
                    onClick={handleGoToTasks}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-moe-100 flex items-center justify-center text-sm">
                      {UPDATE_ICON[n.update_type] || '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {n.task?.title || 'معاملة'}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{n.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">{n.author?.full_name || '—'}</span>
                        <span className="text-[10px] text-gray-300">•</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(n.created_at)}</span>
                      </div>
                    </div>
                    {isUnread && <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t bg-gray-50">
            <button onClick={handleGoToTasks}
              className="w-full flex items-center justify-center gap-2 text-xs text-moe-700 hover:text-moe-900 font-medium">
              <ClipboardList className="w-3.5 h-3.5" />
              عرض جميع المعاملات
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
