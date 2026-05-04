<template>
  <NavigationLayout active-tab="dashboard">
    <div v-if="!stats" class="p-12 text-center font-black animate-pulse text-primary tracking-widest">ĐANG TẢI HỆ THỐNG...</div>
    
    <div v-else-if="error" class="p-8 bg-error/5 border border-error/20 rounded-3xl text-error font-bold flex items-center gap-3">
      <AlertCircle class="w-6 h-6" />
      <span>Error loading dashboard: {{ error }}</span>
    </div>

    <div v-else class="space-y-8 animate-in fade-in duration-500">
      <div class="flex justify-between items-end">
        <div>
          <h1 class="text-3xl font-black text-primary tracking-tighter uppercase">Project Ecosystem</h1>
          <p class="text-sm text-on-surface-variant font-bold uppercase tracking-widest opacity-50">Real-time Financial & Operations Overview</p>
        </div>
        <div class="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
           <ShieldCheck class="w-5 h-5 text-primary" />
           <span class="text-xs font-black text-primary">{{ currentUser?.system_role }} ACCESS</span>
        </div>
      </div>

      <!-- Top KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <KpiCard label="Tổng dự án" :val="stats.total_projects" sub="Toàn hệ thống" :icon="Briefcase" />
         <KpiCard label="Dự án Nguy cơ" :val="stats.risk_count" sub="Cần xử lý khẩn cấp" :icon="AlertCircle" color="text-error" />
         <KpiCard label="Dự án Cảnh báo" :val="stats.warning_count" sub="Theo dõi sát sao" :icon="AlertTriangle" color="text-amber-500" />
         <KpiCard label="Dự án An toàn" :val="stats.safe_count" sub="Vận hành ổn định" :icon="ShieldCheck" color="text-emerald-600" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <!-- Financial Health -->
         <div class="lg:col-span-2 bg-white rounded-3xl border border-outline-variant p-8 shadow-sm">
            <div class="flex justify-between items-start mb-8">
               <h3 class="text-xl font-black text-primary uppercase">Sức khỏe tài chính danh mục</h3>
               <div class="flex gap-4">
                  <div class="text-right">
                     <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Phải thu CĐT</p>
                     <p class="text-xl font-black text-primary">${{ (stats.pending_receivable / 1e3).toFixed(0) }}k</p>
                  </div>
              </div>
            </div>

            <div class="space-y-6">
               <div>
                  <div class="flex justify-between mb-2">
                     <span class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Tiến độ hoàn thành HĐ</span>
                     <span class="text-xs font-black text-primary">{{ ((stats.total_completed / stats.total_contract || 0) * 100).toFixed(1) }}%</span>
                  </div>
                  <div class="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                     <div class="h-full bg-primary" :style="{ width: `${(stats.total_completed / stats.total_contract || 0) * 100}%` }"></div>
                  </div>
               </div>

               <div>
                  <div class="flex justify-between mb-2">
                     <span class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-emerald-600">Tiến độ thu hồi tạm ứng</span>
                     <span class="text-xs font-black text-emerald-600">{{ ((stats.total_recovered / stats.total_advance || 0) * 100).toFixed(1) }}%</span>
                  </div>
                  <div class="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                     <div class="h-full bg-emerald-500" :style="{ width: `${(stats.total_recovered / stats.total_advance || 0) * 100}%` }"></div>
                  </div>
               </div>
            </div>

            <div class="mt-12 grid grid-cols-3 gap-4">
               <StatBox label="Tổng tạm ứng" :val="`$${(stats.total_advance / 1e3).toFixed(0)}k`" />
               <StatBox label="Đã thu hồi" :val="`$${(stats.total_recovered / 1e3).toFixed(0)}k`" />
               <StatBox label="Còn lại" :val="`$${((stats.total_advance - stats.total_recovered) / 1e3).toFixed(0)}k`" highlight />
            </div>
         </div>

         <!-- Completion Chart -->
         <div class="bg-white rounded-3xl border border-outline-variant p-8 shadow-sm flex flex-col justify-between">
            <h3 class="text-sm font-black text-primary uppercase tracking-widest mb-6">Tương quan Thực hiện</h3>
            <div class="h-[200px] w-full">
               <DashboardChart :data="chartData" />
            </div>
            <div class="space-y-2 mt-4">
               <div class="flex items-center justify-between text-xs font-bold">
                  <span class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-primary"></div> Đã nghiệm thu</span>
                  <span>${{ (stats.total_completed / 1e3).toFixed(0) }}k</span>
               </div>
               <div class="flex items-center justify-between text-xs font-bold text-on-surface-variant">
                  <span class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-surface-container"></div> Tổng HĐ</span>
                  <span>${{ (stats.total_contract / 1e3).toFixed(0) }}k</span>
               </div>
            </div>
         </div>
      </div>

      <!-- Alerts Table -->
      <div v-if="criticalProjects.length > 0" class="bg-white rounded-3xl border border-error/30 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-700">
         <div class="px-8 py-6 bg-error/5 border-b border-error/10 flex items-center gap-3">
            <AlertTriangle class="w-6 h-6 text-error" />
            <h4 class="font-black text-error uppercase tracking-tight">Dự án cần chú trọng (Nguy cơ / Cảnh báo / Quá hạn thu hồi)</h4>
         </div>
         <div class="overflow-x-auto">
            <table class="w-full text-left">
               <thead class="bg-surface-container-low/50 text-[10px] font-black uppercase text-on-surface-variant tracking-widest">
                  <tr>
                     <th class="px-8 py-4">Công trình</th>
                     <th class="px-8 py-4 text-center">Tiến độ (Nghiệm thu / Thu ứng)</th>
                     <th class="px-8 py-4 text-center">Tình trạng</th>
                     <th class="px-8 py-4 text-right">Hành động</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-outline-variant/30">
                  <tr v-for="p in criticalProjects" :key="p.id" class="hover:bg-error/5 transition-colors">
                     <td class="px-8 py-4 font-bold text-primary">{{ p.name }}</td>
                     <td class="px-8 py-4">
                        <div class="flex flex-col gap-2 max-w-[200px] mx-auto">
                           <div class="w-full bg-surface-container rounded-full h-1.5 overflow-hidden flex" title="Tiến độ hoàn thành">
                              <div class="bg-blue-500 h-full" :style="{ width: `${Math.min(100, p.completion_rate * 100)}%` }"></div>
                           </div>
                           <p class="text-[10px] font-black tracking-widest text-blue-600 block text-right mt-[-4px]">{{ (p.completion_rate * 100).toFixed(0) }}% HT</p>

                           <div class="w-full bg-surface-container rounded-full h-1.5 overflow-hidden flex mt-1" title="Tiến độ thu hồi tạm ứng">
                              <div class="bg-emerald-500 h-full" :style="{ width: `${Math.min(100, p.recovery_rate * 100)}%` }"></div>
                           </div>
                           <p class="text-[10px] font-black tracking-widest text-emerald-600 block text-right mt-[-4px]">{{ (p.recovery_rate * 100).toFixed(0) }}% TH</p>
                        </div>
                     </td>
                     <td class="px-8 py-4 text-center">
                        <div class="flex flex-col gap-2 items-center">
                           <span v-if="p.status_evaluation !== 'SAFE'" class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                              :class="[
                                 p.status_evaluation === 'RISK' ? 'bg-red-500 text-white shadow-lg' :
                                 p.status_evaluation === 'WARNING' ? 'bg-amber-500 text-white shadow-lg' : ''
                              ]"
                           >
                              {{ p.status_evaluation }}
                           </span>
                           <span v-if="p.has_recovery_alert" class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-600 text-white shadow-lg flex items-center gap-1">
                              <AlertTriangle class="w-3 h-3" /> CHƯA THU HẾT ỨNG
                           </span>
                        </div>
                     </td>
                     <td class="px-8 py-4 text-right">
                        <router-link :to="`/projects/detail?id=${p.id}`" class="text-[10px] font-black text-error hover:underline flex items-center justify-end gap-1">
                           XỬ LÝ NGAY <ArrowRight class="w-3 h-3" />
                        </router-link>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  </NavigationLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import { Briefcase, AlertCircle, TrendingUp, DollarSign, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-vue-next'
import NavigationLayout from '@/components/NavigationLayout.vue'
import DashboardChart from '@/components/DashboardChart.vue'
import KpiCard from '@/components/KpiCard.vue'
import StatBox from '@/components/StatBox.vue'

const stats = ref<any>(null)
const criticalProjects = ref<any[]>([])
const currentUser = ref<any>(null)
const error = ref<string | null>(null)

const chartData = computed(() => {
  if (!stats.value) return []
  return [
    { name: 'Hoàn thành', value: stats.value.total_completed, color: '#10b981' },
    { name: 'Còn lại', value: Math.max(0, stats.value.total_contract - stats.value.total_completed), color: '#f3f4f6' }
  ]
})

onMounted(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Check/Sync User
    const { data: profile } = await supabase.from('employees').select('*').eq('id', session.user.id).single()
    if (profile) currentUser.value = profile
    else {
      const { data: nProf } = await supabase.from('employees').insert([{
        id: session.user.id,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
        email: session.user.email,
        system_role: 'STAFF'
      }]).select().single()
      if (nProf) currentUser.value = nProf
    }

    // Fetch Projects + Financials
    const { data: projects, error: projectsError } = await supabase.from('projects')
      .select('*, payments(completed_value, recovered_amount), investor_payments(amount)')
      .eq('is_deleted', false)

    if (projectsError) {
      error.value = projectsError.message
      return
    }

    if (projects) {
      const processed = projects.map(p => {
        const cum_completed = p.payments?.reduce((acc: any, pay: any) => acc + Number(pay.completed_value), 0) || 0
        const cum_recovered = p.payments?.reduce((acc: any, pay: any) => acc + Number(pay.recovered_amount), 0) || 0
        const total_received = p.investor_payments?.reduce((acc: any, inv: any) => acc + Number(inv.amount), 0) || 0
        
        const completion_rate = p.contract_value > 0 ? (cum_completed / p.contract_value) : 0
        const recovery_rate = p.advance_amount > 0 ? (cum_recovered / p.advance_amount) : 0
        const has_recovery_alert = completion_rate >= p.recovery_deadline_ratio && recovery_rate < 0.99

        return { ...p, cum_completed, cum_recovered, total_received, completion_rate, recovery_rate, has_recovery_alert }
      })

      const total_contract = processed.reduce((acc, p) => acc + Number(p.contract_value), 0)
      const total_completed = processed.reduce((acc, p) => acc + Number(p.cum_completed), 0)
      const total_received = processed.reduce((acc, p) => acc + Number(p.total_received), 0)
      const total_advance = processed.reduce((acc, p) => acc + Number(p.advance_amount), 0)
      const total_recovered = processed.reduce((acc, p) => acc + Number(p.cum_recovered), 0)

      stats.value = {
        total_projects: processed.length,
        risk_count: processed.filter(p => p.status_evaluation === 'RISK').length,
        warning_count: processed.filter(p => p.status_evaluation === 'WARNING').length,
        safe_count: processed.filter(p => p.status_evaluation === 'SAFE').length,
        alert_count: processed.filter(p => p.has_recovery_alert).length,
        total_contract,
        total_completed,
        total_received,
        total_advance,
        total_recovered,
        pending_receivable: total_completed - total_received
      }
      criticalProjects.value = processed.filter(p => p.has_recovery_alert || p.status_evaluation === 'RISK' || p.status_evaluation === 'WARNING')
    }
  } catch (err: any) {
    error.value = err.message
  }
})
</script>
