'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Rocket, User, ArrowRight, Plus, X, AlertCircle, Settings2, CheckCircle2, AlertTriangle, HelpCircle, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import NavigationLayout from '@/components/NavigationLayout';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [displayProjects, setDisplayProjects] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  
  // Search state
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    status: '',
    commander_id: '',
    director_id: ''
  });
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
            reports:daily_reports(progress_percent, actual_cost, date)
          `)
          .eq('is_deleted', false);

        if (projectsData) {
          const processed = projectsData.map(p => {
            const sortedReports = p.reports && p.reports.length > 0 
              ? [...p.reports].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
              : [];
            
            const actual_progress = sortedReports.length > 0 ? (sortedReports[0].progress_percent || 0) : 0;
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
          });
          setProjects(processed);
          setDisplayProjects(processed);
        }

        // Set admin state
        setIsAdmin(profile?.role === 'admin');

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

  const handleSearch = () => {
    let filtered = [...projects];

    if (searchFilters.name) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchFilters.name.toLowerCase()));
    }

    if (searchFilters.commander_id) {
      filtered = filtered.filter(p => p.commander_id === searchFilters.commander_id);
    }

    if (searchFilters.director_id) {
      filtered = filtered.filter(p => p.director_id === searchFilters.director_id);
    }

    if (searchFilters.status) {
      filtered = filtered.filter(p => {
        const { label } = getStatus(p);
        if (searchFilters.status === 'risk') return label.includes('Nguy cơ');
        if (searchFilters.status === 'warning') return label.includes('Cảnh báo');
        if (searchFilters.status === 'normal') return label.includes('Bình thường');
        return true;
      });
    }

    setDisplayProjects(filtered);
  };

  const handleResetSearch = () => {
    setSearchFilters({
      name: '',
      status: '',
      commander_id: '',
      director_id: ''
    });
    setDisplayProjects(projects);
  };

  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'PGD';

  return (
    <NavigationLayout activeTab="projects">
      <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
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
                className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg text-sm"
              >
                <Plus className="w-5 h-5" />
                DỰ ÁN MỚI
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Panel */}
        <div className={cn("bg-white rounded-2xl border border-outline-variant shadow-sm transition-all", !isFiltersExpanded && "overflow-hidden")}>
           <button 
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="w-full flex items-center justify-between p-6 hover:bg-surface-container-low transition-colors"
           >
              <div className="flex items-center gap-2">
                 <Rocket className="w-4 h-4 text-primary" />
                 <h3 className="text-sm font-black uppercase tracking-widest text-primary">Bộ lọc tìm kiếm</h3>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                 <span className="text-[10px] font-bold uppercase tracking-widest">
                    {isFiltersExpanded ? 'Thu gọn' : 'Mở rộng'}
                 </span>
                 {isFiltersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
           </button>

           <AnimatePresence>
              {isFiltersExpanded && (
                 <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'visible' }}
                 >
                    <div className="px-6 pb-6 pt-0 space-y-4 border-t border-outline-variant/30 mt-0">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Tên công trình</label>
                             <div className="relative">
                                <input 
                                   type="text"
                                   placeholder="Tìm theo tên..."
                                   className="w-full bg-surface-container-low border border-outline px-3 py-2.5 pl-9 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                   value={searchFilters.name}
                                   onChange={e => setSearchFilters({...searchFilters, name: e.target.value})}
                                />
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40" />
                             </div>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Trạng thái</label>
                             <select 
                                className="w-full bg-surface-container-low border border-outline px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={searchFilters.status}
                                onChange={e => setSearchFilters({...searchFilters, status: e.target.value})}
                             >
                                <option value="">Tất cả trạng thái</option>
                                <option value="normal">Bình thường</option>
                                <option value="warning">Cảnh báo</option>
                                <option value="risk">Nguy cơ</option>
                             </select>
                          </div>
                          
                          {/* Searchable Combobox for Commander */}
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Chỉ huy trưởng</label>
                             <SearchableSelect 
                                placeholder="Tất cả BCH"
                                options={users.filter(u => u.role === 'BCH' || u.role === 'admin')}
                                value={searchFilters.commander_id}
                                onChange={(val) => setSearchFilters({...searchFilters, commander_id: val})}
                             />
                          </div>

                          {/* Searchable Combobox for Director */}
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">PGĐ phụ trách</label>
                             <SearchableSelect 
                                placeholder="Tất cả PGĐ"
                                options={users.filter(u => u.role === 'PGD' || u.role === 'admin')}
                                value={searchFilters.director_id}
                                onChange={(val) => setSearchFilters({...searchFilters, director_id: val})}
                             />
                          </div>

                          <div className="flex items-end gap-2">
                             <button 
                                onClick={handleSearch}
                                className="flex-1 bg-secondary text-white py-2.5 rounded-xl font-bold hover:bg-secondary/90 transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                             >
                                <Search className="w-4 h-4" />
                                TÌM KIẾM
                             </button>
                             <button 
                                onClick={handleResetSearch}
                                className="px-4 py-2.5 rounded-xl border border-outline hover:bg-surface-container-low transition-all text-sm font-bold flex items-center justify-center gap-2"
                                title="Làm mới bộ lọc"
                             >
                                <Rocket className="w-4 h-4 rotate-180 opacity-40" />
                                RESET
                             </button>
                          </div>
                       </div>
                    </div>
                 </motion.div>
              )}
           </AnimatePresence>
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
                {displayProjects.map((p, idx) => {
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
                      {visibleColumns.includes('planned_cost') && <td className="px-4 py-4 text-right font-bold text-sm whitespace-nowrap">${(p.planned_cost || 0).toLocaleString()}</td>}
                      {visibleColumns.includes('actual_cost') && <td className="px-4 py-4 text-right font-bold text-sm whitespace-nowrap text-primary">${(p.actual_cost || 0).toLocaleString()}</td>}
                      {visibleColumns.includes('cost_variance') && (
                        <td className={cn("px-4 py-4 text-right font-black text-sm whitespace-nowrap", p.cost_variance > 0 ? 'text-error' : 'text-emerald-500')}>
                          {p.cost_variance > 0 ? '+' : ''}${(p.cost_variance || 0).toLocaleString()}
                        </td>
                      )}
                      {visibleColumns.includes('collected_amount') && <td className="px-4 py-4 text-right font-bold text-sm whitespace-nowrap">${(p.collected_amount || 0).toLocaleString()}</td>}
                      {visibleColumns.includes('receivable_amount') && <td className="px-4 py-4 text-right font-bold text-sm whitespace-nowrap text-secondary">${(p.receivable_amount || 0).toLocaleString()}</td>}
                      {visibleColumns.includes('actions') && (
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <Link href={`/projects/${p.id}`} title="Chi tiết" className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                            {isAuthorized && (
                              <button 
                                onClick={() => handleOpenEdit(p)}
                                title="Sửa"
                                className="p-2 hover:bg-secondary/10 rounded-lg text-secondary transition-colors"
                              >
                                <Settings2 className="w-4 h-4" />
                              </button>
                            )}
                            {isAdmin && (
                              <button 
                                onClick={() => {
                                  setProjectToDelete(p);
                                  setShowDeleteModal(true);
                                }}
                                title="Xóa"
                                className="p-2 hover:bg-error/10 rounded-lg text-error transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {displayProjects.length === 0 && (
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-error-container/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-error" />
              </div>
              <h3 className="text-xl font-black text-on-surface tracking-tight">Xác nhận xóa dự án?</h3>
              <p className="text-on-surface-variant mt-2 text-sm">
                Dự án <span className="font-bold text-primary">"{projectToDelete?.name}"</span> sẽ được chuyển vào kho lưu trữ và không hiển thị trên danh sách chính.
              </p>
              
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-all"
                >
                  Bỏ qua
                </button>
                <button 
                  onClick={async () => {
                    const { error } = await supabase.from('projects').update({ is_deleted: true }).eq('id', projectToDelete.id);
                    if (!error) {
                      setProjects(projects.filter(p => p.id !== projectToDelete.id));
                      setDisplayProjects(displayProjects.filter(p => p.id !== projectToDelete.id));
                      setShowDeleteModal(false);
                      setProjectToDelete(null);
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-error text-white hover:bg-error/90 transition-all shadow-lg"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NavigationLayout>
  );
}

function SearchableSelect({ placeholder, options, value, onChange }: { placeholder: string, options: any[], value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);
  
  useEffect(() => {
    if (selectedOption) {
      setInputValue(selectedOption.name);
    } else {
      setInputValue('');
    }
  }, [value, selectedOption]);

  const filteredOptions = options.filter(o => 
    (o.name || '').toLowerCase().includes(inputValue.toLowerCase()) ||
    (o.email || '').toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset input to selected option name if it was being typed but not selected
        if (selectedOption) setInputValue(selectedOption.name);
        else if (!value) setInputValue('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption, value]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input 
          type="text"
          placeholder={placeholder}
          className="w-full bg-surface-container-low border border-outline px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all pl-9"
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onChange(''); // Clear ID if input is empty
          }}
        />
        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40" />
        <ChevronDown 
          className={cn("w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-transform cursor-pointer", isOpen && "rotate-180")} 
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-[60] w-full mt-1 bg-white border border-outline-variant rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="max-h-40 overflow-y-auto">
               {!inputValue && (
                 <div 
                    onClick={() => {
                      onChange('');
                      setInputValue('');
                      setIsOpen(false);
                    }}
                    className="px-3 py-1.5 text-[10px] hover:bg-surface-container-low cursor-pointer border-b border-outline-variant/30 text-on-surface-variant italic"
                 >
                    Mặc định: {placeholder}
                 </div>
               )}
               {filteredOptions.length > 0 ? (
                 filteredOptions.map(opt => (
                   <div 
                     key={opt.id}
                     onClick={() => {
                       onChange(opt.id);
                       setInputValue(opt.name);
                       setIsOpen(false);
                     }}
                     className={cn(
                        "px-3 py-1.5 text-[11px] hover:bg-primary/5 cursor-pointer flex items-center justify-between transition-colors",
                        value === opt.id && "bg-primary/10 text-primary font-bold"
                     )}
                   >
                     <div className="flex flex-col">
                        <span className="leading-tight">{opt.name}</span>
                        <span className="text-[9px] opacity-50">{opt.email}</span>
                     </div>
                     {value === opt.id && <CheckCircle2 className="w-3 h-3" />}
                   </div>
                 ))
               ) : (
                 <div className="px-3 py-3 text-center text-[9px] text-on-surface-variant opacity-50 uppercase tracking-widest">
                   Không tìm thấy
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
