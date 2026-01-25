import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = async (userId) => {
    if (profileLoading) return;
    setProfileLoading(true);
    try {
      console.log('[Auth] Fetching profile for:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn('[Auth] Profile fetch error (expected for new users):', error.message);
      } else if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('[Auth] Profile fetch exception:', error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initial State Check
    const initialize = async () => {
      try {
        console.log('[Auth] Checking initial session...');
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          // Set loading to false IMMEDIATELY once session is known
          setLoading(false); 
          if (initialSession?.user) {
            fetchProfile(initialSession.user.id);
          }
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
        if (mounted) setLoading(false);
      }
    };

    initialize();

    // 2. State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[Auth] Event:', event);
      if (!mounted) return;

      setSession(currentSession);
      setLoading(false); // Ensure UI isn't hung

      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user: session?.user,
    profile,
    loading,
    profileLoading,
    refreshProfile: () => session?.user && fetchProfile(session.user.id)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
