'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  conversation_count: number;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    if (!token && !userId) {
      router.push('/login');
      return;
    }
    
    loadProjects();
  };

  const loadProjects = async () => {
    // Load from localStorage (Supabase later)
    const stored = localStorage.getItem('projects');
    if (stored) {
      setProjects(JSON.parse(stored));
    }
    setLoading(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const newProj = {
      id: Date.now().toString(),
      name: newProject.name,
      description: newProject.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      conversation_count: 0
    };
    
    const updated = [newProj, ...projects];
    setProjects(updated);
    localStorage.setItem('projects', JSON.stringify(updated));
    setShowModal(false);
    setNewProject({ name: '', description: '' });
    setSubmitting(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem('projects', JSON.stringify(updated));
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-400">Organize your AI conversations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-cyan-400 text-gray-900 font-medium rounded-lg hover:bg-cyan-300 transition-colors"
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-white font-medium mb-2">No projects yet</h3>
          <p className="text-gray-400 mb-4">Create your first project to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-block px-4 py-2 bg-cyan-400 text-gray-900 font-medium rounded-lg hover:bg-cyan-300 transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-cyan-400/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-cyan-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📁</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{project.name}</h3>
                    {project.description && (
                      <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{project.conversation_count || 0} conversations</span>
                      <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="px-3 py-1 text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="px-3 py-1 text-sm text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  placeholder="e.g., Real Estate Lead Gen"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 h-24 resize-none"
                  placeholder="What is this project about?"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-cyan-400 text-gray-900 font-medium rounded-lg hover:bg-cyan-300 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}