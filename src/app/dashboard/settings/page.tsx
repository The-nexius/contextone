'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      
      if (!token && !userId) {
        router.push('/login');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setFormData(prev => ({ ...prev, name: user?.user_metadata?.name || '', email: user?.email || '' }));
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
        <div style={{ color: '#00d4ff' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#fff' }}>
      <header style={{ background: '#1a1a2e', padding: '16px 24px', borderBottom: '1px solid rgba(0,212,255,0.2)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/dashboard" style={{ color: '#00d4ff', textDecoration: 'none', fontSize: '18px', fontWeight: '600' }}>← Back to Dashboard</a>
          <span style={{ color: '#00d4ff', fontWeight: 'bold' }}>Context One</span>
        </div>
      </header>
      
      <main style={{ maxWidth: '600px', margin: '40px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Settings</h1>
        <p style={{ color: '#888', marginBottom: '32px' }}>Manage your account</p>
        
        {message && (
          <div style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            background: message.includes('success') ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
            color: message.includes('success') ? '#00ff00' : '#ff4444'
          }}>
            {message}
          </div>
        )}
        
        <div style={{ background: '#1a1a2e', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#00d4ff' }}>Profile</h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#888', fontSize: '14px' }}
            />
          </div>
        </div>
        
        <div style={{ background: '#1a1a2e', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,0,0,0.3)' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '12px', color: '#ff4444' }}>Danger Zone</h2>
          <p style={{ color: '#888', marginBottom: '16px', fontSize: '14px' }}>Once you delete your account, there is no going back.</p>
          <button
            onClick={handleLogout}
            style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #ff4444', borderRadius: '8px', color: '#ff4444', cursor: 'pointer', marginRight: '12px' }}
          >
            Log Out
          </button>
        </div>
      </main>
    </div>
  );
}