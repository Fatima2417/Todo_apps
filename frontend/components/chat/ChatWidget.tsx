'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { API_ENDPOINTS, API_BASE_URL } from '@/lib/config';
import { useQueryClient } from '@tanstack/react-query';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage = { role: 'user', content: input };
    const userInput = input; // Save input before clearing
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const authData = localStorage.getItem('todo-app-auth');
      if (!authData) {
        throw new Error('No authentication data found in localStorage. Please log in again.');
      }

      const token = JSON.parse(authData).token;
      if (!token) {
        throw new Error('No token found in authentication data. Please log in again.');
      }

      console.log('💬 Sending chat message:', userInput);
      console.log('Sending request to:', API_ENDPOINTS.CHAT);

      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userInput,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        let errorDetail = "";
        try {
          const errorJson = await response.json();
          errorDetail = errorJson.detail || JSON.stringify(errorJson);
        } catch (e) {
          errorDetail = await response.text();
        }

        console.error('Backend error:', response.status, errorDetail);

        if (response.status === 401) {
          throw new Error('Your session has expired or is invalid. Please log out and log in again.');
        }

        throw new Error(`Server Error (${response.status}): ${errorDetail.substring(0, 200)}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text();
        console.error('Failed to parse response as JSON:', text);
        throw new Error('Invalid response format from server');
      }

      console.log('📥 Chat response:', data);

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      setConversationId(data.conversation_id);

      // CRITICAL: Refresh tasks after ANY chat operation
      // Check if tool calls exist
      if (data.tool_calls && data.tool_calls.length > 0) {
        console.log('🔧 Tool calls detected:', data.tool_calls.length, 'tools');
        for (const call of data.tool_calls) {
          console.log(`🔧 Processing tool: ${call.tool}`, call);
        }

        // Invalidate React Query cache to trigger automatic refetch
        console.log('🔄 Invalidating tasks cache after tool calls...');
        await queryClient.invalidateQueries({ queryKey: ['tasks', user.id] });
        console.log('✅ Tasks cache invalidated - UI will auto-refresh');
      } else {
        // Even without tool calls, check if response mentions task operations
        const responseText = data.response.toLowerCase();
        const taskKeywords = ['created', 'added', 'updated', 'deleted', 'completed', 'task'];
        const hasTaskOperation = taskKeywords.some(keyword => responseText.includes(keyword));

        if (hasTaskOperation) {
          console.log('🔍 Task operation detected in response text');
          console.log('🔄 Invalidating tasks cache...');
          await queryClient.invalidateQueries({ queryKey: ['tasks', user.id] });
          console.log('✅ Tasks cache invalidated - UI will auto-refresh');
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}. Please check if the backend is running at ${API_BASE_URL} and you are logged in.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-2xl w-80 sm:w-96 flex flex-col h-[500px] border border-gray-200">
          <div className="p-4 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Todo Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-gray-500 text-center text-sm mt-4">
                Hi {user.email}! I'm your AI assistant. How can I help you today?
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 max-w-[80%] p-3 rounded-lg text-sm italic">
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
