// frontend/lib/types.ts
// Define TypeScript interfaces matching backend API

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string; // ISO date string
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  user_id: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  completed_at: string | null; // ISO date string
  priority: 'low' | 'medium' | 'high' | null; // Can be null for old tasks
  tags: string[] | null; // Can be null for old tasks
  due_date: string | null; // ISO date string
  remind_at: string | null; // ISO date string
  recurring_pattern: string | null;
  is_recurring: boolean;
  parent_task_id: number | null;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  due_date?: string;
  remind_at?: string;
  recurring_pattern?: string;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  due_date?: string;
  remind_at?: string;
  recurring_pattern?: string;
}

// Additional types for API responses if needed
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}