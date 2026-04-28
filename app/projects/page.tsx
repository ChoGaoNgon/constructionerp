'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Rocket, User, ArrowRight, Plus, X, AlertCircle, Settings2, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import NavigationLayout from '@/components/NavigationLayout';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    commander_id: '',
    director_id: '',
    planned_progress: 0,
    planned_cost: 0,
    collected_amount: 0,
    receivable_amount: 0
  });

  const columns = [
    { id: 'stt', label: 'STT', alwaysVisible: true },
    { id: 'name', label: 'Công trình', alwaysVisible: true },
    { id: 'status', label: 'Trạng thái', alwaysVisible: true },
    { id: 'commander', label: 'Chỉ huy trưởng' },
    { id: 'director', label: 'PGĐ phụ trách' },
    { id: 'planned_progress', label: 'Mục tiêu tiến độ (%)' },
    { id: 'actual_progress', label: 'Tiến độ thực tế (%)' },
    { id: 'progress_variance', label: 'Lệch tiến độ' },
    { id: 'planned_cost', label: 'Ngân sách mục tiêu' },
    { id: 'actual_cost', label: 'Chi phí thực tế' },
    { id: 'cost_variance', label: 'Lệch chi phí' },
    { id: 'collected_amount', label: 'Đã thu' },
    { id: 'receivable_amount', label: 'Phải thu' },
    { id: 'actions', label: 'Thao tác', alwaysVisible: true },
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map(c => c.id));
  const [showColumnToggle, setShowColumnToggle] = useState(false);

  const getStatus = (p: any) => {
    const isRisk = (p.planned_progress - p.actual_progress > 5) || (p.actual_cost > p.planned_cost * 1.1);
    if (isRisk) return { label: '🔴 Nguy cơ', color: 'text-error' };
    
    const isWarning = (p.planned_progress > p.actual_progress) || (p.actual_cost > p.planned_cost);
    if (isWarning) return { label: '🟡 Cảnh báo', color: 'text-amber-500' };
    
    return { label: '🟢 Bình thường', color: 'text-emerald-500' };
  };
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setCurrentUser(profile);

        // Fetch projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select(`
            *,
            commander:users!projects_commander_id_fkey(name),
            director:users!projects_director_id_fkey(name),
            reports:daily_reports(progress_percent, actual_cost)
          `);

        if (projectsData) {
          setProjects(projectsData.map(p => {
            const actual_progress = p.reports && p.reports.length > 0 
              ? Math.max(0, ...p.reports.map((r: any) => typeof r.progress_percent === 'number' ? r.progress_percent : 0)) 
              : 0;
            const actual_cost = p.reports 
              ? p.reports.reduce((acc: number, r: any) => acc + (typeof r.actual_cost === 'number' ? r.actual_cost : 0), 0) 
              : 0;
            
            return {
              ...p,
              actual_progress,
              actual_cost,
              progress_variance: actual_progress - p.planned_progress,
              cost_variance: actual_cost - p.planned_cost,
              commander_name: p.commander?.name,
              director_name: p.director?.name
            };
          }));
        }

        // Fetch all users for selection
        const { data: allUsers } = await supabase.from('users').select('*');
        if (allUsers) setUsers(allUsers);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      name: '',
      commander_id: '',
      director_id: '',
      planned_progress: 0,
      planned_cost: 0,
      collected_amount: 0,
      receivable_amount: 0
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (project: any) => {
    setIsEditing(true);
    setFormData({
      id: project.id,
      name: project.name,
      commander_id: project.commander_id,
      director_id: project.director_id,
      planned_progress: project.planned_progress,
      planned_cost: project.planned_cost,
      collected_amount: project.collected_amount || 0,
      receivable_amount: project.receivable_amount || 0
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const { error } = isEditing 
      ? await supabase.from('projects').update({
          name: formData.name,
          commander_id: formData.commander_id,
          director_id: formData.director_id,
          planned_progress: formData.planned_progress,
          planned_cost: formData.planned_cost,
          collected_amount: formData.collected_amount,
          receivable_amount: formData.receivable_amount
        }).eq('id', formData.id)
      : await supabase.from('projects').insert([formData]);

    if (error) {
      setErrorMsg(error.message);
      if (error.message.includes("permission denied")) {
        setErrorMsg("LỖI PHÂN QUYỀN: Bạn chưa được cấp quyền trên bảng Projects trong Supabase Dashboard.");
      }
    } else {
      setShowCreateModal(false);
      // Refresh list
      window.location.reload();
    }
  };

  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'PGD';

  return (
    <NavigationLayout activeTab="projects">
      <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-primary tracking-tight">Công trình đang hoạt động</h2>
            <p className="text-on-surface-variant mt-1">Giám sát danh mục qua Supabase.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowColumnToggle(!showColumnToggle)}
                className="p-3 bg-surface-container-low rounded-xl border border-outline-variant hover:bg-surface-container-high transition-all"
                title="Tùy chỉnh cột"
              >
                <Settings2 className="w-5 h-5 text-on-surface-variant" />
              </button>
              
              {showColumnToggle && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-outline-variant rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                   <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-2">
                      <h4 className="font-black text-[10px] uppercase tracking-widest text-primary">Hiển thị cột</h4>
                      <X className="w-4 h-4 cursor-pointer text-on-surface-variant" onClick={() => setShowColumnToggle(false)} />
                   </div>
                   <div className="space-y-2 max-h-60 overflow-y-auto">
                      {columns.map(col => (
                        <label key={col.id} className={cn("flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors", col.alwaysVisible && "opacity-50 pointer-events-none")}>
                          <input 
                            type="checkbox"
                            checked={visibleColumns.includes(col.id)}
                            onChange={(e) => {
                              if (e.target.checked) setVisibleColumns([...visibleColumns, col.id]);
                              else setVisibleColumns(visibleColumns.filter(c => c !== col.id));
                            }}
                            className="w-4 h-4 rounded border-outline text-primary focus:ring-primary"
                          />
                          <span className="text-xs font-bold text-on-surface">{col.label}</span>
                        </label>
                      ))}
                   </div>
                </div>
              )}
            </div>
            {isAuthorized && (
              <button 
                onClick={handleOpenCreate}
                className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                DỰ ÁN MỚI
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  {columns.filter(c => visibleColumns.includes(c.id)).map(col => (
                    <th key={col.id} className="px-4 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {projects.map((p, idx) => {
                  const status = getStatus(p);
                  return (
                    <tr key={p.id} className="hover:bg-surface-container-low transition-colors group">
                      {visibleColumns.includes('stt') && <td className="px-4 py-4 text-xs font-mono text-on-surface-variant">{idx + 1}</td>}
                      {visibleColumns.includes('name') && <td className="px-4 py-4 font-bold text-primary min-w-[200px]">{p.name}</td>}
                      {visibleColumns.includes('status') && (
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={cn("text-xs font-black uppercase tracking-tighter", status.color)}>
                            {status.label}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('commander') && (
                        <td className="px-4 py-4 text-sm whitespace-nowrap">
                          <div className="flex items-center gap-2">
                             <User className="w-3 h-3 opacity-30" />
                             {p.commander_name || 'Chưa phân công'}
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('director') && (
                        <td className="px-4 py-4 text-sm whitespace-nowrap">
                          <div className="flex items-center gap-2">
                             <User className="w-3 h-3 opacity-30" />
                             {p.director_name || 'Chưa phân công'}
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('planned_progress') && <td className="px-4 py-4 text-center font-bold text-sm">{p.planned_progress}%</td>}
                      {visibleColumns.includes('actual_progress') && (
                        <td className="px-4 py-4">
                           <div className="flex flex-col items-center gap-1 min-w-[100px]">
                              <span className="text-[10px] font-bold text-primary">{p.actual_progress || 0}%</span>
                              <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                 <div className="h-full bg-primary" style={{ width: `${isNaN(p.actual_progress) ? 0 : p.actual_progress}%` }}></div>
                              </div>
                           </div>
                        </td>
                      )}
                      {visibleColumns.includes('progress_variance') && (
                        <td className={cn("px-4 py-4 text-center font-black text-sm", p.progress_variance < 0 ? 'text-error' : 'text-emerald-500')}>
                          {p.progress_variance > 0 ? '+' : ''}{p.progress_variance}%
                        </td>
                      )}
                      {visibleColumns.includes('planned_cost') && <td className="px-4 py-4 text-right font-bold text-sm whitespace-nowrap">${(p.planned_cost / 1000).toFixed(0)}k</td>}
                      {visibleColumns.includes('actual_cost') && <td className="px-4 py-4 text-right font-bold text-sm whitespace-nowrap text-primary">${(p.actual_cost / 1000).toFixed(0)}k</td>}
                      {visibleColumns.includes('cost_variance') && (
                        <td className={cn("px-4 py-4 text-right font-black text-sm whitespace-nowrap", p.cost_variance > 0 ? 'text-error' : 'text-emerald-500')}>
                          {p.cost_variance > 0 ? '+' : ''}${(p.cost_variance / 1000).toFixed(0)}k
                        </td>
                      )}
                      {visibleColumns.includes('collected_amount') && <td className="px-4 py-4 text-right font-bold text-sm whitespace-nowrap">${(p.collected_amount / 1000).toFixed(0)}k</td>}
                      {visibleColumns.includes('receivable_amount') && <td className="px-4 py-4 text-right font-bold text-sm whitespace-nowrap text-secondary">${(p.receivable_amount / 1000).toFixed(0)}k</td>}
                      {visibleColumns.includes('actions') && (
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <Link href={`/projects/${p.id}`} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                            {isAuthorized && (
                              <button 
                                onClick={() => handleOpenEdit(p)}
                                className="p-2 hover:bg-secondary/10 rounded-lg text-secondary transition-colors"
                              >
                                Sửa
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-on-surface-variant opacity-50 italic">
                      Không tìm thấy dự án nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-8 py-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                <h3 className="text-xl font-black text-primary tracking-tight">
                  {isEditing ? 'CHỈNH SỬA DỰ ÁN CHIẾN LƯỢC' : 'DỰ ÁN CHIẾN LƯỢC MỚI'}
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Mã dự án (ID)</label>
                    <input 
                      required
                      disabled={isEditing}
                      placeholder="VD: P2024-001"
                      className={cn(
                        "w-full bg-surface-container-low border border-outline px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all uppercase",
                        isEditing && "opacity-50 cursor-not-allowed bg-surface-container-highest"
                      )}
                      value={formData.id}
                      onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Tên đầy đủ dự án</label>
                    <input 
                      required
                      placeholder="Nhập tên dự án xây dựng"
                      className="w-full bg-surface-container-low border border-outline px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Chỉ huy trưởng (BCH)</label>
                    <select 
                      required
                      className="w-full bg-surface-container-low border border-outline px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      value={formData.commander_id}
                      onChange={e => setFormData({...formData, commander_id: e.target.value})}
                    >
                      <option value="">Chọn BCH</option>
                      {users.filter(u => u.role === 'BCH' || u.role === 'admin').map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Giám đốc (PGĐ)</label>
                    <select 
                      required
                      className="w-full bg-surface-container-low border border-outline px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      value={formData.director_id}
                      onChange={e => setFormData({...formData, director_id: e.target.value})}
                    >
                      <option value="">Chọn PGĐ</option>
                      {users.filter(u => u.role === 'PGD' || u.role === 'admin').map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Mục tiêu tiến độ (%)</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      max="100"
                      className="w-full bg-surface-container-low border border-outline px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      value={formData.planned_progress}
                      onChange={e => setFormData({...formData, planned_progress: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Ngân sách mục tiêu ($)</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      className="w-full bg-surface-container-low border border-outline px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      value={formData.planned_cost}
                      onChange={e => setFormData({...formData, planned_cost: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Đã thu ($)</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      className="w-full bg-surface-container-low border border-outline px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      value={formData.collected_amount}
                      onChange={e => setFormData({...formData, collected_amount: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Phải thu ($)</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      className="w-full bg-surface-container-low border border-outline px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      value={formData.receivable_amount}
                      onChange={e => setFormData({...formData, receivable_amount: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-error-container/20 border border-error/30 rounded-xl text-error text-[11px] font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>{errorMsg}</p>
                  </div>
                )}

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-4 rounded-xl font-black tracking-widest hover:bg-primary/90 transition-all shadow-xl uppercase text-sm"
                  >
                    {isEditing ? 'Cập nhật chiến lược' : 'Cấp phép & Triển khai'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </NavigationLayout>
  );
}
