import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    // Check if we have recovery parameters in the URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    if (accessToken && refreshToken && type === 'recovery') {
      setIsRecoveryMode(true);
      
      // Set the session with the recovery tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error setting recovery session:', error);
          toast.error('Invalid or expired recovery link. Please request a new one.');
          navigate('/forgot-password');
        }
      });
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
      } else if (event === "SIGNED_OUT") {
        // If user signs out, redirect to auth page
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isRecoveryMode) {
      toast.error("Please use the recovery link from your email to reset your password.");
      return;
    }

    if (!password || !confirm) {
      toast.error("Please fill in both password fields");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success("Password updated successfully! You can now sign in with your new password.");
      
      // Sign out the user after successful password update
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (err: any) {
      console.error('Password update error:', err);
      toast.error(err?.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRecoveryMode) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <div className="rentmate-container pt-28 pb-20">
            <div className="max-w-md mx-auto">
              <div className="glass rounded-2xl p-8 shadow-lg text-center">
                <h1 className="text-2xl font-bold mb-4">Invalid Reset Link</h1>
                <p className="text-muted-foreground mb-6">
                  This reset link is invalid or has expired. Please request a new password reset link.
                </p>
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full py-3 bg-rentmate-orange text-white rounded-xl hover:bg-rentmate-orange/90 transition-colors"
                >
                  Request New Reset Link
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="rentmate-container pt-28 pb-20">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
              <p className="text-muted-foreground">Enter your new password below.</p>
            </div>

            <div className="glass rounded-2xl p-8 shadow-lg">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium mb-1">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rentmate-orange"
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="confirm" className="block text-sm font-medium mb-1">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rentmate-orange"
                    placeholder="Re-enter new password"
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-rentmate-orange text-white rounded-xl flex items-center justify-center transition-colors hover:bg-rentmate-orange/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : null}
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;


