/**
 * Test API Client
 *
 * This file contains functions to test the backend API directly.
 * Use these to verify that priority, tags, and dates are being saved correctly.
 */

interface TestTaskData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  due_date?: string;
  remind_at?: string;
  recurring_pattern?: string;
}

/**
 * Test creating a task with all fields
 */
export async function testCreateTask(userId: string, token: string) {
  console.log('🧪 TEST: Creating task with all fields');
  console.log('='.repeat(60));

  const testData: TestTaskData = {
    title: 'Test Task - All Fields',
    description: 'Testing priority, tags, dates, and reminders',
    priority: 'high',
    tags: ['test', 'urgent', 'api-test'],
    due_date: '2026-03-08T15:00:00.000Z',
    remind_at: '2026-03-08T14:00:00.000Z',
    recurring_pattern: 'daily'
  };

  console.log('📦 Test payload:', testData);

  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/${userId}/tasks`;
  console.log('🌐 API URL:', apiUrl);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Task created:', result);

    // Verify fields
    console.log('\n🔍 Verification:');
    console.log('  Priority:', result.priority === 'high' ? '✅ high' : `❌ ${result.priority}`);
    console.log('  Tags:', result.tags?.length === 3 ? `✅ ${result.tags}` : `❌ ${result.tags}`);
    console.log('  Due Date:', result.due_date ? `✅ ${result.due_date}` : '❌ missing');
    console.log('  Reminder:', result.remind_at ? `✅ ${result.remind_at}` : '❌ missing');
    console.log('  Recurring:', result.recurring_pattern === 'daily' ? '✅ daily' : `❌ ${result.recurring_pattern}`);

    console.log('='.repeat(60));
    return result;

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('='.repeat(60));
    throw error;
  }
}

/**
 * Test creating a minimal task (only required fields)
 */
export async function testCreateMinimalTask(userId: string, token: string) {
  console.log('🧪 TEST: Creating minimal task');
  console.log('='.repeat(60));

  const testData = {
    title: 'Minimal Test Task',
    priority: 'medium',
    tags: []
  };

  console.log('📦 Test payload:', testData);

  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/${userId}/tasks`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Task created:', result);
    console.log('='.repeat(60));
    return result;

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('='.repeat(60));
    throw error;
  }
}

/**
 * Test fetching tasks to verify they were saved correctly
 */
export async function testFetchTasks(userId: string, token: string) {
  console.log('🧪 TEST: Fetching all tasks');
  console.log('='.repeat(60));

  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/${userId}/tasks`;
  console.log('🌐 API URL:', apiUrl);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Tasks fetched:', result);

    // Analyze tasks
    if (result.tasks && Array.isArray(result.tasks)) {
      console.log(`\n📊 Found ${result.tasks.length} tasks:`);
      result.tasks.forEach((task: any, index: number) => {
        console.log(`\n  Task ${index + 1}:`);
        console.log(`    Title: ${task.title}`);
        console.log(`    Priority: ${task.priority || 'null'}`);
        console.log(`    Tags: ${task.tags ? JSON.stringify(task.tags) : 'null'}`);
        console.log(`    Due Date: ${task.due_date || 'null'}`);
        console.log(`    Reminder: ${task.remind_at || 'null'}`);
      });
    }

    console.log('='.repeat(60));
    return result;

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('='.repeat(60));
    throw error;
  }
}

/**
 * Run all tests
 */
export async function runAllTests(userId: string, token: string) {
  console.log('\n🚀 RUNNING ALL API TESTS\n');

  try {
    // Test 1: Create task with all fields
    await testCreateTask(userId, token);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    // Test 2: Create minimal task
    await testCreateMinimalTask(userId, token);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    // Test 3: Fetch all tasks
    await testFetchTasks(userId, token);

    console.log('\n✅ ALL TESTS PASSED\n');

  } catch (error) {
    console.error('\n❌ TESTS FAILED\n');
    throw error;
  }
}

/**
 * Helper: Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  const authData = localStorage.getItem('todo-app-auth');
  if (!authData) return null;

  try {
    const parsed = JSON.parse(authData);
    return parsed.token || null;
  } catch (e) {
    return null;
  }
}

/**
 * Helper: Get user ID from localStorage
 */
export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;

  const authData = localStorage.getItem('todo-app-auth');
  if (!authData) return null;

  try {
    const parsed = JSON.parse(authData);
    return parsed.user?.id || null;
  } catch (e) {
    return null;
  }
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testAPI = {
    testCreateTask,
    testCreateMinimalTask,
    testFetchTasks,
    runAllTests,
    getAuthToken,
    getUserId
  };

  console.log('💡 Test API loaded! Use window.testAPI in console:');
  console.log('   window.testAPI.runAllTests(userId, token)');
  console.log('   window.testAPI.testCreateTask(userId, token)');
  console.log('   window.testAPI.testFetchTasks(userId, token)');
}
