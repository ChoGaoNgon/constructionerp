<template>
  <NavigationLayout active-tab="reports">
    <div class="space-y-8 animate-in fade-in duration-500">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-black text-primary uppercase">BÁO CÁO CÔNG VIỆC</h1>
          <p class="text-sm text-on-surface-variant font-medium">Theo dõi tiến độ & xử lý tồn tại</p>
        </div>
        <div class="flex gap-4">
          <div class="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-outline-variant shadow-sm min-w-[250px]">
             <span class="text-[10px] font-black text-on-surface-variant uppercase whitespace-nowrap">Lọc dự án:</span>
             <select 
               class="w-full bg-transparent font-bold text-sm outline-none text-primary"
               v-model="selectedProjectId"
             >
                <option value="ALL">Tất cả dự án</option>
                <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
             </select>
          </div>
          <button 
            v-if="can('create', 'reports')"
            @click="isModalOpen = true"
            class="px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Plus class="w-5 h-5" />
            LẬP BÁO CÁO MỚI
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6">
        <div v-for="report in filteredReports" :key="report.id" class="bg-white rounded-3xl border border-outline-variant p-8 shadow-sm hover:border-primary/20 transition-all flex flex-col md:flex-row gap-8">
           <div class="w-full md:w-48 flex flex-col items-center">
              <div :class="[
                'w-12 h-12 rounded-2xl flex items-center justify-center mb-4',
                report.type === 'DAILY' ? 'bg-blue-50 text-blue-600' : 
                report.type === 'WEEKLY' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'
              ]">
                 <Calendar class="w-6 h-6" />
              </div>
              <p class="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{{ report.type }}</p>
              <p class="text-sm font-black text-primary">
                {{ new Date(report.report_date).toLocaleDateString('vi-VN') }}
              </p>
              <div class="mt-4 pt-4 border-t border-outline-variant w-full text-center">
                 <p class="text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-1">Thực hiện</p>
                 <p class="text-xs font-bold text-primary truncate max-w-full">{{ report.employee?.name }}</p>
              </div>
           </div>

           <div class="flex-1 space-y-6">
              <div class="flex justify-between items-start">
                 <div>
                    <h3 class="text-xl font-black text-primary uppercase tracking-tight">{{ report.project?.name }}</h3>
                    <div class="flex items-center gap-2 mt-2">
                       <div class="w-48 h-2 bg-surface-container rounded-full overflow-hidden">
                          <div class="h-full bg-emerald-500" :style="{ width: `${report.progress_percent}%` }"></div>
                       </div>
                       <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{{ report.progress_percent }}% Hoàn thành</span>
                    </div>
                 </div>
                 <button class="text-on-surface-variant hover:text-primary"><MoreHorizontal class="w-5 h-5" /></button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div class="space-y-4">
                    <div>
                       <p class="text-[10px] font-black text-error uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <AlertCircle class="w-3.5 h-3.5" />
                          Khó khăn & Vấn đề
                       </p>
                       <p class="text-sm font-medium text-on-surface-variant italic">{{ report.issues || 'Không có ghi nhận' }}</p>
                    </div>
                    <div>
                       <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <CheckCircle2 class="w-3.5 h-3.5" />
                          Giải pháp / Cách khắc phục
                       </p>
                       <p class="text-sm font-medium text-on-surface-variant">{{ report.resolutions || '---' }}</p>
                    </div>
                 </div>
                 <div class="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/50">
                    <p class="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Kế hoạch kỳ tiếp theo</p>
                    <p class="text-sm font-medium text-on-surface-variant leading-relaxed whitespace-pre-line">{{ report.next_tasks || 'Chưa cập nhật' }}</p>
                 </div>
              </div>
           </div>
        </div>

        <div v-if="filteredReports.length === 0 && !loading" class="py-20 text-center opacity-30">
           <FileText class="w-16 h-16 mx-auto mb-4" />
           <p class="font-black uppercase tracking-[0.2em]">Không tìm thấy báo cáo nào</p>
        </div>
      </div>

      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
           <form @submit.prevent="handleSubmit">
              <div class="flex flex-col md:flex-row divide-x divide-outline-variant">
                 <!-- Left Side: General Info -->
                 <div class="p-10 space-y-8 flex-1">
                    <div>
                       <h2 class="text-2xl font-black text-primary uppercase">Lập báo cáo dự án</h2>
                       <p class="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">Cập nhật tiến độ & hiện trạng công trường</p>
                    </div>

                    <div class="space-y-6">
                       <div class="grid grid-cols-2 gap-4">
                          <div class="space-y-2">
                             <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Dự án</label>
                             <select 
                               required
                               class="w-full p-4 bg-surface-container-low border border-outline rounded-2xl font-bold text-sm"
                               v-model="formData.project_id"
                             >
                                <option value="">-- Chọn dự án --</option>
                                <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                             </select>
                          </div>
                          <div class="space-y-2">
                             <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Loại báo cáo</label>
                             <select 
                               class="w-full p-4 bg-surface-container-low border border-outline rounded-2xl font-bold text-sm"
                               v-model="formData.type"
                             >
                                <option value="DAILY">Hàng ngày</option>
                                <option value="WEEKLY">Hàng tuần</option>
                                <option value="MONTHLY">Hàng tháng</option>
                             </select>
                          </div>
                       </div>

                       <div class="grid grid-cols-2 gap-4">
                          <div class="space-y-2">
                             <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Ngày báo cáo</label>
                             <input 
                               type="date"
                               class="w-full p-4 bg-surface-container-low border border-outline rounded-2xl font-bold"
                               v-model="formData.report_date"
                             />
                          </div>
                          <div class="space-y-2">
                             <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Tỷ lệ hoàn thành (%)</label>
                             <input 
                               type="number" min="0" max="100"
                               class="w-full p-4 bg-surface-container-low border border-outline rounded-2xl font-black text-xl text-primary"
                               v-model.number="formData.progress_percent"
                             />
                          </div>
                       </div>

                       <div class="space-y-2">
                          <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Khó khăn / Tồn tại</label>
                          <textarea 
                            class="w-full p-4 bg-surface-container-low border border-outline rounded-2xl text-sm min-h-[80px]"
                            placeholder="Mô tả các vấn đề phát sinh..."
                            v-model="formData.issues"
                          />
                       </div>
                    </div>
                 </div>

                 <!-- Right Side: Plans -->
                 <div class="p-10 bg-surface-container-lowest w-full md:w-[350px] space-y-8">
                    <div class="space-y-6">
                       <div class="space-y-2">
                          <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Giải pháp đề xuất</label>
                          <textarea 
                            class="w-full p-4 bg-white border border-outline rounded-2xl text-sm min-h-[120px]"
                            placeholder="Cách khắc phục vấn đề..."
                            v-model="formData.resolutions"
                          />
                       </div>

                       <div class="space-y-2">
                          <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Kế hoạch kỳ tới</label>
                          <textarea 
                            class="w-full p-4 bg-white border border-outline rounded-2xl text-sm min-h-[120px]"
                            placeholder="Các công việc dự kiến..."
                            v-model="formData.next_tasks"
                          />
                       </div>
                    </div>

                    <div class="pt-4 space-y-4">
                       <button type="submit" class="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-2xl hover:bg-primary-hover hover:-translate-y-1 transition-all" :disabled="loading">
                          GỬI BÁO CÁO
                       </button>
                       <button 
                         type="button"
                         @click="isModalOpen = false"
                         class="w-full py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest hover:text-primary transition-colors"
                       >
                          Hủy bỏ
                       </button>
                    </div>
                 </div>
              </div>
           </form>
        </div>
      </div>
    </div>
  </NavigationLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import NavigationLayout from '@/components/NavigationLayout.vue'
