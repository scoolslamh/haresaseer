import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardList, Plus, Search, RefreshCw,
  Clock, CheckCircle, AlertCircle, Circle,
  User, Calendar, MessageSquare, Lock, X,
  ChevronLeft, Send, Tag,
} from 'lucide-react';
import { TaskService } from '../services/taskService';
import { Task, TaskUpdate, TaskStatus } from '../types';
import { useNotifications } from '../contexts/NotificationContext';

// ── مساعدات ────────────────────────────────────────────────────────────────
function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'الآن';
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const dy = Math.floor(h / 24);
  if (dy < 30) return `منذ ${dy} يوم`;
  return new Date(d).toLocaleDateString('ar-SA');
}

const PRIORITY_CFG = {
  'عاجل':  { badge: 'bg-red-100 text-red-700',    border: 'border-r-red-500',    dot: 'bg-red-500'    },
  'عادي':  { badge: 'bg-yellow-100 text-yellow-700', border: 'border-r-yellow-500', dot: 'bg-yellow-500' },
  'منخفض': { badge: 'bg-green-100 text-green-700',  border: 'border-r-green-500',  dot: 'bg-green-500'  },
} as const;

const STATUS_CFG = {
  'مفتوحة':        { badge: 'bg-blue-100 text-blue-700',    Icon: AlertCircle,  ring: 'focus:ring-blue-300'   },
  'قيد المتابعة':  { badge: 'bg-orange-100 text-orange-700', Icon: Clock,        ring: 'focus:ring-orange-300' },
  'مغلقة':         { badge: 'bg-gray-100 text-gray-600',    Icon: CheckCircle,  ring: ''                      },
} as const;

const UPDATE_ICON: Record<string, string> = { open: '🟢', update: '💬', close: '🔒' };

