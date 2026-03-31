'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check for error in URL params
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (errorParam) {
          console.error('OAuth error:', errorParam, errorDescription);
          setStatus('Authentication failed. Redirecting...');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        // Check for code in query params (Supabase OAuth flow)
        const code = searchParams.get('code');
        
        if (code) {
          // Exchange code for session
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (sessionError) {
            console.error('Session exchange error:', sessionError);
            setStatus('Authentication failed. Redirecting...');
            setTimeout(() => router.push('/login'), 2000);
            return;
          }
        }

        // Check for tokens in URL hash (alternative Supabase OAuth callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
        }

        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          setStatus('Authentication failed. Redirecting...');
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        if (session) {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            setStatus('Setting up your account...');
            
            // Call backend to create JWT
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.contextone.space'}/api/v1/auth/oauth/callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: session.access_token })
              });

              if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user_id', data.user_id);
                localStorage.setItem('user', JSON.stringify({
                  id: user.id,
                  email: user.email,
                  name: user.user_metadata?.full_name || user.email?.split('@')[0]
                }));
              }
            } catch (e) {
              console.error('Backend callback error:', e);
              // Continue anyway with Supabase session
            }
            
            localStorage.setItem('user', JSON.stringify({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.email?.split('@')[0]
            }));
            
            setStatus('Success! Redirecting to dashboard...');
            setTimeout(() => router.push('/dashboard'), 1000);
          }
        } else {
          // No session - redirect to login
          console.error('No session found after OAuth');
          router.push('/login');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('Authentication failed. Redirecting...');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p className="text-white text-lg">{status}</p>
      </div>
    </div>
  );
}