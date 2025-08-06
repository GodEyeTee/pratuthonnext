'use client';

import { createClient } from '@/lib/supabaseClient';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';

export default function GoogleButton() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error('Error logging in with Google:', error);
        alert('เกิดข้อผิดพลาดในการล็อกอิน กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      ) : (
        <FcGoogle className="w-5 h-5 mr-2" />
      )}
      {loading ? 'กำลังล็อกอิน...' : 'ล็อกอินด้วย Google'}
    </button>
  );
}
