import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { TaskUpdate } from '../types';
import { TaskService } from '../services/taskService';

const LAST_READ_KEY = 'notif_last_read_at';

interface NotificationContextType {
  notifications: TaskUpdate[];
  unreadCount: number;
  markAllRead: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  refresh: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<TaskUpdate[]>([]);
  const [lastReadAt, setLastReadAt] = useState<string>(
    () => localStorage.getItem(LAST_READ_KEY) || new Date(0).toISOString()
  );
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await TaskService.getRecentUpdates(30);
      setNotifications(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    load();

    channelRef.current = supabase
      .channel('task-notif-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_updates' }, load)
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [load]);

  const unreadCount = notifications.filter(
    n => new Date(n.created_at) > new Date(lastReadAt)
  ).length;

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_READ_KEY, now);
    setLastReadAt(now);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, refresh: load }}>
      {children}
    </NotificationContext.Provider>
  );
};