// ── AddTaskModal ─────────────────────────────────────────────────────────────
const AddTaskModal: React.FC<{ onClose: () => void; onSave: () => void }> = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ title: '', description: '', priority: 'عادي', category: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setErr('العنوان مطلوب'); return; }
    setLoading(true);
    try { await TaskService.createTask(form); onSave(); }
    catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-800">إضافة معاملة جديدة</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العنوان *</label>
            <input type="text" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="عنوان المعاملة..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-400 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">التفاصيل</label>
            <textarea value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="وصف تفصيلي للمعاملة..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moe-400 text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="عاجل">🔴 عاجل</option>
                <option value="عادي">🟡 عادي</option>
                <option value="منخفض">🟢 منخفض</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
              <input type="text" value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                placeholder="مثال: إداري، ميداني..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 py-2 bg-moe-700 text-white rounded-lg hover:bg-moe-800 disabled:opacity-50 font-medium text-sm">
              {loading ? 'جاري الحفظ...' : 'حفظ المعاملة'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── TaskDetailModal ──────────────────────────────────────────────────────────
const TaskDetailModal: React.FC<{
  task: Task;
  onClose: () => void;
  onRefresh: () => void;
}> = ({ task, onClose, onRefresh }) => {
  const [updates, setUpdates]       = useState<TaskUpdate[]>([]);
  const [loadingU, setLoadingU]     = useState(true);
  const [newUpdate, setNewUpdate]   = useState('');
  const [newStatus, setNewStatus]   = useState<TaskStatus>(task.status);
  const [submitting, setSubmitting] = useState(false);
  const [showClose, setShowClose]   = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [closing, setClosing]       = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { refresh: refreshNotif }   = useNotifications();

  useEffect(() => {
    TaskService.getTaskUpdates(task.id)
      .then(d => { setUpdates(d); setLoadingU(false); })
      .catch(() => setLoadingU(false));
  }, [task.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [updates]);

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;
    setSubmitting(true);
    try {
      const u = await TaskService.addUpdate(task.id, newUpdate.trim(),
        newStatus !== task.status ? newStatus : undefined);
      setUpdates(p => [...p, u]);
      setNewUpdate('');
      refreshNotif();
      onRefresh();
    } finally { setSubmitting(false); }
  };

  const handleClose = async () => {
    if (!closeReason.trim()) return;
    setClosing(true);
    try {
      await TaskService.closeTask(task.id, closeReason.trim());
      refreshNotif();
      onClose();
      onRefresh();
    } finally { setClosing(false); }
  };

  const isClosed = task.status === 'مغلقة';
  const pCfg = PRIORITY_CFG[task.priority as keyof typeof PRIORITY_CFG];
  const sCfg = STATUS_CFG[task.status as keyof typeof STATUS_CFG];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-5 border-b flex items-start gap-3">
          <div className={`w-1.5 self-stretch rounded-full ${pCfg.dot}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pCfg.badge}`}>{task.priority}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sCfg.badge}`}>
                <sCfg.Icon className="w-3 h-3" />{task.status}
              </span>
              {task.category && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                  <Tag className="w-3 h-3" />{task.category}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-800">{task.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              أضافها: <span className="font-medium text-gray-600">{task.creator?.full_name || '—'}</span>
              &nbsp;—&nbsp;{timeAgo(task.created_at)}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg flex-shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Description */}
        {task.description && (
          <div className="px-5 py-3 bg-gray-50 border-b text-sm text-gray-700">{task.description}</div>
        )}

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-400">سجل التحديثات</p>
          {loadingU ? (
            <div className="flex justify-center py-6"><RefreshCw className="w-5 h-5 animate-spin text-moe-400" /></div>
          ) : (
            updates.map(u => (
              <div key={u.id} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-moe-100 flex items-center justify-center text-sm">
                  {UPDATE_ICON[u.update_type] || '💬'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-800">{u.author?.full_name || '—'}</span>
                    <span className="text-xs text-gray-400">{timeAgo(u.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    {u.content}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Closed info */}
        {isClosed && task.closer && (
          <div className="px-5 py-2.5 bg-gray-50 border-t text-xs text-gray-500 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            أُغلقت بواسطة <strong>{task.closer.full_name}</strong> — {task.close_reason}
          </div>
        )}

        {/* Add update */}
        {!isClosed && (
          <div className="p-4 border-t space-y-3">
            <div className="flex gap-2">
              <select value={newStatus}
                onChange={e => setNewStatus(e.target.value as TaskStatus)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="مفتوحة">مفتوحة</option>
                <option value="قيد المتابعة">قيد المتابعة</option>
              </select>
              <input type="text" value={newUpdate}
                onChange={e => setNewUpdate(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleAddUpdate(); }}
                placeholder="أضف تحديثاً..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-moe-400" />
              <button onClick={handleAddUpdate}
                disabled={submitting || !newUpdate.trim()}
                className="px-3 py-2 bg-moe-700 text-white rounded-lg hover:bg-moe-800 disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>

            {!showClose ? (
              <button onClick={() => setShowClose(true)}
                className="w-full py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> إغلاق المعاملة
              </button>
            ) : (
              <div className="border border-red-200 rounded-lg p-3 bg-red-50 space-y-2">
                <p className="text-sm font-medium text-red-700">سبب الإغلاق *</p>
                <textarea value={closeReason}
                  onChange={e => setCloseReason(e.target.value)}
                  placeholder="اكتب سبب الإغلاق..."
                  rows={2}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-300" />
                <div className="flex gap-2">
                  <button onClick={handleClose}
                    disabled={closing || !closeReason.trim()}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm">
                    {closing ? 'جاري الإغلاق...' : 'تأكيد الإغلاق'}
                  </button>
                  <button onClick={() => { setShowClose(false); setCloseReason(''); }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-white">
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export const TasksPage: React.FC = () => {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [counts, setCounts]         = useState<Record<string, number>>({ all: 0, 'مفتوحة': 0, 'قيد المتابعة': 0, 'مغلقة': 0 });
  const [loading, setLoading]       = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');
  const [priority, setPriority]     = useState('all');
  const [search, setSearch]         = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const [selected, setSelected]     = useState<Task | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, countsData] = await Promise.all([
        TaskService.getTasks({
          status:   activeStatus !== 'all' ? activeStatus : undefined,
          priority: priority     !== 'all' ? priority     : undefined,
          search:   search || undefined,
        }),
        TaskService.getStatusCounts(),
      ]);
      setTasks(tasksData);
      setCounts(countsData);
    } finally { setLoading(false); }
  }, [activeStatus, priority, search]);

  useEffect(() => { load(); }, [load]);

  const tabs = [
    { value: 'all',          label: 'الكل',         count: counts['all']             },
    { value: 'مفتوحة',       label: 'مفتوحة',       count: counts['مفتوحة']          },
    { value: 'قيد المتابعة', label: 'قيد المتابعة', count: counts['قيد المتابعة']    },
    { value: 'مغلقة',        label: 'مغلقة',        count: counts['مغلقة']           },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-moe-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">متابعة المعاملات</h1>
            <p className="text-gray-500 text-sm">إدارة ومتابعة المعاملات والمهام</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-moe-700 text-white rounded-lg hover:bg-moe-800 font-medium text-sm">
          <Plus className="w-4 h-4" /> إضافة معاملة
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.value} onClick={() => setActiveStatus(t.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeStatus === t.value
                ? 'bg-moe-700 text-white shadow-sm'
                : 'bg-white text-gray-600 border hover:border-moe-300'
            }`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeStatus === t.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث في المعاملات..."
            className="w-full pr-9 pl-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-moe-400" />
        </div>
        <select value={priority} onChange={e => setPriority(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="all">جميع الأولويات</option>
          <option value="عاجل">🔴 عاجل</option>
          <option value="عادي">🟡 عادي</option>
          <option value="منخفض">🟢 منخفض</option>
        </select>
        <button onClick={load} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="تحديث">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-8 h-8 animate-spin text-moe-400" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد معاملات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const pCfg = PRIORITY_CFG[task.priority as keyof typeof PRIORITY_CFG];
            const sCfg = STATUS_CFG[task.status as keyof typeof STATUS_CFG];
            return (
              <div key={task.id} onClick={() => setSelected(task)}
                className={`bg-white rounded-xl border border-gray-100 border-r-4 ${pCfg.border} shadow-sm p-4 cursor-pointer hover:shadow-md transition-all`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pCfg.badge}`}>{task.priority}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sCfg.badge}`}>
                        <sCfg.Icon className="w-3 h-3" />{task.status}
                      </span>
                      {task.category && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                          <Tag className="w-3 h-3" />{task.category}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-gray-400 truncate">{task.description}</p>
                    )}
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{task.creator?.full_name || '—'}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{timeAgo(task.created_at)}</span>
                  {(task.updates_count || 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />{task.updates_count} تحديث
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onSave={() => { setShowAdd(false); load(); }} />}
      {selected && (
        <TaskDetailModal
          task={selected}
          onClose={() => setSelected(null)}
          onRefresh={() => { setSelected(null); load(); }}
        />
      )}
    </div>
  );
};

export default TasksPage;
