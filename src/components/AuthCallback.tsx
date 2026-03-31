'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check for error in URL
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (errorParam) {
          console.error('OAuth error:', errorParam, errorDescription);
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => router.push('/login?error=oauth_failed'), 2000);
          return;
        }

        // Check for code in query params (Supabase OAuth flow)
        const code = searchParams.get('code');
        
        if (code) {
          console.log('Exchanging code for session...');
          setStatus('Completing authentication...');
          
          // Exchange code for session
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (sessionError) {
            console.error('Session exchange error:', sessionError);
            setStatus('Authentication failed. Redirecting to login...');
            setTimeout(() => router.push('/login?error=session_failed'), 2000);
            return;
          }
          
          console.log('Session obtained:', sessionData);
        }

        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Get session error:', error);
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => router.push('/login?error=get_session_failed'), 2000);
          return;
        }

        if (session) {
          console.log('Session found, user:', session.user);
          
          // Store session info
          localStorage.setItem('token', session.access_token);
          localStorage.setItem('user_id', session.user.id);
          localStorage.setItem('user', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
          }));
          
          setStatus('Success! Redirecting to dashboard...');
          setTimeout(() => router.push('/dashboard'), 1000);
        } else {
          // No session - try to get from URL hash
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('Setting session from hash...');
            const { error: setError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (!setError) {
              setStatus('Success! Redirecting to dashboard...');
              setTimeout(() => router.push('/dashboard'), 1000);
              return;
            }
          }
          
          console.error('No session found');
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => router.push('/login?error=no_session'), 2000);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('Authentication failed. Redirecting to login...');
        setTimeout(() => router.push('/login?error=callback_error'), 2000);
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