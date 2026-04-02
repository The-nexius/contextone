'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    fetch('https://contextone.space/api/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setUser(data);
      setFormData(prev => ({ ...prev, name: data.name || '', email: data.email || '' }));
    })
    .catch(() => router.push('/login'))
    .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setSaving(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    const updates: any = { name: formData.name };
    
    if (formData.newPassword) {
      updates.password = formData.newPassword;
    }
    
    try {
      const res = await fetch('https://contextone.space/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      if (res.ok) {
        setMessage('Settings saved successfully!');
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        setMessage('Failed to save settings');
      }
    } catch {
      setMessage('Error saving settings');
    }
    
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    if (!confirm('This will permanently delete all your data. Continue?')) return;
    
    const token = localStorage.getItem('token');
    await fetch('https://contextone.space/api/users/me', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    localStorage.removeItem('token');
    router.push('/');
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
        <p style={{ color: '#888', marginBottom: '32px' }}>Manage your account settings</p>
        
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
        
        <form onSubmit={handleSubmit} style={{ background: '#1a1a2e', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#00d4ff' }}>Profile</h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#888', fontSize: '14px' }}
            />
          </div>
          
          <button
            type="submit"
            disabled={saving}
            style={{ padding: '12px 24px', background: '#00d4ff', border: 'none', borderRadius: '8px', color: '#1a1a2e', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
        
        <form onSubmit={handleSubmit} style={{ background: '#1a1a2e', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#00d4ff' }}>Change Password</h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>New Password</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
            />
          </div>
          
          <button
            type="submit"
            disabled={saving}
            style={{ padding: '12px 24px', background: '#00d4ff', border: 'none', borderRadius: '8px', color: '#1a1a2e', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        
        <div style={{ background: '#1a1a2e', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,0,0,0.3)' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '12px', color: '#ff4444' }}>Danger Zone</h2>
          <p style={{ color: '#888', marginBottom: '16px', fontSize: '14px' }}>Once you delete your account, there is no going back.</p>
          <button
            onClick={handleDeleteAccount}
            style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #ff4444', borderRadius: '8px', color: '#ff4444', cursor: 'pointer' }}
          >
            Delete Account
          </button>
        </div>
      </main>
    </div>
  );
}