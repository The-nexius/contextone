'use client';

import { useState } from 'react';

interface Todo {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}

const initialTodos: Todo[] = [
  { id: '1', content: 'Security Audit - Verify JWT tokens, encryption, API security, RLS on Supabase', status: 'completed' },
  { id: '2', content: 'Test Extension on ALL 5 AI Tools (ChatGPT, Claude, Gemini, Perplexity, Grok)', status: 'completed' },
  { id: '3', content: 'Fix any bugs found during testing', status: 'completed' },
  { id: '4', content: 'Performance optimization - Add Redis caching if needed', status: 'pending' },
  { id: '5', content: 'Prepare Chrome Web Store assets (screenshots, privacy policy)', status: 'completed' },
  { id: '6', content: 'Submit to Chrome Web Store', status: 'completed' },
];

const statusColors = {
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const statusLabels = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Done',
};

export default function TodoList() {
  const [todos] = useState<Todo[]>(initialTodos);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  const filteredTodos = todos.filter(todo => 
    filter === 'all' || todo.status === filter
  );

  const completedCount = todos.filter(t => t.status === 'completed').length;
  const progress = Math.round((completedCount / todos.length) * 100);

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Launch Checklist
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Phase 2: Polish & Launch Progress
        </p>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">
              {completedCount} of {todos.length} completed
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'in_progress', 'pending', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === status
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {status === 'all' ? 'All' : statusLabels[status]}
          </button>
        ))}
      </div>

      {/* Todo List */}
      <div className="space-y-3">
        {filteredTodos.map((todo) => (
          <div
            key={todo.id}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              todo.status === 'completed'
                ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/10'
                : todo.status === 'in_progress'
                ? 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/10'
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            }`}
          >
            {/* Status Icon */}
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              todo.status === 'completed'
                ? 'bg-green-500'
                : todo.status === 'in_progress'
                ? 'bg-blue-500 animate-pulse'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}>
              {todo.status === 'completed' && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {todo.status === 'in_progress' && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <p className={`font-medium ${
                todo.status === 'completed'
                  ? 'text-gray-500 line-through dark:text-gray-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {todo.content}
              </p>
            </div>

            {/* Status Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[todo.status]}`}>
              {statusLabels[todo.status]}
            </span>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTodos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No tasks found with this filter.
          </p>
        </div>
      )}
    </div>
  );
}