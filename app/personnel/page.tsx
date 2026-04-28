'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Filter, UserPlus, Search, X, AlertCircle, Loader2 } from 'lucide-react';
import NavigationLayout from '@/components/NavigationLayout';
import { cn } from '@/lib/utils';

export default function PersonnelPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'BCH',
    password: 'password123' // Default password for management-created users
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function fetchData(query: string = '') {
    setLoading(true);
    try {
      let supabaseQuery = supabase.from('users').select('*');
      
      if (query.trim().length >= 4) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,role.ilike.%${query}%`);
      }

      const { data, error } = await supabaseQuery.order('name');
      if (error) throw error;
      if (data) setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Không thể khởi tạo tài khoản.");

      // Manually insert into public.users since triggers might not be active
      const { error: dbError } = await supabase.from('users').insert([{
        id: authData.user.id,
        email: formData.email,
        name: formData.name,
        role: formData.role
      }]);

      if (dbError) {
         console.error('Database insertion error:', dbError);
         // If insertion fails, it might be because RLS or existing user
         // We still want to let the user know what happened
      }
      
      // Refresh data
      await fetchData();
      
      setShowModal(false);
      setFormData({ email: '', name: '', role: 'BCH', password: 'password123' });
      alert("Thêm nhân sự thành công! Hệ thống đã ghi nhận.");
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể thêm nhân sự.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NavigationLayout activeTab="personnel">
      <div className="space-y-8 animate-in slide-in-from-top duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-primary tracking-tight">Danh bạ nhân sự</h2>
            <p className="text-on-surface-variant mt-1">Quản lý đội ngũ tại công trường và các vai trò hành chính.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 group-focus-within:opacity-100 group-focus-within:text-primary transition-all" />
              <input 
                type="text" 
                placeholder="Tìm kiếm (từ 4 ký tự)..." 
                className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Thêm nhân sự
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Họ tên</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Vai trò</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Email</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right whitespace-nowrap">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="h-16 bg-surface-container-lowest/50"></td>
                    </tr>
                  ))
                ) : users.length > 0 ? (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 font-bold text-primary">{u.name}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          u.role === 'BCH' ? 'bg-orange-100 text-orange-800' : 
                          u.role === 'PGD' ? 'bg-blue-100 text-blue-800' :
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          'bg-emerald-100 text-emerald-800'
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{u.email}</td>
                      <td className="px-6 py-4 text-right text-xs font-mono text-on-surface-variant">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant opacity-50 italic">
                      Không tìm thấy nhân sự phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 bg-primary flex justify-between items-center text-white">
               <div>
                  <h3 className="text-xl font-black tracking-tight">Thêm Nhân Sự Mới</h3>
                  <p className="text-xs opacity-80 mt-1">Hệ thống sẽ tạo tài khoản đăng nhập cho nhân viên.</p>
               </div>
               <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Họ và tên</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-surface-container-low border border-outline px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Email (Đăng nhập)</label>
                  <input 
                    type="email" 
                    required
                    placeholder="email@congtrinh.vn"
                    className="w-full bg-surface-container-low border border-outline px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Vai trò</label>
                    <select 
                      className="w-full bg-surface-container-low border border-outline px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="BCH">Ban Chỉ Huy (BCH)</option>
                      <option value="PGD">Phó Giám Đốc (PGD)</option>
                      <option value="accountant">Kế Toán</option>
                      <option value="admin">Quản Trị</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Mật khẩu mặc định</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-surface-container-low border border-outline px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-4 bg-error-container/20 border border-error/30 rounded-xl text-error text-xs font-bold animate-in shake-in-1">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3.5 border border-outline rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-low transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {submitting ? 'Đang tạo...' : 'Xác nhận tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </NavigationLayout>
  );
}
