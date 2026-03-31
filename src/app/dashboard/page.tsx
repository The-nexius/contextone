'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TodoList from '@/components/TodoList';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  conversation_count: number;
}

interface Stats {
  total_projects: number;
  total_conversations: number;
  total_injections: number;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_projects: 0,
    total_conversations: 0,
    total_injections: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [projectsRes, statsRes] = await Promise.all([
        fetch('${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-gray-400">Here&apos;s an overview of your AI memory</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-cyan-400 mb-1">{stats.total_projects}</div>
          <div className="text-gray-400 text-sm">Active Projects</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-cyan-400 mb-1">{stats.total_conversations}</div>
          <div className="text-gray-400 text-sm">Conversations Stored</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-cyan-400 mb-1">{stats.total_injections}</div>
          <div className="text-gray-400 text-sm">Contexts Injected</div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Your Projects</h2>
        <Link
          href="/dashboard/projects"
          className="text-cyan-400 hover:text-cyan-300 text-sm"
        >
          View all →
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-white font-medium mb-2">No projects yet</h3>
          <p className="text-gray-400 mb-4">Create your first project to start organizing your AI conversations</p>
          <Link
            href="/dashboard/projects"
            className="inline-block px-4 py-2 bg-cyan-400 text-gray-900 font-medium rounded-lg hover:bg-cyan-300 transition-colors"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 6).map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-cyan-400/50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 bg-cyan-400/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📁</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="text-xs text-gray-500 mt-3">
                {project.conversation_count || 0} conversations
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-white font-medium mb-2">🔌 Install Extension</h3>
          <p className="text-gray-400 text-sm mb-4">
            Download and install the Chrome extension to start capturing context
          </p>
          <button className="text-cyan-400 hover:text-cyan-300 text-sm">
            Download → 
          </button>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-white font-medium mb-2">💳 Upgrade to Pro</h3>
          <p className="text-gray-400 text-sm mb-4">
            Get cloud sync, unlimited projects, and priority support
          </p>
          <Link href="/dashboard/billing" className="text-cyan-400 hover:text-cyan-300 text-sm">
            View plans →
          </Link>
        </div>
      </div>

      {/* Launch Progress */}
      <div className="mt-12">
        <TodoList />
      </div>
    </div>
  );
}