import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (data) {
            setProfile(data);
        } else {
            const { data: { session } } = await supabase.auth.getSession();
            const displayName = session?.user?.user_metadata?.username || session?.user?.user_metadata?.display_name || 'Gamer';
            const { data: newP } = await supabase.from('profiles').upsert({
                id: userId,
                username: displayName,
                display_name: displayName,
                jump_balance: 0,
                coin_balance: 0
            }).select().single();
            if (newP) setProfile(newP);
        }
    } catch (e) {
        console.error("Helix: Fetch profile error", e);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
      } else {
          setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
      } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const addJumpPoints = useCallback(async (amount: number) => {
    if (!user) return;
    try {
        // Try atomic update
        const { error } = await supabase.rpc('increment_jump_balance', {
            user_id: user.id,
            amount: amount
        });

        if (error) {
            console.warn("RPC failed, falling back to manual update");
            const { data: curr } = await supabase.from('profiles').select('jump_balance').eq('id', user.id).single();
            const total = (curr?.jump_balance || 0) + amount;
            await supabase.from('profiles').update({ jump_balance: total }).eq('id', user.id);
        }

        // Force Sync
        await fetchProfile(user.id);
    } catch (e) {
        console.error("Jump point sync failed", e);
    }
  }, [user, fetchProfile]);

  const addViralCoins = useCallback(async (amount: number) => {
    if (!user) return;
    try {
        // Try atomic update
        const { error } = await supabase.rpc('increment_coin_balance', {
            user_id: user.id,
            amount: amount
        });

        if (error) {
            console.warn("RPC failed, falling back to manual update");
            const { data: curr } = await supabase.from('profiles').select('coin_balance').eq('id', user.id).single();
            const total = (curr?.coin_balance || 0) + amount;
            await supabase.from('profiles').update({ coin_balance: total }).eq('id', user.id);
        }

        // Force Sync
        await fetchProfile(user.id);
    } catch (e) {
        console.error("Coin sync failed", e);
    }
  }, [user, fetchProfile]);

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const signUp = async (email: string, pass: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { username, display_name: username } }
    });
    if (error) throw error;
    if (data.user) {
        await supabase.from('profiles').upsert({
            id: data.user.id,
            username,
            display_name: username,
            jump_balance: 0,
            coin_balance: 0
        });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, profile, loading, signIn, signInWithGoogle, signUp, addJumpPoints, addViralCoins, signOut, supabase, fetchProfile };
}
