'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  content: string;
  tool: string;
  timestamp: string;
  role: string;
}

interface CloudMessage {
  id: string;
  encrypted_blob: string;
  iv: string;
  tool: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [cloudMessages, setCloudMessages] = useState<CloudMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isPro, setIsPro] = useState(false);
  const [masterKey, setMasterKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState<Message[]>([]);
  const masterKeyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user_id', session.user.id);
      }
    });
    
    checkAuth();
    
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isPro && masterKey) {
      // Start polling every 5 seconds
      const interval = setInterval(() => {
        fetchCloudMessages();
      }, 5000);
      
      // Initial fetch
      fetchCloudMessages();
      
      return () => clearInterval(interval);
    }
  }, [isPro, masterKey]);

  const checkAuth = async () => {
    // Check localStorage token first (set by login)
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    // If we have a token, we're logged in
    if (token || userId) {
      // Check if Pro user
      const isProUser = localStorage.getItem('isPro') === 'true';
      setIsPro(isProUser);
      setLoading(false);
      return;
    }
    
    // Fallback: check Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    // Store session info
    localStorage.setItem('token', session.access_token);
    localStorage.setItem('user_id', session.user.id);
    
    // Check if Pro user
    const isProUser = localStorage.getItem('isPro') === 'true';
    setIsPro(isProUser);
    
    setLoading(false);
  };

  const fetchCloudMessages = async () => {
    if (!masterKey) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Fetch encrypted messages from Supabase
      const { data, error } = await supabase
        .from('encrypted_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.log('Error fetching cloud messages:', error);
        return;
      }
      
      setCloudMessages(data || []);
      setLastUpdated(new Date());
      
      // Decrypt messages
      const decrypted = await decryptMessages(data || [], masterKey);
      setDecryptedMessages(decrypted);
    } catch (err) {
      console.log('Error:', err);
    }
  };

  const decryptMessages = async (cloudMsgs: CloudMessage[], key: string): Promise<Message[]> => {
    // For now, return as-is (decryption would happen client-side)
    // In production, use Web Crypto API to decrypt
    return cloudMsgs.map(msg => ({
      id: msg.id,
      content: msg.encrypted_blob, // Would be decrypted
      tool: msg.tool,
      timestamp: msg.created_at,
      role: 'user'
    }));
  };

  const handleMasterKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const key = masterKeyInputRef.current?.value;
    if (key && key.length >= 8) {
      setMasterKey(key);
      setShowKeyModal(false);
    }
  };

  const getToolIcon = (tool: string) => {
    const icons: Record<string, string> = {
      'claude': '🤖',
      'chatgpt': '💬',
      'perplexity': '🔍',
      'gemini': '✨',
      'grok': '🚀'
    };
    return icons[tool] || '🤖';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

      {/* Live Indicator */}
      {isPro && (
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-full">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <span className="text-cyan-400 text-sm font-medium">LIVE</span>
          </div>
          <span className="text-gray-500 text-sm">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-cyan-400 mb-1">
            {isPro ? decryptedMessages.length : 0}
          </div>
          <div className="text-gray-400 text-sm">Messages in Cloud</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-cyan-400 mb-1">
            {isPro ? '🔒 Encrypted' : '🔓 Local Only'}
          </div>
          <div className="text-gray-400 text-sm">Storage Mode</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-cyan-400 mb-1">
            {isPro ? '✅ Active' : '❌ Inactive'}
          </div>
          <div className="text-gray-400 text-sm">Cloud Sync</div>
        </div>
      </div>

      {/* Recent Captures - Live Feed */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Captures</h2>
        
        {!isPro ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Upgrade to Pro for cloud sync and live dashboard</p>
            <Link 
              href="/dashboard/billing"
              className="inline-block px-6 py-3 bg-cyan-500 text-gray-900 font-semibold rounded-lg hover:bg-cyan-400 transition"
            >
              Upgrade to Pro
            </Link>
          </div>
        ) : !masterKey ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Enter your master key to view encrypted messages</p>
            <button 
              onClick={() => setShowKeyModal(true)}
              className="px-6 py-3 bg-cyan-500 text-gray-900 font-semibold rounded-lg hover:bg-cyan-400 transition"
            >
              Enter Master Key
            </button>
          </div>
        ) : decryptedMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No messages captured yet. Start using the extension!
          </div>
        ) : (
          <div className="space-y-3">
            {decryptedMessages.map((msg) => (
              <div 
                key={msg.id}
                className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg"
              >
                <span className="text-xl">{getToolIcon(msg.tool)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-cyan-400 text-sm font-medium capitalize">{msg.tool}</span>
                    <span className="text-gray-500 text-xs">{formatTime(msg.timestamp)}</span>
                  </div>
                  <p className="text-gray-300 text-sm truncate">
                    {msg.content.substring(0, 100)}
                    {msg.content.length > 100 ? '...' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Master Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">🔐 Enter Master Key</h3>
            <form onSubmit={handleMasterKeySubmit}>
              <input
                ref={masterKeyInputRef}
                type="password"
                placeholder="Enter your master key"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4"
                minLength={8}
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-cyan-500 text-gray-900 font-semibold rounded-lg hover:bg-cyan-400"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}