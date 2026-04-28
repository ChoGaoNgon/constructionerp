'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Briefcase, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import NavigationLayout from '@/components/NavigationLayout';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [criticalProjects, setCriticalProjects] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("No session found");
          return;
        }

        // Check if user exists in public.users
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) setCurrentUser(profile);

        if (!profile) {
          setError("Tài khoản của bạn chưa được cấp quyền truy cập hệ thống. Vui lòng liên hệ Admin để thêm ID: " + session.user.id + " vào bảng users.");
          return;
        }

        const { data: projects, error: pError } = await supabase
          .from('projects')
          .select(`
            *,
            director:users!projects_director_id_fkey(name),
            reports:daily_reports(progress_percent, actual_cost)
          `)
          .eq('is_deleted', false);

        if (pError) {
          console.error("Supabase Error:", pError);
          setError(pError.message);
          return;
        }

        if (projects) {
          const processed = projects.map(p => {
            const actual_progress = p.reports && p.reports.length > 0 
              ? Math.max(0, ...p.reports.map((r: any) => typeof r.progress_percent === 'number' ? r.progress_percent : 0))
              : 0;
            const total_actual_cost = p.reports 
              ? p.reports.reduce((acc: number, r: any) => acc + (typeof r.actual_cost === 'number' ? r.actual_cost : 0), 0)
              : 0;
            return {
              ...p,
              actual_progress,
              actual_cost: total_actual_cost,
              director_name: p.director?.name || 'Chưa xác định'
            };
          });

          // Calculate Stats
          const risk_count = processed.filter(p => p.actual_progress < p.planned_progress - 5 || p.actual_cost > p.planned_cost * 1.1).length;
          const warning_count = processed.filter(p => (p.actual_progress >= p.planned_progress - 5 && p.actual_progress < p.planned_progress) || (p.actual_cost > p.planned_cost && p.actual_cost <= p.planned_cost * 1.1)).length;
          const total_collected = processed.reduce((acc, p) => acc + (typeof p.collected_amount === 'number' ? p.collected_amount : 0), 0);
          const total_receivable = processed.reduce((acc, p) => acc + (typeof p.receivable_amount === 'number' ? p.receivable_amount : 0), 0);

          setStats({
             total_projects: processed.length,
             risk_count,
             warning_count,
             total_planned_cost: processed.reduce((acc, p) => acc + (typeof p.planned_cost === 'number' ? p.planned_cost : 0), 0),
             total_actual_cost: processed.reduce((acc, p) => acc + (typeof p.actual_cost === 'number' ? p.actual_cost : 0), 0),
             total_collected,
             total_receivable,
           });

          setCriticalProjects(processed.filter(p => p.actual_progress < p.planned_progress - 5 || p.actual_cost > p.planned_cost * 1.1));
        } else {
          setStats({
            total_projects: 0,
            risk_count: 0,
            warning_count: 0,
            total_planned_cost: 0,
            total_actual_cost: 0,
            total_collected: 0,
            total_receivable: 0,
          });
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message);
      }
    }
    fetchData();
  }, []);

  if (error) {
    return (
      <NavigationLayout activeTab="dashboard">
        <div className="p-8 bg-error-container/20 border border-error rounded-xl text-error">
          <h2 className="text-xl font-bold mb-2">Lỗi kết nối Supabase</h2>
          <p>{error}</p>
          <p className="mt-4 text-sm opacity-70 italic">Vui lòng đảm bảo bạn đã chạy file SUPABASE_SCHEMA.sql trong SQL Editor của Supabase.</p>
        </div>
      </NavigationLayout>
    );
  }

  if (!stats) return <div className="p-8">Đang tải Dashboard...</div>;

  const isFinancialAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'accountant';

  const statusData = [
    { name: 'Bình thường', value: stats.total_projects - stats.risk_count - stats.warning_count, color: '#10b981' },
    { name: 'Cảnh báo', value: stats.warning_count, color: '#f59e0b' },
    { name: 'Nguy cơ', value: stats.risk_count, color: '#ef4444' },
  ];

  return (
    <NavigationLayout activeTab="dashboard">
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-primary tracking-tight">Bảng điều khiển quản trị</h2>
            <p className="text-on-surface-variant mt-1">Giám sát thời gian thực (Bản Supabase).</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard label="Tổng công trình" val={stats.total_projects} sub="Danh mục đang hoạt động" icon={Briefcase} trend="up" />
          <KpiCard label="Bình thường" val={stats.total_projects - stats.risk_count - stats.warning_count} icon={CheckCircle2} color="text-emerald-600" bgColor="border-l-emerald-500" />
          <KpiCard label="Cảnh báo" val={stats.warning_count} icon={AlertTriangle} color="text-amber-600" bgColor="border-l-amber-500" />
          <KpiCard label="Nguy cơ" val={stats.risk_count} icon={AlertCircle} color="text-error" bgColor="border-l-error" />
        </div>
        
        {/* Financial Totals */}
        {isFinancialAuthorized && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KpiCard 
              label="Tổng đã thu (Collected)" 
              val={`$${(stats.total_collected || 0).toLocaleString()}`} 
              sub="Tổng tiền mặt đã nhận" 
              icon={DollarSign} 
              color="text-emerald-600" 
              bgColor="border-l-emerald-500" 
            />
            <KpiCard 
              label="Tổng phải thu (Receivable)" 
              val={`$${(stats.total_receivable || 0).toLocaleString()}`} 
              sub="Phải thu từ khách hàng" 
              icon={TrendingUp} 
              color="text-secondary" 
              bgColor="border-l-secondary" 
            />
          </div>
        )}

        {/* Financial Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
            <h4 className="text-lg font-bold text-primary mb-6">Tổng quan trạng thái</h4>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm lg:col-span-2">
            <h4 className="text-lg font-bold text-primary mb-6">Sức khỏe ngân sách danh mục</h4>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Ngân sách dự kiến</p>
                <p className="text-2xl font-black text-primary">
                  {isFinancialAuthorized ? `$${(stats.total_planned_cost/1e6).toFixed(1)}M` : '***'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Chi phí thực tế</p>
                <p className={`text-2xl font-black ${stats.total_actual_cost > stats.total_planned_cost ? 'text-error' : 'text-primary'}`}>
                  {isFinancialAuthorized ? `$${(stats.total_actual_cost/1e6).toFixed(1)}M` : '***'}
                </p>
              </div>
            </div>
            <div className="mt-8 h-[100px] bg-surface-container-low rounded-lg p-4 flex items-end gap-2">
               {statusData.map(s => (
                 <div 
                   key={s.name} 
                   className="flex-1 rounded-t transition-all" 
                   style={{ 
                     height: stats.total_projects > 0 ? `${(s.value/stats.total_projects)*100}%` : '0%', 
                     backgroundColor: s.color 
                   }}
                 ></div>
               ))}
            </div>
          </div>
        </div>

        {/* Critical Projects */}
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-outline-variant bg-error-container/20">
            <h4 className="font-bold text-error flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Công trình rủi ro cao
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-surface-container-low border-b border-outline-variant italic">
                 <tr>
                   <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Công trình</th>
                   <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">PGĐ Phụ trách</th>
                   <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-center">Tiến độ Trễ</th>
                   {isFinancialAuthorized && (
                     <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Vượt ngân sách</th>
                   )}
                 </tr>
               </thead>
               <tbody className="divide-y divide-outline-variant">
                 {criticalProjects.map(p => (
                   <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                     <td className="px-6 py-4 font-bold text-primary">{p.name}</td>
                     <td className="px-6 py-4 text-sm">{p.director_name}</td>
                     <td className="px-6 py-4 text-center">
                       <span className="bg-error-container text-error px-2 py-0.5 rounded text-[11px] font-bold">
                         {Math.round(p.actual_progress - p.planned_progress)}%
                       </span>
                     </td>
                     {isFinancialAuthorized && (
                       <td className="px-6 py-4 text-right">
                          <span className="text-error font-bold">${((p.actual_cost - p.planned_cost)/1000).toFixed(0)}k</span>
                       </td>
                     )}
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>
    </NavigationLayout>
  );
}

function KpiCard({ label, val, sub, icon: Icon, color = "text-primary", bgColor = "border-l-primary" }: any) {
  return (
    <div className={`bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex items-start justify-between border-l-4 ${bgColor}`}>
      <div>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</p>
        <h3 className={`text-4xl font-black mt-2 ${color}`}>{val}</h3>
        <p className="text-xs text-on-surface-variant mt-1">{sub}</p>
      </div>
      <Icon className="w-6 h-6 text-on-surface-variant opacity-20" />
    </div>
  );
}
