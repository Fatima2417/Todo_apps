// frontend/lib/taskStore.ts
// Simple global store that doesn't rely on React context

export type Task = {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  due_date?: string;
  remind_at?: string;
  completed: boolean;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  recurring_pattern?: string;
};

type Listener = () => void;

class TaskStore {
  private tasks: Task[] = [];
  private loading: boolean = false;
  private error: string | null = null;
  private listeners: Set<Listener> = new Set();
  private userId: string | null = null;

  // Subscribe to changes
  subscribe(listener: Listener): () => void {
    console.log('📝 New listener subscribed. Total listeners:', this.listeners.size + 1);
    this.listeners.add(listener);
    return () => {
      console.log('📝 Listener unsubscribed. Total listeners:', this.listeners.size - 1);
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners
  private notify() {
    console.log('🔔 Notifying', this.listeners.size, 'listeners');
    this.listeners.forEach(listener => listener());
  }

  // Set user ID
  setUserId(userId: string) {
    console.log('👤 Setting user ID:', userId);
    this.userId = userId;
  }

  // Get current state
  getState() {
    return {
      tasks: this.tasks,
      loading: this.loading,
      error: this.error
    };
  }

  // Fetch tasks from API
  async fetchTasks(): Promise<void> {
    if (!this.userId) {
      console.warn('⚠️ No user ID set, cannot fetch tasks');
      return;
    }

    console.log('📥 Fetching tasks for user:', this.userId);
    this.loading = true;
    this.notify();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const authData = localStorage.getItem('todo-app-auth');
      const token = authData ? JSON.parse(authData).token : null;

      const response = await fetch(`${apiUrl}/api/v1/${this.userId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }

      const data = await response.json();
      this.tasks = data;
      this.error = null;
      console.log('✅ Fetched', data.length, 'tasks');
    } catch (err: any) {
      this.error = err.message || 'Failed to fetch tasks';
      console.error('❌ Error fetching tasks:', err);
    } finally {
      this.loading = false;
      this.notify();
    }
  }

  // Add task to store
  addTask(task: Task) {
    console.log('➕ Adding task to store:', task.id, task.title);
    this.tasks = [task, ...this.tasks];
    this.notify();
  }

  // Update task in store
  updateTask(updatedTask: Task) {
    console.log('✏️ Updating task in store:', updatedTask.id, updatedTask.title);
    this.tasks = this.tasks.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    );
    this.notify();
  }

  // Delete task from store
  deleteTask(taskId: number) {
    console.log('🗑️ Deleting task from store:', taskId);
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    this.notify();
  }

  // Force refresh (useful for chat operations)
  async forceRefresh(): Promise<void> {
    console.log('🔄 FORCE REFRESH triggered');
    await this.fetchTasks();
  }
}

// Create singleton instance
const taskStore = new TaskStore();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).taskStore = taskStore;
  console.log('🏪 Task store initialized and exposed to window.taskStore');
}

export default taskStore;
