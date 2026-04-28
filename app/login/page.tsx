'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [configMissing, setConfigMissing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || (supabaseUrl && supabaseUrl.includes('placeholder'))) {
      setConfigMissing(true);
    }

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push('/dashboard');
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (configMissing) {
      setErrorMsg("LỖI CẤU HÌNH: Vui lòng kiểm tra lại NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong Settings -> Secrets.");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        if (!data.session) {
          setErrorMsg("Đã đăng nhập thành công nhưng không có session. Kiểm tra lại cấu hình Supabase.");
          return;
        }
        router.push('/dashboard');
      } else {
        // Handle specific Supabase Auth errors
        let msg = error.message;
        if (msg.includes("Email not confirmed")) {
          msg = "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư hoặc bật 'Confirm Email' trong Supabase Auth Settings.";
        } else if (msg.includes("Invalid login credentials")) {
          msg = "Email hoặc mật khẩu không chính xác. Hãy đảm bảo bạn đã tạo tài khoản trong mục Authentication của Supabase.";
        }
        setErrorMsg(msg);
        console.error("Login Error:", error);
      }
    } catch (err: any) {
      setErrorMsg("Đã xảy ra lỗi không mong muốn: " + (err.message || "Unknown error"));
      console.error("Catch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const [debugVisible, setDebugVisible] = useState(false);

  return (
    <div className="min-h-screen bg-surface-container flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-outline-variant p-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 hover:rotate-0 transition-transform">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tight">ProForeman</h1>
          <p className="text-on-surface-variant font-bold text-sm mt-2 uppercase tracking-widest">Xác thực quản lý công trình</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Email Đăng nhập</label>
            <input 
              type="email" 
              placeholder="nhan_vien@proforeman.vn"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary p-4 rounded-xl outline-none transition-all font-bold text-sm"
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Mật khẩu bảo mật</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary p-4 rounded-xl outline-none transition-all font-bold text-sm"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'ĐANG XÁC THỰC...' : 'TRUY CẬP CỔNG THÔNG TIN'}
            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>

          {errorMsg && (
            <div className="flex flex-col gap-2 p-4 bg-error-container/20 border border-error/20 rounded-xl text-error text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{errorMsg}</p>
              </div>
              <button 
                type="button"
                onClick={() => setDebugVisible(!debugVisible)}
                className="text-[10px] underline text-left opacity-70 hover:opacity-100"
              >
                {debugVisible ? 'Ẩn Debug' : 'Hiện thông tin Debug'}
              </button>
              {debugVisible && (
                <div className="mt-2 p-2 bg-black/5 rounded font-mono text-[9px] break-all">
                  URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Missing'}<br/>
                  Key: {process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.substring(0, 10) + '...') : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...') : 'Missing')}
                </div>
              )}
            </div>
          )}
        </form>

        <div className="mt-8 pt-8 border-t border-outline-variant text-center">
            <p className="text-[10px] text-on-surface-variant font-bold leading-relaxed">
              Hệ thống độc quyền. Truy cập trái phép sẽ được giám sát <br/> và ghi lại trên máy chủ kiểm tra trung tâm.
            </p>
        </div>
      </div>
    </div>
  );
}
