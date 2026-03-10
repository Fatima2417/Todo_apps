'use client';

import { useRef, FormEvent } from 'react';

interface SimpleTaskFormProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SimpleTaskForm({ userId, onSuccess, onCancel }: SimpleTaskFormProps) {
  // Use refs to directly access form values (bypasses state issues)
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const priorityRef = useRef<HTMLSelectElement>(null);
  const tagsRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const remindAtRef = useRef<HTMLInputElement>(null);
  const recurringRef = useRef<HTMLSelectElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    console.log('🔴 FORM SUBMIT START');
    console.log('='.repeat(50));

    // Step 1: Read raw values from refs
    const rawValues = {
      title: titleRef.current?.value || '',
      description: descriptionRef.current?.value || '',
      priority: priorityRef.current?.value || 'medium',
      tagsString: tagsRef.current?.value || '',
      dueDate: dueDateRef.current?.value || '',
      remindAt: remindAtRef.current?.value || '',
      recurring: recurringRef.current?.value || ''
    };

    console.log('📋 Raw form values:', rawValues);

    // Step 2: Process tags (comma-separated string to array)
    const tagsArray = rawValues.tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    console.log('🏷️  Tags processed:', {
      input: rawValues.tagsString,
      output: tagsArray,
      count: tagsArray.length
    });

    // Step 3: Convert datetime-local to ISO format
    let dueDateISO: string | undefined = undefined;
    let remindAtISO: string | undefined = undefined;

    if (rawValues.dueDate) {
      try {
        dueDateISO = new Date(rawValues.dueDate).toISOString();
        console.log('📅 Due date conversion:', {
          input: rawValues.dueDate,
          output: dueDateISO
        });
      } catch (e) {
        console.error('❌ Error converting due date:', e);
      }
    }

    if (rawValues.remindAt) {
      try {
        remindAtISO = new Date(rawValues.remindAt).toISOString();
        console.log('⏰ Reminder conversion:', {
          input: rawValues.remindAt,
          output: remindAtISO
        });
      } catch (e) {
        console.error('❌ Error converting reminder:', e);
      }
    }

    // Step 4: Build final payload
    const payload = {
      title: rawValues.title,
      description: rawValues.description || undefined,
      priority: rawValues.priority,
      tags: tagsArray,
      due_date: dueDateISO,
      remind_at: remindAtISO,
      recurring_pattern: rawValues.recurring || undefined
    };

    console.log('📦 Final payload:', payload);
    console.log('📦 Payload JSON:', JSON.stringify(payload, null, 2));

    // Step 5: Validate
    if (!payload.title) {
      console.error('❌ Validation failed: Title is required');
      alert('Title is required');
      return;
    }

    if (payload.remind_at && payload.due_date) {
      const reminderDate = new Date(payload.remind_at);
      const dueDate = new Date(payload.due_date);
      if (reminderDate >= dueDate) {
        console.error('❌ Validation failed: Reminder must be before due date');
        alert('Reminder must be before due date');
        return;
      }
    }

    console.log('✅ Validation passed');

    // Step 6: Get auth token
    const authData = localStorage.getItem('todo-app-auth');
    const token = authData ? JSON.parse(authData).token : null;

    if (!token) {
      console.error('❌ No auth token found');
      alert('Please log in first');
      return;
    }

    console.log('🔑 Auth token found:', token.substring(0, 20) + '...');

    // Step 7: Send to API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/${userId}/tasks`;
    console.log('🌐 API URL:', apiUrl);

    try {
      console.log('📤 Sending request...');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Task created successfully:', result);
      console.log('='.repeat(50));

      // Step 8: Clear form on success
      if (titleRef.current) titleRef.current.value = '';
      if (descriptionRef.current) descriptionRef.current.value = '';
      if (priorityRef.current) priorityRef.current.value = 'medium';
      if (tagsRef.current) tagsRef.current.value = '';
      if (dueDateRef.current) dueDateRef.current.value = '';
      if (remindAtRef.current) remindAtRef.current.value = '';
      if (recurringRef.current) recurringRef.current.value = '';

      console.log('🧹 Form cleared');

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      alert('Task created successfully!');

    } catch (error) {
      console.error('❌ Request failed:', error);
      console.log('='.repeat(50));
      alert(`Failed to create task: ${error}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Task</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            ref={titleRef}
            type="text"
            id="title"
            name="title"
            required
            placeholder="Enter task title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            ref={descriptionRef}
            id="description"
            name="description"
            rows={3}
            placeholder="Enter task description (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            ref={priorityRef}
            id="priority"
            name="priority"
            defaultValue="medium"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="low">🟦 Low</option>
            <option value="medium">🟨 Medium</option>
            <option value="high">🟥 High</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <input
            ref={tagsRef}
            type="text"
            id="tags"
            name="tags"
            placeholder="Enter tags separated by commas (e.g., work,urgent,home)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate multiple tags with commas
          </p>
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            ref={dueDateRef}
            type="datetime-local"
            id="due_date"
            name="due_date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Reminder */}
        <div>
          <label htmlFor="remind_at" className="block text-sm font-medium text-gray-700 mb-1">
            Reminder
          </label>
          <input
            ref={remindAtRef}
            type="datetime-local"
            id="remind_at"
            name="remind_at"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Must be before due date
          </p>
        </div>

        {/* Recurring Pattern */}
        <div>
          <label htmlFor="recurring" className="block text-sm font-medium text-gray-700 mb-1">
            Recurring Pattern
          </label>
          <select
            ref={recurringRef}
            id="recurring"
            name="recurring"
            defaultValue=""
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">None (One-time task)</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 font-medium transition-colors"
          >
            Create Task
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-xs font-mono text-gray-600">
          💡 Open browser console (F12) to see detailed logs when submitting
        </p>
      </div>
    </div>
  );
}
