import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PasswordResetTest = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testPasswordReset = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log('Sending password reset email to:', email);
      console.log('Redirect URL:', redirectTo);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      
      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }
      
      console.log('Password reset email sent successfully');
      toast.success('Password reset email sent! Check your email for the reset link.');
    } catch (err: any) {
      console.error('Failed to send password reset:', err);
      toast.error(err?.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Password Reset Test</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter email to test"
          />
        </div>
        <button
          onClick={testPasswordReset}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Test Password Reset'}
        </button>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>This will send a password reset email to the specified address.</p>
        <p className="mt-2">Check the console for detailed logs.</p>
      </div>
    </div>
  );
};

export default PasswordResetTest;
