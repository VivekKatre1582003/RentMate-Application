
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, ensureUserProfile } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  phone_number: string | null;
  gender: string | null;
  college: string | null;
  hostel_room: string | null;
  department: string | null;
  year_of_study: string | null;
  bio: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from the profiles table
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId as any)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        
        // If no profile exists, try to create one
        const profileCreated = await ensureUserProfile(userId);
        if (profileCreated) {
          // Try fetching again
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId as any)
            .maybeSingle();
            
          if (retryError) {
            console.error('Error fetching profile after creation:', retryError);
            return null;
          }
          
          return retryData as Profile;
        }
        
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    try {
      // Ensure profile exists before updating
      await ensureUserProfile(user.id);
      
      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('id', user.id as any);

      if (error) {
        toast.error('Failed to update profile');
        console.error('Error updating profile:', error);
        return;
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : prev);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error in updateProfile:', error);
    }
  };

  // Upload avatar image
  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) {
      toast.error('You must be logged in to upload an avatar');
      return null;
    }

    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error('Failed to upload avatar');
        console.error('Error uploading avatar:', uploadError);
        return null;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('profile_images')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const avatarUrl = data.publicUrl;
      await updateProfile({ avatar_url: avatarUrl });

      return avatarUrl;
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error in uploadAvatar:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // When user signs in, fetch their profile
        if (session?.user) {
          // Use setTimeout to avoid potential deadlocks with Supabase auth
          setTimeout(async () => {
            // Ensure profile exists before fetching
            await ensureUserProfile(session.user.id);
            const userProfile = await fetchProfile(session.user.id);
            setProfile(userProfile);
          }, 0);
        } else {
          setProfile(null);
        }

        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast.success('Signed in successfully!');
        } else if (event === 'SIGNED_OUT') {
          toast.success('Signed out successfully!');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Fetch profile for existing session
      if (session?.user) {
        // Ensure profile exists before fetching
        await ensureUserProfile(session.user.id);
        const userProfile = await fetchProfile(session.user.id);
        setProfile(userProfile);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
    updateProfile,
    uploadAvatar
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
