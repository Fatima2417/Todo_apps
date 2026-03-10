'use client';

import { useState, useEffect } from 'react';

export default function DiagnosticPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [token, setToken] = useState<string>('');

  // Get auth info on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('todo-app-auth');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          setUserId(parsed.user?.id || '');
          setToken(parsed.token || '');
        } catch (e) {
          console.error('Failed to parse auth data:', e);
        }
      }
    }
  }, []);

  const runFullDiagnostic = async () => {
    setLoading(true);
    const diagnosticResults: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      console.log('🔧 STARTING FULL DIAGNOSTIC SUITE');
      console.log('='.repeat(60));

      // Test 1: Health Check
      console.log('\n🟢 TEST 1: API Health Check');
      try {
        const healthRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/diagnostic/health`);
        const healthData = await healthRes.json();
        console.log('✅ Health check passed:', healthData);
        diagnosticResults.tests.push({
          name: 'Health Check',
          status: 'PASS',
          data: healthData
        });
      } catch (e) {
        console.error('❌ Health check failed:', e);
        diagnosticResults.tests.push({
          name: 'Health Check',
          status: 'FAIL',
          error: String(e)
        });
      }

      // Test 2: Echo Test (Raw data)
      console.log('\n🟢 TEST 2: Echo Test (Raw Data)');
      const echoPayload = {
        title: 'DIAGNOSTIC ECHO TEST',
        description: 'Testing raw data echo',
        priority: 'high',
        tags: ['diagnostic', 'echo', 'test'],
        due_date: '2026-03-07T15:00:00.000Z',
        remind_at: '2026-03-07T14:00:00.000Z',
        recurring_pattern: 'daily'
      };
      console.log('📤 Sending to /echo:', echoPayload);

      try {
        const echoRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/diagnostic/echo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(echoPayload)
        });
        const echoData = await echoRes.json();
        console.log('📥 Echo response:', echoData);
        diagnosticResults.tests.push({
          name: 'Echo Test',
          status: 'PASS',
          sent: echoPayload,
          received: echoData
        });
      } catch (e) {
        console.error('❌ Echo test failed:', e);
        diagnosticResults.tests.push({
          name: 'Echo Test',
          status: 'FAIL',
          error: String(e)
        });
      }

      // Test 3: Pydantic Validation Test
      console.log('\n🟢 TEST 3: Pydantic Validation Test');
      const pydanticPayload = {
        title: 'DIAGNOSTIC PYDANTIC TEST',
        description: 'Testing Pydantic validation',
        priority: 'high',
        tags: ['diagnostic', 'pydantic', 'test'],
        due_date: '2026-03-07T15:00:00.000Z',
        remind_at: '2026-03-07T14:00:00.000Z'
      };
      console.log('📤 Sending to /test-task:', pydanticPayload);

      try {
        const pydanticRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/diagnostic/test-task`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(pydanticPayload)
        });
        const pydanticData = await pydanticRes.json();
        console.log('📥 Pydantic response:', pydanticData);
        diagnosticResults.tests.push({
          name: 'Pydantic Validation',
          status: 'PASS',
          sent: pydanticPayload,
          received: pydanticData
        });
      } catch (e) {
        console.error('❌ Pydantic test failed:', e);
        diagnosticResults.tests.push({
          name: 'Pydantic Validation',
          status: 'FAIL',
          error: String(e)
        });
      }

      // Test 4: Create Real Task
      console.log('\n🟢 TEST 4: Create Real Task');
      const realTaskPayload = {
        title: 'DIAGNOSTIC REAL TASK ' + new Date().toISOString(),
        description: 'Testing actual task creation',
        priority: 'high',
        tags: ['diagnostic', 'real', 'test'],
        due_date: '2026-03-07T15:00:00.000Z',
        remind_at: '2026-03-07T14:00:00.000Z',
        recurring_pattern: 'daily'
      };
      console.log('📤 Sending to /tasks:', realTaskPayload);

      try {
        const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/${userId}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(realTaskPayload)
        });
        const createData = await createRes.json();
        console.log('📥 Create response:', createData);
        diagnosticResults.tests.push({
          name: 'Create Real Task',
          status: createRes.ok ? 'PASS' : 'FAIL',
          sent: realTaskPayload,
          received: createData,
          task_id: createData.id
        });

        // Test 5: Inspect Created Task
        if (createData.id) {
          console.log('\n🟢 TEST 5: Inspect Created Task');
          try {
            const inspectRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/diagnostic/inspect-task/${userId}/${createData.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            const inspectData = await inspectRes.json();
            console.log('📥 Inspect response:', inspectData);
            diagnosticResults.tests.push({
              name: 'Inspect Created Task',
              status: 'PASS',
              data: inspectData
            });
          } catch (e) {
            console.error('❌ Inspect failed:', e);
            diagnosticResults.tests.push({
              name: 'Inspect Created Task',
              status: 'FAIL',
              error: String(e)
            });
          }
        }

      } catch (e) {
        console.error('❌ Create task failed:', e);
        diagnosticResults.tests.push({
          name: 'Create Real Task',
          status: 'FAIL',
          error: String(e)
        });
      }

      // Test 6: List Recent Tasks
      console.log('\n🟢 TEST 6: List Recent Tasks');
      try {
        const listRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/diagnostic/list-recent-tasks/${userId}?limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const listData = await listRes.json();
        console.log('📥 Recent tasks:', listData);
        diagnosticResults.tests.push({
          name: 'List Recent Tasks',
          status: 'PASS',
          data: listData
        });
      } catch (e) {
        console.error('❌ List tasks failed:', e);
        diagnosticResults.tests.push({
          name: 'List Recent Tasks',
          status: 'FAIL',
          error: String(e)
        });
      }

      console.log('\n' + '='.repeat(60));
      console.log('🎉 DIAGNOSTIC SUITE COMPLETE');
      console.log('='.repeat(60));

      setResults(diagnosticResults);

    } catch (error) {
      console.error('🔴 DIAGNOSTIC SUITE FAILED:', error);
      diagnosticResults.error = String(error);
      setResults(diagnosticResults);
    }

    setLoading(false);
  };

  const testManualForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    const data = {
      title: (form.elements.namedItem('title') as HTMLInputElement).value,
      description: (form.elements.namedItem('description') as HTMLInputElement).value,
      priority: (form.elements.namedItem('priority') as HTMLSelectElement).value,
      tags: (form.elements.namedItem('tags') as HTMLInputElement).value.split(',').map(t => t.trim()).filter(t => t),
      due_date: (form.elements.namedItem('due_date') as HTMLInputElement).value ? new Date((form.elements.namedItem('due_date') as HTMLInputElement).value).toISOString() : undefined,
      remind_at: (form.elements.namedItem('remind_at') as HTMLInputElement).value ? new Date((form.elements.namedItem('remind_at') as HTMLInputElement).value).toISOString() : undefined
    };

    console.log('📤 Manual form data:', data);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/diagnostic/echo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      console.log('📥 Manual form response:', result);
      alert('Check console for results');
    } catch (e) {
      console.error('❌ Manual form failed:', e);
      alert('Error: ' + e);
    }
  };

  if (!userId || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Not Authenticated</h1>
          <p className="text-gray-700">Please log in first, then return to this page.</p>
          <a href="/auth/signin" className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 Diagnostic Suite</h1>
          <p className="text-gray-600 mb-4">
            This page runs comprehensive tests to identify where data is being lost.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>User ID:</strong> {userId}<br />
              <strong>Token:</strong> {token.substring(0, 20)}...
            </p>
          </div>
          <button
            onClick={runFullDiagnostic}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg"
          >
            {loading ? '🔄 Running Tests...' : '▶️ Run Full Diagnostic'}
          </button>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Results</h2>
            <div className="space-y-4">
              {results.tests?.map((test: any, index: number) => (
                <div
                  key={index}
                  className={`border rounded-md p-4 ${
                    test.status === 'PASS' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                  }`}
                >
                  <h3 className="font-bold text-lg mb-2">
                    {test.status === 'PASS' ? '✅' : '❌'} {test.name}
                  </h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(test, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <h3 className="font-bold text-lg mb-2">📋 Full Results JSON</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🧪 Manual Test Form</h2>
          <p className="text-gray-600 mb-4">
            Use this form to test with custom values. Results will appear in the browser console.
          </p>
          <form onSubmit={testManualForm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                name="title"
                type="text"
                required
                defaultValue="Manual Test Task"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                name="description"
                type="text"
                defaultValue="Testing manually"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                defaultValue="high"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input
                name="tags"
                type="text"
                defaultValue="manual,test,diagnostic"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                name="due_date"
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reminder</label>
              <input
                name="remind_at"
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-medium"
            >
              Submit Manual Test
            </button>
          </form>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="font-bold text-lg text-yellow-900 mb-2">💡 Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-900">
            <li>Click "Run Full Diagnostic" button above</li>
            <li>Open browser console (F12) to see detailed logs</li>
            <li>Wait for all tests to complete</li>
            <li>Review results on this page and in console</li>
            <li>Share the console output and results JSON with support</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
