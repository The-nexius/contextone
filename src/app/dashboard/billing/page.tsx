'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function BillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      
      if (!token && !userId) {
        router.push('/login');
        return;
      }
      
      // Get user info from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Check subscription status (stored locally for now)
      const isPro = localStorage.getItem('isPro') === 'true';
      setSubscription(isPro ? { status: 'active' } : null);
      
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const handleUpgrade = async (priceId: string) => {
    // Use Stripe Checkout client-side
    const stripePublicKey = 'pk_live_51TGjNtLuC3JmG6jsIhljemROTLIBjOAULXRgix6OKjZ8ce6Zj6xlyEOBUOLRI7khXV92h01evX3eyL3T7Tdg5HyR00glsy0lnf';
    
    // @ts-ignore
    if (!window.Stripe) {
      // Load Stripe.js
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => createCheckout(priceId);
      document.head.appendChild(script);
    } else {
      createCheckout(priceId);
    }
    
    function createCheckout(id: string) {
      // @ts-ignore
      const stripe = window.Stripe(stripePublicKey);
      
      // For demo, redirect to Stripe checkout
      // In production, you'd create a session server-side
      const prices: Record<string, string> = {
        'price_1TGk6aLuC3JmG6jsAIy4WS3Q': 'price_1TGk6aLuC3JmG6jsAIy4WS3Q',
        'price_1TGk6bLuC3JmG6jsR5YU1LKt': 'price_1TGk6bLuC3JmG6jsR5YU1LKt'
      };
      
      // Use Stripe Checkout in redirect mode
      stripe.redirectToCheckout({
        lineItems: [{ price: id, quantity: 1 }],
        mode: 'subscription',
        successUrl: window.location.origin + '/dashboard?upgraded=true',
        cancelUrl: window.location.origin + '/dashboard/billing'
      }).catch((err: any) => {
        alert('Failed to open Stripe. Please try again.');
      });
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
            <p style={{ color: '#888' }}>Your plan: Pro</p>
            <p style={{ color: '#888' }}>Status: {subscription.status}</p>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Choose Your Plan</h2>
            
            <div 
              onClick={() => handleUpgrade('price_1TGk6aLuC3JmG6jsAIy4WS3Q')}
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
              onClick={() => handleUpgrade('price_1TGk6bLuC3JmG6jsR5YU1LKt')}
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