import { FileText, Plus, Calendar, ClipboardCheck, AlertCircle, CheckCircle2, MoreHorizontal, User } from 'lucide-vue-next'
import { usePermissions } from '../composables/usePermissions'

const { can } = usePermissions()

const reports = ref<any[]>([])
const projects = ref<any[]>([])
const currentUser = ref<any>(null)
const loading = ref(true)
const isModalOpen = ref(false)
const selectedProjectId = ref('ALL')

const formData = ref({
  project_id: '',
  type: 'DAILY',
  progress_percent: 0,
  issues: '',
  resolutions: '',
  next_tasks: '',
  report_date: new Date().toISOString().split('T')[0]
})

async function fetchData() {
  loading.value = true
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const { data: profile } = await supabase.from('employees').select('*').eq('id', session.user.id).single()
    currentUser.value = profile

    let projQuery = supabase.from('projects').select('*').eq('is_deleted', false)
    if (profile?.system_role !== 'ADMIN' && profile?.system_role !== 'CEO') {
      const { data: assignments } = await supabase.from('project_assignments').select('project_id').eq('employee_id', session.user.id)
      const projectIds = assignments?.map(a => a.project_id) || []
      projQuery = projQuery.in('id', projectIds)
    }
    const { data: projData } = await projQuery
    if (projData) projects.value = projData

    const { data: reportData } = await supabase
      .from('reports')
      .select('*, project:projects(name), employee:employees(name)')
      .order('report_date', { ascending: false })
    
    if (reportData) reports.value = reportData
  }
  loading.value = false
}

async function handleSubmit() {
  if (!currentUser.value) return

  loading.value = true
  const { error } = await supabase.from('reports').insert([{
    ...formData.value,
    employee_id: currentUser.value.id
  }])

  if (error) {
    alert(error.message)
  } else {
    isModalOpen.value = false
    formData.value = {
      project_id: '',
      type: 'DAILY',
      progress_percent: 0,
      issues: '',
      resolutions: '',
      next_tasks: '',
      report_date: new Date().toISOString().split('T')[0]
    }
    fetchData()
  }
  loading.value = false
}

const filteredReports = computed(() => {
  if (selectedProjectId.value === 'ALL') return reports.value
  return reports.value.filter(r => r.project_id === selectedProjectId.value)
})

onMounted(() => {
  fetchData()
})
</script>
