'use client';

import { Task } from '@/lib/types';
import { TaskItem } from './TaskItem';
import { useState, useEffect } from 'react';
import { useTaskStore } from '@/hooks/useTaskStore';

interface TaskListProps {
  tasks: Task[];
  userId: string;
  loading?: boolean;
  error?: string | null;
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: number) => void;
}

export function TaskList({
  tasks: propTasks,
  userId,
  loading,
  error,
  onTaskUpdate,
  onTaskDelete
}: TaskListProps) {
  // Use React Query data directly - single source of truth
  const tasks = propTasks;

  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dueDateFrom, setDueDateFrom] = useState<string>('');
  const [dueDateTo, setDueDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  // Log when tasks change
  useEffect(() => {
    console.log('📊 TaskList: Tasks updated, count:', tasks.length);
  }, [tasks]);

  // Load sort preferences from localStorage on mount
  useEffect(() => {
    const savedSortBy = localStorage.getItem('taskSortBy');
    const savedSortOrder = localStorage.getItem('taskSortOrder');
    if (savedSortBy) setSortBy(savedSortBy);
    if (savedSortOrder) setSortOrder(savedSortOrder);
  }, []);

  // Save sort preferences to localStorage when changed
  useEffect(() => {
    localStorage.setItem('taskSortBy', sortBy);
    localStorage.setItem('taskSortOrder', sortOrder);
  }, [sortBy, sortOrder]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse bg-gray-100 h-20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-100">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get all unique tags from tasks
  const allTags = Array.from(new Set(tasks.flatMap(task => task.tags || [])));

  // Apply filters
  let filteredTasks = tasks;

  // Search filter
  if (debouncedSearch.trim()) {
    const searchLower = debouncedSearch.toLowerCase();
    filteredTasks = filteredTasks.filter(task =>
      task.title.toLowerCase().includes(searchLower) ||
      (task.description && task.description.toLowerCase().includes(searchLower))
    );
  }

  // Priority filter
  if (priorityFilter !== 'all') {
    filteredTasks = filteredTasks.filter(task => (task.priority || 'medium') === priorityFilter);
  }

  // Tags filter
  if (selectedTags.length > 0) {
    filteredTasks = filteredTasks.filter(task =>
      selectedTags.some(tag => task.tags?.includes(tag))
    );
  }

  // Status filter
  if (statusFilter === 'pending') {
    filteredTasks = filteredTasks.filter(task => !task.completed);
  } else if (statusFilter === 'completed') {
    filteredTasks = filteredTasks.filter(task => task.completed);
  }

  // Date range filter
  if (dueDateFrom) {
    filteredTasks = filteredTasks.filter(task =>
      task.due_date && new Date(task.due_date) >= new Date(dueDateFrom)
    );
  }
  if (dueDateTo) {
    filteredTasks = filteredTasks.filter(task =>
      task.due_date && new Date(task.due_date) <= new Date(dueDateTo)
    );
  }

  // Client-side sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'due_date':
        const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        compareValue = aDate - bDate;
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = a.priority || 'medium';
        const bPriority = b.priority || 'medium';
        compareValue = priorityOrder[aPriority] - priorityOrder[bPriority];
        break;
      case 'title':
        compareValue = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        break;
      case 'completed_at':
        const aCompleted = a.completed_at ? new Date(a.completed_at).getTime() : Infinity;
        const bCompleted = b.completed_at ? new Date(b.completed_at).getTime() : Infinity;
        compareValue = aCompleted - bCompleted;
        break;
      case 'created_at':
      default:
        compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }

    return sortOrder === 'desc' ? -compareValue : compareValue;
  });

  const pendingTasks = sortedTasks.filter(task => !task.completed);
  const completedTasks = sortedTasks.filter(task => task.completed);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setPriorityFilter('all');
    setSelectedTags([]);
    setStatusFilter('all');
    setDueDateFrom('');
    setDueDateTo('');
  };

  const hasActiveFilters =
    debouncedSearch.trim() ||
    priorityFilter !== 'all' ||
    selectedTags.length > 0 ||
    statusFilter !== 'all' ||
    dueDateFrom ||
    dueDateTo;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
        <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* React Query Status Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
        <div className="text-sm">
          <span className="font-medium text-blue-900">⚡ React Query Active</span>
          <span className="ml-2 text-blue-700">
            {tasks.length} tasks • {loading ? 'Loading...' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        {/* Search Input */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Tasks
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or description..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="created_at">Created Date</option>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
              <option value="completed_at">Completed Date</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm flex items-center justify-center gap-2"
            >
              {sortOrder === 'asc' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Ascending
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Descending
                </>
              )}
            </button>
          </div>

          {/* Due Date From */}
          <div>
            <label htmlFor="due-date-from" className="block text-sm font-medium text-gray-700 mb-1">
              Due From
            </label>
            <input
              type="date"
              id="due-date-from"
              value={dueDateFrom}
              onChange={(e) => setDueDateFrom(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Due Date To */}
          <div>
            <label htmlFor="due-date-to" className="block text-sm font-medium text-gray-700 mb-1">
              Due To
            </label>
            <input
              type="date"
              id="due-date-to"
              value={dueDateTo}
              onChange={(e) => setDueDateTo(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Display & Clear Button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="text-gray-600">Active filters:</span>
              {debouncedSearch && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Search: "{debouncedSearch}"
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Status: {statusFilter}
                </span>
              )}
              {priorityFilter !== 'all' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                  Priority: {priorityFilter}
                </span>
              )}
              {selectedTags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                  Tag: {tag}
                </span>
              ))}
              {dueDateFrom && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                  From: {dueDateFrom}
                </span>
              )}
              {dueDateTo && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                  To: {dueDateTo}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Result Count */}
        <div className="text-sm text-gray-600">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>

      {/* Tasks Display */}
      <div className="space-y-8">
        {/* Pending Tasks Section */}
        {pendingTasks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold mr-2">
                {pendingTasks.length}
              </span>
              Pending Tasks
            </h2>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  userId={userId}
                  onEdit={onTaskUpdate}
                  onDelete={onTaskDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold mr-2">
                {completedTasks.length}
              </span>
              Completed
            </h2>
            <div className="space-y-3 opacity-80">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  userId={userId}
                  onEdit={onTaskUpdate}
                  onDelete={onTaskDelete}
                />
              ))}
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No tasks match the selected filters.</p>
            <button
              type="button"
              onClick={() => {
                setPriorityFilter('all');
                setSelectedTags([]);
              }}
              className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {pendingTasks.length === 0 && completedTasks.length > 0 && filteredTasks.length > 0 && (
          <div className="text-center py-6 bg-green-50 rounded-lg border border-green-100">
            <p className="text-green-700 font-medium">✨ All caught up! All tasks completed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
