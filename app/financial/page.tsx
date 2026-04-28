'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Rocket, Search, Calendar, Save, History, Check } from 'lucide-react';
import NavigationLayout from '@/components/NavigationLayout';
import { cn } from '@/lib/utils';

export default function FinancialManagementPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [costData, setCostData] = useState({
    date: new Date().toISOString().split('T')[0],
    actual_cost: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        if (profile) setCurrentUser(profile);
      }

      const { data: pData } = await supabase.from('projects').select('*').eq('is_deleted', false).order('name');
      if (pData) setProjects(pData);
      setLoading(false);
      
      const { data: recent } = await supabase
        .from('daily_reports')
        .select('*, project:projects(name)')
        .gt('actual_cost', 0)
        .order('date', { ascending: false })
        .limit(6);
      if (recent) setRecentEntries(recent);
    }
    init();
  }, []);

  const handleLogCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setSubmitting(true);

    try {
      const { data: existing } = await supabase
        .from('daily_reports')
        .select('id, actual_cost')
        .eq('project_id', selectedProjectId)
        .eq('date', costData.date)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('daily_reports')
          .update({ actual_cost: costData.actual_cost })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('daily_reports')
          .insert([{
            project_id: selectedProjectId,
            user_id: currentUser?.id,
            date: costData.date,
            actual_cost: costData.actual_cost,
            progress_percent: 0,
            issues: '',
            suggestions: ''
          }]);
        if (error) throw error;
      }

      alert("Ghi nhận chi phí thành công!");
      setCostData({ ...costData, actual_cost: 0 });
      
      const { data: recent } = await supabase
        .from('daily_reports')
        .select('*, project:projects(name)')
        .gt('actual_cost', 0)
        .order('date', { ascending: false })
        .limit(6);
      if (recent) setRecentEntries(recent);

    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isFinancialAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'accountant';

  if (!isFinancialAuthorized && !loading) {
     return (
        <NavigationLayout activeTab="financial">
           <div className="p-12 text-center bg-white rounded-2xl border border-outline-variant shadow-sm space-y-4">
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
                 <DollarSign className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-primary">TRUY CẬP BỊ TỪ CHỐI</h2>
              <p className="text-on-surface-variant">Bạn không có quyền truy cập vào mục Quản lý chi phí.</p>
           </div>
        </NavigationLayout>
     );
  }

  return (
    <NavigationLayout activeTab="financial">
      <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-center px-2">
           <div>
              <h2 className="text-2xl font-black text-primary tracking-tight">Chi phí thực tế</h2>
              <p className="text-on-surface-variant text-sm mt-0.5">Ghi nhận ngân sách xây dựng theo từng dự án.</p>
           </div>
           <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              <Check className="w-3.5 h-3.5" />
              Kế toán Tài chính
           </div>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6 space-y-6">
           <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                 <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-primary uppercase">Nhập liệu nhanh</h3>
                 <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Ghi sổ chi phí phát sinh</p>
              </div>
           </div>

           <form onSubmit={handleLogCost} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Công trình</label>
                    <select 
                       required
                       className="w-full bg-surface-container-low border border-outline px-3 py-2.5 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-sm"
                       value={selectedProjectId || ''}
                       onChange={e => setSelectedProjectId(e.target.value)}
                    >
                       <option value="">-- Chọn công trình --</option>
                       {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                       ))}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Ngày ghi nhận</label>
                    <input 
                       type="date"
                       required
                       className="w-full bg-surface-container-low border border-outline px-3 py-2.5 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-sm"
                       value={costData.date}
                       onChange={e => setCostData({...costData, date: e.target.value})}
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Số tiền ($)</label>
                    <div className="relative">
                       <input 
                          type="number"
                          required
                          placeholder="0"
                          className="w-full bg-surface-container-low border border-outline px-3 py-2.5 pl-8 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all font-black text-primary text-sm"
                          value={costData.actual_cost}
                          onChange={e => setCostData({...costData, actual_cost: parseInt(e.target.value)})}
                       />
                       <DollarSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-primary opacity-50" />
                    </div>
                 </div>
              </div>

              <button 
                 type="submit"
                 disabled={submitting || !selectedProjectId}
                 className="w-full bg-primary text-white py-3 rounded-xl font-black shadow-lg hover:bg-primary-hover hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                 {submitting ? <Check className="w-4 h-4 animate-bounce" /> : <Save className="w-4 h-4" />}
                 CẬP NHẬT CHI PHÍ
              </button>
           </form>
        </div>

        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6">
           <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-primary" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">Lịch sử ghi sổ gần đây</h4>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentEntries.map((re, idx) => (
                 <div key={idx} className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <div className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black shrink-0">
                          ${re.actual_cost?.toLocaleString()}
                       </div>
                       <div className="overflow-hidden">
                          <p className="text-[11px] font-bold text-primary truncate">{re.project?.name || 'Dự án'}</p>
                          <p className="text-[8px] text-on-surface-variant font-medium">{new Date(re.date).toLocaleDateString('vi-VN')}</p>
                       </div>
                    </div>
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                 </div>
              ))}
              {recentEntries.length === 0 && (
                 <p className="col-span-3 text-center py-4 text-[10px] italic text-on-surface-variant opacity-50">Chưa có dữ liệu lịch sử.</p>
              )}
           </div>
        </div>
      </div>
    </NavigationLayout>
  );
}
