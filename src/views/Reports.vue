<template>
  <NavigationLayout active-tab="reports">
    <div class="space-y-8 animate-in fade-in duration-500">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-xl md:text-2xl font-black text-primary uppercase">BÁO CÁO CÔNG VIỆC</h1>
          <p class="text-xs md:text-sm text-on-surface-variant font-medium">Theo dõi tiến độ & xử lý tồn tại</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div class="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-outline-variant shadow-sm w-full md:min-w-[250px]">
             <span class="text-[10px] font-black text-on-surface-variant uppercase whitespace-nowrap">Lọc:</span>
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
            class="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl hover:-translate-y-0.5 transition-all text-sm"
          >
            <Plus class="w-5 h-5" />
            LẬP BÁO CÁO
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:gap-6">
        <div v-for="report in filteredReports" :key="report.id" class="bg-white rounded-3xl border border-outline-variant p-5 md:p-8 shadow-sm hover:border-primary/20 transition-all flex flex-col md:flex-row gap-6 md:gap-8">
           <div class="w-full md:w-32 flex flex-row md:flex-col items-center gap-4 md:gap-0 md:border-r md:border-outline-variant/30 md:pr-8">
              <div :class="[
                'w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center',
                'md:mb-4 shrink-0',
                report.type === 'DAILY' ? 'bg-blue-50 text-blue-600' : 
                report.type === 'WEEKLY' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'
              ]">
                 <Calendar class="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div class="flex-1 md:text-center">
                <p class="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-0.5 md:mb-1">{{ report.type }}</p>
                <p class="text-xs md:text-sm font-black text-primary">
                  {{ new Date(report.report_date).toLocaleDateString('vi-VN') }}
                </p>
              </div>
              <div class="shrink-0 md:mt-4 md:pt-4 md:border-t md:border-outline-variant w-auto md:w-full text-right md:text-center">
                 <p class="text-[8px] md:text-[10px] font-black uppercase text-on-surface-variant tracking-widest mb-0.5 md:mb-1">Thực hiện</p>
                 <p class="text-[10px] md:text-xs font-bold text-primary truncate max-w-[100px] md:max-w-full">{{ report.employee?.name }}</p>
              </div>
           </div>

           <div class="flex-1 space-y-5 md:space-y-6">
              <div class="flex justify-between items-start">
                 <div class="flex-1 min-w-0">
                    <h3 class="text-lg md:text-xl font-black text-primary uppercase tracking-tight truncate">{{ report.project?.name }}</h3>
                    <div class="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                       <div class="w-full sm:w-48 h-2 bg-surface-container rounded-full overflow-hidden">
                          <div class="h-full bg-emerald-500" :style="{ width: `${report.progress_percent}%` }"></div>
                       </div>
                       <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{{ report.progress_percent }}% Hoàn thành</span>
                    </div>
                 </div>
                 <button class="text-on-surface-variant hover:text-primary p-2 -mr-2"><MoreHorizontal class="w-5 h-5" /></button>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                 <div class="space-y-4">
                    <div class="bg-red-50/30 p-4 rounded-2xl border border-red-100/50">
                       <p class="text-[10px] font-black text-error uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <AlertCircle class="w-3.5 h-3.5" />
                          Khó khăn & Vấn đề
                       </p>
                       <p class="text-xs md:text-sm font-medium text-on-surface-variant italic">{{ report.issues || 'Không có ghi nhận' }}</p>
                    </div>
                    <div class="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                       <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <CheckCircle2 class="w-3.5 h-3.5" />
                          Giải pháp / Cách khắc phục
                       </p>
                       <p class="text-xs md:text-sm font-medium text-on-surface-variant">{{ report.resolutions || '---' }}</p>
                    </div>
                 </div>
                 <div class="bg-surface-container-lowest p-5 md:p-6 rounded-2xl border border-outline-variant/50">
                    <p class="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Kế hoạch kỳ tiếp theo</p>
                    <p class="text-xs md:text-sm font-medium text-on-surface-variant leading-relaxed whitespace-pre-line">{{ report.next_tasks || 'Chưa cập nhật' }}</p>
                 </div>
              </div>
           </div>
        </div>

        <div v-if="filteredReports.length === 0 && !loading" class="py-20 text-center opacity-30">
           <FileText class="w-16 h-16 mx-auto mb-4" />
           <p class="font-black uppercase tracking-[0.2em]">Không tìm thấy báo cáo nào</p>
        </div>
      </div>

      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white w-full max-w-4xl max-h-[92vh] sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
           <form @submit.prevent="handleSubmit" class="h-full flex flex-col">
              <div class="flex-1 overflow-y-auto">
                 <div class="flex flex-col md:flex-row md:divide-x divide-outline-variant">
                  <!-- Left Side: General Info -->
                  <div class="p-6 md:p-10 space-y-6 md:space-y-8 flex-1">
                     <div class="flex justify-between items-start">
                        <div>
                           <h2 class="text-xl md:text-2xl font-black text-primary uppercase">Lập báo cáo dự án</h2>
                           <p class="text-[10px] md:text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">Cập nhật tiến độ & hiện trạng công trường</p>
                        </div>
                        <button type="button" @click="isModalOpen = false" class="md:hidden p-2 -mt-2 -mr-2">
                           <X class="w-6 h-6 text-on-surface-variant" />
                        </button>
                     </div>

                     <div class="space-y-5 md:space-y-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div class="space-y-2">
                              <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Ngày báo cáo</label>
                              <input 
                                type="date"
                                class="w-full p-4 bg-surface-container-low border border-outline rounded-2xl font-bold text-sm"
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
                             class="w-full p-4 bg-surface-container-low border border-outline rounded-2xl text-sm min-h-[100px]"
                             placeholder="Mô tả các vấn đề phát sinh..."
                             v-model="formData.issues"
                           />
                        </div>
                     </div>
                  </div>

                  <!-- Right Side: Plans -->
                  <div class="p-6 md:p-10 bg-surface-container-lowest w-full md:w-[350px] space-y-6 md:space-y-8">
                     <div class="space-y-5 md:space-y-6">
                        <div class="space-y-2">
                           <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Giải pháp đề xuất</label>
                           <textarea 
                             class="w-full p-4 bg-white border border-outline rounded-2xl text-sm min-h-[100px] md:min-h-[120px]"
                             placeholder="Cách khắc phục vấn đề..."
                             v-model="formData.resolutions"
                           />
                        </div>

                        <div class="space-y-2">
                           <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Kế hoạch kỳ tới</label>
                           <textarea 
                             class="w-full p-4 bg-white border border-outline rounded-2xl text-sm min-h-[100px] md:min-h-[120px]"
                             placeholder="Các công việc dự kiến..."
                             v-model="formData.next_tasks"
                           />
                        </div>
                     </div>

                     <div class="pt-4 space-y-4 hidden md:block">
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
              </div>

              <!-- Bottom Actions for Mobile -->
              <div class="md:hidden p-6 bg-surface-container-lowest border-t border-outline-variant space-y-3">
                <button type="submit" class="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl" :disabled="loading">
                   GỬI BÁO CÁO
                </button>
                <button 
                  type="button"
                  @click="isModalOpen = false"
                  class="w-full py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest"
                >
                   HỦY BỎ
                </button>
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
import { FileText, Plus, Calendar, ClipboardCheck, AlertCircle, CheckCircle2, MoreHorizontal, User, X } from 'lucide-vue-next'
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
