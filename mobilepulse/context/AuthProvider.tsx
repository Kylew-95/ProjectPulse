import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { getApiUrl } from '../utils/apiConfig';
import type { Profile } from '../types/auth';
import { AuthContext } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn('Error fetching profile:', error.message);
      } else {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Exception fetching profile:', err);
    }
  };

  // Function to sync with IDP/Stripe
  const syncSubscription = async (email: string, userId: string) => {
    try {
        const apiUrl = getApiUrl();
        await fetch(`${apiUrl}/sync-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, user_id: userId })
        });
    } catch (e) {
        console.error("Sync failed", e);
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Sync first, then fetch
        if (session.user.email) {
            syncSubscription(session.user.email, session.user.id).then(() => fetchProfile(session.user.id));
        } else {
            fetchProfile(session.user.id);
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
         if (session.user.email) {
            syncSubscription(session.user.email, session.user.id).then(() => fetchProfile(session.user.id));
        } else {
             fetchProfile(session.user.id);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Realtime subscription for profile updates
    const channel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          setProfile((currentProfile) => {
             if (currentProfile && payload.new.id === currentProfile.id) {
                 return { ...currentProfile, ...payload.new } as Profile;
             }
             return currentProfile;
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const refreshProfile = async () => {
    if (session?.user) {
      if (session.user.email) await syncSubscription(session.user.email, session.user.id);
      await fetchProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user || null, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
