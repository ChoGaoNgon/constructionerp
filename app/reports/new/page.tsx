'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Send, HardHat, AlertTriangle, Lightbulb, History, Clock, X } from 'lucide-react';
import NavigationLayout from '@/components/NavigationLayout';

export default function NewReportPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [formData, setFormData] = useState({
    project_id: '',
    user_id: '',
    date: new Date().toISOString().split('T')[0],
    progress_percent: 0,
    manpower: 1,
    actual_cost: 0,
    issues: '',
    suggestions: ''
  });

  useEffect(() => {
    async function fetchLatestProgress() {
      if (formData.project_id) {
        const { data } = await supabase
          .from('daily_reports')
          .select('progress_percent')
          .eq('project_id', formData.project_id)
          .order('date', { ascending: false })
          .limit(1);
        
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, progress_percent: data[0].progress_percent }));
        } else {
          setFormData(prev => ({ ...prev, progress_percent: 0 }));
        }
      }
    }
    fetchLatestProgress();
  }, [formData.project_id]);

  const fetchHistory = async () => {
    if (!formData.project_id || !formData.user_id) return;
    const { data } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('project_id', formData.project_id)
      .eq('user_id', formData.user_id)
      .order('date', { ascending: false });
    if (data) setHistory(data);
    setShowHistory(true);
  };

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setFormData(prev => ({ ...prev, user_id: session.user.id }));
        const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        if (profile) setCurrentUser(profile);
      }

      const { data: pData } = await supabase.from('projects').select('*');
      if (pData) {
        setProjects(pData);
        setFormData(prev => ({ ...prev, project_id: pData[0]?.id || '' }));
      }
    }
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id || !formData.project_id) {
      alert("Thiếu ID người dùng hoặc chưa chọn dự án. Vui lòng đợi trong giây lát.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('daily_reports').insert([formData]);
    if (!error) {
      router.push('/dashboard');
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <NavigationLayout activeTab="reports">
      <div className="max-w-4xl mx-auto animate-in zoom-in duration-500">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tight">Nhật ký công trình mới</h2>
            <p className="text-on-surface-variant mt-1">Gửi dữ liệu công trình trực tiếp lên Supabase.</p>
          </div>
          <button 
            type="button"
            onClick={fetchHistory}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-sm font-bold text-primary hover:bg-surface-container-highest transition-all"
          >
            <History className="w-4 h-4" />
            Lịch sử báo cáo
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-outline-variant">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 block">Chọn dự án</label>
                <select 
                  value={formData.project_id}
                  onChange={e => setFormData({...formData, project_id: e.target.value})}
                  className="w-full bg-surface-container-low p-3 rounded-lg border-none focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                >
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="bg-white p-6 rounded-xl border border-outline-variant">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 block">Người báo cáo</label>
                <div className="w-full bg-surface-container-low p-3 rounded-lg text-sm font-bold opacity-70">
                   {currentUser ? `${currentUser.name} (${currentUser.role})` : 'Đang xác nhận...'}
                </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-outline-variant md:col-span-2">
                 <div className="flex justify-between items-center mb-6">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Tiến độ lũy kế thực tế</label>
                    <span className="text-lg font-black text-primary">{formData.progress_percent}%</span>
                 </div>
                 <input 
                  type="range" min="0" max="100" 
                  value={formData.progress_percent}
                  onChange={e => setFormData({...formData, progress_percent: parseInt(e.target.value)})}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                 />
              </div>
              <div className="bg-white p-6 rounded-xl border border-outline-variant">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 block">Nhập chi phí thực tế ($)</label>
                 <input 
                  type="number" 
                  value={formData.actual_cost}
                  onChange={e => setFormData({...formData, actual_cost: parseInt(e.target.value)})}
                  className="w-full bg-surface-container-low p-3 rounded-lg border-none focus:ring-2 focus:ring-primary outline-none text-sm font-bold"
                 />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-outline-variant">
                 <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-error mb-4">
                    <AlertTriangle className="w-3 h-3" />
                    Các vấn đề ghi nhận tại hiện trường
                 </label>
                 <textarea 
                  rows={4}
                  value={formData.issues}
                  onChange={e => setFormData({...formData, issues: e.target.value})}
                  className="w-full bg-surface-container-low p-3 rounded-lg border-none focus:ring-2 focus:ring-error outline-none text-sm"
                  placeholder="Chậm trễ do môi trường, vi phạm an toàn, v.v."
                 />
              </div>
              <div className="bg-white p-6 rounded-xl border border-outline-variant">
                 <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary mb-4">
                    <Lightbulb className="w-3 h-3" />
                    Đề xuất chiến lược
                 </label>
                 <textarea 
                  rows={4}
                  value={formData.suggestions}
                  onChange={e => setFormData({...formData, suggestions: e.target.value})}
                  className="w-full bg-surface-container-low p-3 rounded-lg border-none focus:ring-2 focus:ring-primary outline-none text-sm"
                  placeholder="Hành động khắc phục đề xuất cho công trường..."
                 />
              </div>
           </div>

           <div className="flex justify-end pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-primary text-white px-12 py-4 rounded-xl font-black text-sm shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loading ? 'ĐANG ĐỒNG BỘ...' : 'GỬI NHẬT KÝ KIỂM TRA'}
              </button>
           </div>
        </form>

        {showHistory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-primary tracking-tight uppercase">LỊCH SỬ BÁO CÁO</h3>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Dữ liệu hiện trường đã gửi</p>
                  </div>
                </div>
                <button onClick={() => setShowHistory(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {history.map((h, i) => (
                  <div key={i} className="p-4 bg-surface-container-low rounded-xl border border-outline-variant space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-on-surface-variant" />
                        <span className="text-sm font-black text-primary">{new Date(h.date).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Tiến độ: {h.progress_percent}%
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Chi phí ($)</p>
                        <p className="text-sm font-bold">${h.actual_cost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Nhân lực</p>
                        <p className="text-sm font-bold">{h.manpower} người</p>
                      </div>
                    </div>
                    {h.issues && (
                      <div>
                        <p className="text-[9px] font-bold text-error uppercase tracking-widest mb-1">Vấn đề</p>
                        <p className="text-xs italic text-on-surface-variant">{h.issues}</p>
                      </div>
                    )}
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-12 opacity-50 italic text-on-surface-variant">
                    Chưa có lịch sử báo cáo cho dự án này.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </NavigationLayout>
  );
}
