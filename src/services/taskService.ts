import { supabase } from '../lib/supabase';
import { Task, TaskUpdate } from '../types';
import { AuthService } from './authService';

const TASK_SELECT = `
  id, title, description, priority, status, category,
  created_by, created_at, closed_by, closed_at, close_reason,
  creator:users!fk_tasks_created_by(id, full_name),
  closer:users!fk_tasks_closed_by(id, full_name),
  updates_count:task_updates(count)
`;

const UPDATE_SELECT = `
  id, task_id, content, update_type, created_by, created_at,
  author:users!fk_task_updates_created_by(id, full_name)
`;

export class TaskService {
  static async getTasks(filters: {
    status?: string;
    priority?: string;
    search?: string;
  } = {}): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select(TASK_SELECT)
      .order('created_at', { ascending: false })
      .limit(200);

    if (filters.status)   query = query.eq('status', filters.status);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.search?.trim())
      query = (query as any).ilike('title', `%${filters.search.trim()}%`);

    const { data, error } = await (query as any);
    if (error) throw new Error(`خطأ في جلب المعاملات: ${error.message}`);

    return (data || []).map((t: any) => ({
      ...t,
      updates_count: t.updates_count?.[0]?.count || 0,
    }));
  }

  static async getStatusCounts(): Promise<Record<string, number>> {
    const [{ count: all }, { count: open }, { count: prog }, { count: closed }] =
      await Promise.all([
        supabase.from('tasks').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'مفتوحة'),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'قيد المتابعة'),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'مغلقة'),
      ]);
    return {
      all: all || 0,
      'مفتوحة': open || 0,
      'قيد المتابعة': prog || 0,
      'مغلقة': closed || 0,
    };
  }

  static async getTaskUpdates(taskId: string): Promise<TaskUpdate[]> {
    const { data, error } = await supabase
      .from('task_updates')
      .select(UPDATE_SELECT)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(`خطأ في جلب التحديثات: ${error.message}`);
    return (data || []) as TaskUpdate[];
  }

  static async getRecentUpdates(limit = 30): Promise<TaskUpdate[]> {
    const { data } = await supabase
      .from('task_updates')
      .select(`${UPDATE_SELECT}, task:tasks!fk_task_updates_task(id, title)`)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data || []) as TaskUpdate[];
  }

  static async createTask(taskData: {
    title: string;
    description: string;
    priority: string;
    category?: string;
  }): Promise<Task> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('يجب تسجيل الدخول');

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([{ ...taskData, status: 'مفتوحة', created_by: user.id }])
      .select(TASK_SELECT)
      .single();

    if (error) throw new Error(`خطأ في إضافة المعاملة: ${error.message}`);

    await supabase.from('task_updates').insert([{
      task_id: (task as any).id,
      content: `تم فتح معاملة جديدة: "${taskData.title}"`,
      update_type: 'open',
      created_by: user.id,
    }]);

    return task as Task;
  }

  static async addUpdate(
    taskId: string,
    content: string,
    newStatus?: string,
  ): Promise<TaskUpdate> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('يجب تسجيل الدخول');

    if (newStatus) {
      await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    }

    const { data, error } = await supabase
      .from('task_updates')
      .insert([{
        task_id: taskId,
        content: newStatus ? `[${newStatus}] ${content}` : content,
        update_type: 'update',
        created_by: user.id,
      }])
      .select(`${UPDATE_SELECT}, task:tasks!fk_task_updates_task(id, title)`)
      .single();

    if (error) throw new Error(`خطأ في إضافة التحديث: ${error.message}`);
    return data as TaskUpdate;
  }

  static async closeTask(taskId: string, reason: string): Promise<void> {
    const user = AuthService.getCurrentUser();
    if (!user) throw new Error('يجب تسجيل الدخول');

    await supabase.from('tasks').update({
      status: 'مغلقة',
      closed_by: user.id,
      closed_at: new Date().toISOString(),
      close_reason: reason,
    }).eq('id', taskId);

    await supabase.from('task_updates').insert([{
      task_id: taskId,
      content: `تم إغلاق المعاملة — السبب: ${reason}`,
      update_type: 'close',
      created_by: user.id,
    }]);
  }
}
