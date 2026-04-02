'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    fetch('https://contextone.space/api/v1/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setUser(data);
      // Check subscription status
      return fetch('https://contextone.space/api/v1/billing/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    })
    .then(res => res.json())
    .then(subData => {
      setSubscription(subData);
    })
    .catch(() => router.push('/login'))
    .finally(() => setLoading(false));
  }, [router]);

  const handleUpgrade = async (priceId: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch('https://contextone.space/api/v1/billing/create-checkout', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ price_id: priceId })
    });
    const data = await res.json();
    if (data.checkout_url) {
      window.open(data.checkout_url, '_blank');
    }
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
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Billing</h1>
        <p style={{ color: '#888', marginBottom: '32px' }}>Manage your subscription</p>
        
        {subscription?.status === 'active' ? (
          <div style={{ background: '#1a1a2e', padding: '24px', borderRadius: '12px', border: '1px solid rgba(0,255,0,0.3)' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '12px', color: '#00ff00' }}>✅ Active Subscription</h2>
            <p style={{ color: '#888' }}>Your plan: {subscription.plan || 'Pro'}</p>
            <p style={{ color: '#888' }}>Status: {subscription.status}</p>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Choose Your Plan</h2>
            
            <div 
              onClick={() => handleUpgrade('prod_UFEZ2AiI2RZp49')}
              style={{ background: 'rgba(0,212,255,0.1)', padding: '20px', borderRadius: '12px', marginBottom: '16px', border: '2px solid #00d4ff', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Individual</div>
                  <div style={{ color: '#888', fontSize: '13px' }}>For personal use</div>
                </div>
                <div style={{ color: '#00d4ff', fontSize: '24px', fontWeight: 'bold' }}>$9<span style={{ fontSize: '14px', color: '#888' }}>/mo</span></div>
              </div>
            </div>
            
            <div 
              onClick={() => handleUpgrade('prod_UFEZrYvcWrEW8W')}
              style={{ background: 'rgba(157,78,221,0.1)', padding: '20px', borderRadius: '12px', marginBottom: '16px', border: '2px solid #9d4edd', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Team</div>
                  <div style={{ color: '#888', fontSize: '13px' }}>Up to 10 members</div>
                </div>
                <div style={{ color: '#9d4edd', fontSize: '24px', fontWeight: 'bold' }}>$29<span style={{ fontSize: '14px', color: '#888' }}>/mo</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}