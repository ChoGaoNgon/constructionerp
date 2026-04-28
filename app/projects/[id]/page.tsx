'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, TrendingUp, DollarSign, HardHat, Warehouse, CheckCircle } from 'lucide-react';
import NavigationLayout from '@/components/NavigationLayout';
import { cn } from '@/lib/utils';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: pData } = await supabase
        .from('projects')
        .select(`
          *,
          commander:users!projects_commander_id_fkey(name),
          director:users!projects_director_id_fkey(name),
          reports:daily_reports(progress_percent, actual_cost)
        `)
        .eq('id', params.id)
        .single();

      if (pData) {
        setProject({
          ...pData,
          actual_progress: pData.reports && pData.reports.length > 0 
            ? Math.max(0, ...pData.reports.map((r: any) => typeof r.progress_percent === 'number' ? r.progress_percent : 0)) 
            : 0,
          actual_cost: pData.reports 
            ? pData.reports.reduce((acc: number, r: any) => acc + (typeof r.actual_cost === 'number' ? r.actual_cost : 0), 0) 
            : 0,
          commander_name: pData.commander?.name,
          director_name: pData.director?.name
        });
      }

      const { data: rData } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('project_id', params.id)
        .order('date', { ascending: false });

      if (rData) setReports(rData);
    }
    fetchData();
  }, [params.id]);

  if (!project) return <div className="p-8">Đang tải chi tiết...</div>;

  return (
    <NavigationLayout activeTab="projects">
      <div className="space-y-6 animate-in slide-in-from-right duration-500">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Quay lại Danh sách dự án
        </button>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant p-6 flex items-start gap-6">
            <div className="w-20 h-20 rounded bg-surface-container-low flex items-center justify-center border border-outline-variant">
              <Warehouse className="w-10 h-10 text-primary opacity-20" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-primary">{project.name}</h2>
              <p className="text-on-surface-variant text-sm mt-1">Mã dự án: {project.id}</p>
              <div className="mt-4 flex gap-4">
                <div className="flex flex-col">
                   <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">CHỈ HUY TRƯỞNG</span>
                   <span className="text-sm font-bold">{project.commander_name}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">GIÁM ĐỐC PHỤ TRÁCH</span>
                   <span className="text-sm font-bold">{project.director_name}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary text-white p-6 rounded-xl flex flex-col justify-between">
            <div>
               <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Đánh giá trạng thái</p>
               <h3 className="text-2xl font-bold mt-2">{(project.actual_progress >= project.planned_progress) ? 'ĐÚNG TIẾN ĐỘ' : 'TRỄ TIẾN ĐỘ'}</h3>
            </div>
            <div className="mt-4">
               <div className="flex justify-between text-xs font-bold mb-1">
                 <span>Tiến độ tổng thể</span>
                 <span>{project.actual_progress || 0}%</span>
               </div>
               <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-white" style={{ width: `${isNaN(project.actual_progress) ? 0 : project.actual_progress}%` }}></div>
               </div>
            </div>
          </div>
        </section>

        {/* Financial Info */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card label="Ngân sách xây dựng" icon={DollarSign}>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant">
                   <p className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase">Dự kiến</p>
                   <p className="text-xl font-bold text-primary">${((project.planned_cost || 0)/1000).toFixed(0)}k</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant">
                   <p className="text-[9px] font-bold text-on-surface-variant tracking-widest uppercase">Thực tế</p>
                   <p className={cn("text-xl font-bold", (project.actual_cost || 0) > (project.planned_cost || 0) ? 'text-error' : 'text-primary')}>
                     ${((project.actual_cost || 0)/1000).toFixed(0)}k
                   </p>
                </div>
              </div>
           </Card>

           <Card label="Biến động tiến độ" icon={TrendingUp}>
              <div className="mt-4 space-y-4">
                <ProgressBar label="Tiến độ mục tiêu" val={project.planned_progress} color="bg-secondary" />
                <ProgressBar label="Tiến độ thực tế" val={project.actual_progress} color="bg-primary" />
              </div>
           </Card>
        </section>

        {/* Logs */}
        <section className="bg-white rounded-xl border border-outline-variant overflow-hidden">
           <div className="p-6 border-b border-outline-variant bg-surface-container-low/30">
              <h4 className="font-bold text-primary">Nhật ký hiện trường hàng ngày (Timeline Supabase)</h4>
           </div>
           <div className="divide-y divide-outline-variant">
              {reports.map(r => (
                <div key={r.id} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-2">
                    <p className="text-sm font-bold text-primary">{new Date(r.date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">Ghi nhận hiện trường</p>
                  </div>
                  <div className="md:col-span-2 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center text-xs font-black text-primary">
                      {r.progress_percent}%
                    </div>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Vấn đề phát sinh</p>
                    <p className="text-xs text-on-surface italic">{r.issues || 'Không có vấn đề.'}</p>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Đề xuất chiến lược</p>
                    <p className="text-xs text-on-surface font-medium">{r.suggestions || 'Duy trì trạng thái hiện tại.'}</p>
                  </div>
                </div>
              ))}
              {reports.length === 0 && <div className="p-8 text-center text-on-surface-variant italic">Không có nhật ký nào.</div>}
           </div>
        </section>
      </div>
    </NavigationLayout>
  );
}

function Card({ label, icon: Icon, children }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
       <h4 className="font-bold text-primary flex items-center gap-2">
          <Icon className="w-4 h-4 text-on-surface-variant" />
          {label}
       </h4>
       {children}
    </div>
  );
}

function ProgressBar({ label, val, color }: any) {
  const safeVal = isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        <span>{label}</span>
        <span>{safeVal}%</span>
      </div>
      <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${safeVal}%` }}></div>
      </div>
    </div>
  );
}
