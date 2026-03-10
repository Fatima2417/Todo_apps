'use client';

import { Task } from '@/lib/types';
import { Button } from '../ui/Button';
import { useState, useEffect } from 'react';
import TagChip from './TagChip';
import { useUserTags } from '@/lib/tasks-query';

interface TaskFormProps {
  task?: Task;  // Optional for new task creation
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  userId: string;
  value: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
    due_date?: string;
    remind_at?: string;
    recurring_pattern?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTagsChange: (tags: string[]) => void;
}

export function TaskForm({ task, onSave, onCancel, isLoading, userId, value, onChange, onTagsChange }: TaskFormProps) {
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const { data: userTags = [] } = useUserTags(userId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validate reminder is before due date
    if (value.due_date && value.remind_at) {
      const dueDate = new Date(value.due_date);
      const remindAt = new Date(value.remind_at);

      if (remindAt >= dueDate) {
        setValidationError('⚠️ Reminder time must be before the due date. Please adjust the reminder time.');
        return;
      }
    }

    // 📝 DEBUG: Log form state before submission
    console.log('📝 Form state before submit:', {
      title: value.title,
      description: value.description,
      priority: value.priority,
      tags: value.tags,
      due_date: value.due_date,
      remind_at: value.remind_at,
      recurring_pattern: value.recurring_pattern,
      tagsCount: value.tags.length,
      hasDueDate: !!value.due_date,
      hasReminder: !!value.remind_at
    });

    onSave();
  };

  const handleAddTag = (tag?: string) => {
    const trimmedTag = (tag || tagInput).trim();
    if (trimmedTag && !value.tags.includes(trimmedTag) && value.tags.length < 20) {
      onTagsChange([...value.tags, trimmedTag]);
      setTagInput('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(value.tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  // Filter suggestions based on input
  const filteredSuggestions = userTags.filter(
    tag =>
      tag.toLowerCase().includes(tagInput.toLowerCase()) &&
      !value.tags.includes(tag)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Validation Error Alert */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{validationError}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={value.title}
          onChange={onChange}
          required
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
          placeholder="Task title"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={value.description}
          onChange={onChange}
          rows={3}
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
          placeholder="Task description (optional)"
        />
      </div>
      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          value={value.priority}
          onChange={onChange}
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags
        </label>
        <div className="mt-1 relative">
          <div className="flex gap-2">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
              onFocus={() => setShowSuggestions(tagInput.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              disabled={isLoading || value.tags.length >= 20}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              placeholder="Add a tag (press Enter)"
              maxLength={50}
            />
            <Button
              type="button"
              onClick={() => handleAddTag()}
              disabled={isLoading || !tagInput.trim() || value.tags.length >= 20}
              variant="secondary"
            >
              Add
            </Button>
          </div>

          {/* Autocomplete suggestions */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm text-gray-700 hover:text-indigo-900"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        {value.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {value.tags.map((tag) => (
              <TagChip
                key={tag}
                tag={tag}
                onRemove={() => handleRemoveTag(tag)}
              />
            ))}
          </div>
        )}
        {value.tags.length >= 20 && (
          <p className="mt-1 text-sm text-red-600">Maximum 20 tags allowed</p>
        )}
      </div>

      {/* Due Date */}
      <div>
        <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
          Due Date
        </label>
        <input
          type="datetime-local"
          id="due_date"
          name="due_date"
          value={value.due_date || ''}
          onChange={onChange}
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
        />
      </div>

      {/* Reminder */}
      <div>
        <label htmlFor="remind_at" className="block text-sm font-medium text-gray-700">
          Reminder (must be before due date)
        </label>
        <input
          type="datetime-local"
          id="remind_at"
          name="remind_at"
          value={value.remind_at || ''}
          onChange={onChange}
          disabled={isLoading || !value.due_date}
          max={value.due_date || undefined}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
        />
        {!value.due_date && (
          <p className="mt-1 text-sm text-gray-500">Set a due date first to enable reminders</p>
        )}
        {value.due_date && (
          <p className="mt-1 text-sm text-gray-500">
            💡 Tip: Set the reminder time before the due date (e.g., 1 hour or 1 day before)
          </p>
        )}
      </div>

      {/* Recurring Pattern */}
      <div>
        <label htmlFor="recurring_pattern" className="block text-sm font-medium text-gray-700">
          Recurring Pattern
        </label>
        <select
          id="recurring_pattern"
          name="recurring_pattern"
          value={value.recurring_pattern || ''}
          onChange={onChange}
          disabled={isLoading || !value.due_date}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
        >
          <option value="">None (One-time task)</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        {!value.due_date && (
          <p className="mt-1 text-sm text-gray-500">Set a due date first to enable recurring tasks</p>
        )}
        {value.recurring_pattern && (
          <p className="mt-1 text-sm text-indigo-600">
            ✓ This task will automatically create a new occurrence when completed
          </p>
        )}
      </div>

      <div className="flex space-x-3">
        <Button
          type="submit"
          loading={isLoading}
          className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
        >
          {task ? 'Update Task' : 'Create Task'}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          variant="secondary"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}