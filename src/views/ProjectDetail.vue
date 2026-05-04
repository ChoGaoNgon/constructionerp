<template>
  <NavigationLayout active-tab="projects">
    <div v-if="loading" class="p-8">Đang tải chi tiết dự án...</div>
    <div v-else-if="!project" class="p-8 text-error">Không tìm thấy dự án.</div>

    <div v-else class="space-y-8 animate-in slide-in-from-bottom duration-500 pb-12">
      <button @click="router.back()" class="flex items-center gap-2 text-on-surface-variant hover:text-primary font-bold group">
        <ArrowLeft class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        QUAY LẠI
      </button>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <!-- Left Column: Info -->
         <div class="lg:col-span-2 space-y-8">
            <div class="bg-white rounded-3xl border border-outline-variant shadow-sm overflow-hidden">
               <div class="p-8 bg-primary text-white">
                  <div class="flex items-center justify-between mb-4">
                     <div class="flex items-center gap-3">
                        <span class="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">Dự án Đang chạy</span>
                        <div class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg"
                           :class="[
                              project.status_evaluation === 'RISK' ? 'bg-red-500 text-white' :
                              project.status_evaluation === 'WARNING' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                           ]"
                        >
                           <AlertTriangle v-if="project.status_evaluation === 'RISK'" class="w-3 h-3" />
                           <Shield v-else-if="project.status_evaluation === 'WARNING'" class="w-3 h-3" />
                           <ShieldCheck v-else class="w-3 h-3" />
                           TRẠNG THÁI: {{ project.status_evaluation }}
                        </div>
                     </div>
                     <div class="flex items-center gap-4">
                        <button 
                          v-if="can('evaluate', 'projects')"
                          @click="isEvaluating = true"
                          class="bg-white text-primary px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                           <ShieldCheck class="w-4 h-4" />
                           ĐÁNH GIÁ DỰ ÁN
                        </button>
                     </div>
                  </div>
                  <h1 class="text-3xl font-black uppercase leading-tight">{{ project.name }}</h1>
                  <p v-if="project.evaluation_note" class="mt-4 text-sm font-medium text-white/80 italic bg-black/10 p-4 rounded-2xl border border-white/5">
                     " {{ project.evaluation_note }} "
                  </p>
               </div>
               <div class="p-8 grid grid-cols-2 md:grid-cols-5 gap-8">
                  <InfoBox label="Giá trị HĐ" :val="`$${project.contract_value?.toLocaleString()}`" :icon="DollarSign" />
                  <InfoBox label="Tạm ứng" :val="`$${project.advance_amount?.toLocaleString()}`" :icon="Briefcase" color="text-emerald-600" />
                  <InfoBox label="Ngày bắt đầu" :val="new Date(project.start_date).toLocaleDateString('vi-VN')" :icon="Calendar" />
                  <InfoBox label="Dự kiến kết thúc" :val="project.expected_end_date ? new Date(project.expected_end_date).toLocaleDateString('vi-VN') : '---'" :icon="Calendar" color="text-primary" />
                  <InfoBox label="Tỷ lệ thu hồi" :val="`${project.recovery_deadline_ratio * 100}%`" :icon="Rocket" />
               </div>
            </div>

            <!-- Personnel Section -->
            <div class="bg-white rounded-3xl border border-outline-variant shadow-sm overflow-hidden">
               <div class="p-6 border-b border-outline-variant flex items-center justify-between">
                  <h3 class="text-xl font-black text-primary uppercase flex items-center gap-3">
                     <Users class="w-6 h-6" />
                     NHÂN SỰ DỰ ÁN
                  </h3>
                  <button 
                    v-if="can('allocate', 'projects')"
                    @click="isAssigning = true"
                    class="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg"
                  >
                     <Plus class="w-4 h-4" />
                     PHÂN BỔ
                  </button>
               </div>
               <div class="p-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div v-for="ass in assignments" :key="ass.id" class="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 hover:border-primary/30 transition-all group">
                        <div class="flex items-center gap-4">
                           <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-primary border border-outline-variant">
                              {{ ass.employee?.name?.[0] }}
                           </div>
                           <div>
                              <p class="font-bold text-primary">{{ ass.employee?.name }}</p>
                              <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{{ ass.role?.name }}</p>
                           </div>
                        </div>
                        <button v-if="can('allocate', 'projects')" @click="removeAssignment(ass.id)" class="p-2 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity">
                           <Trash2 class="w-4 h-4" />
                        </button>
                     </div>
                     <p v-if="assignments.length === 0" class="col-span-2 py-12 text-center text-on-surface-variant italic opacity-50">Chưa có nhân sự được phân bỏ cho dự án này.</p>
                  </div>
               </div>
            </div>

            <!-- Reports History -->
            <div class="bg-white rounded-3xl border border-outline-variant shadow-sm overflow-hidden">
               <div class="p-6 border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 class="text-xl font-black text-primary uppercase flex items-center gap-3">
                     <History class="w-6 h-6" />
                     BÁO CÁO GẦN ĐÂY
                  </h3>
                  
                  <div class="flex bg-surface-container-low p-1 rounded-xl">
                    <button 
                      v-for="tab in [{id: 'DAILY', label: 'Ngày'}, {id: 'WEEKLY', label: 'Tuần'}, {id: 'MONTHLY', label: 'Tháng'}]"
                      :key="tab.id"
                      @click="activeReportTab = tab.id; reportPage = 1"
                      class="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                      :class="activeReportTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'"
                    >
                      {{ tab.label }}
                    </button>
                  </div>
               </div>
               
               <div class="divide-y divide-outline-variant/30">
                  <div v-for="report in pagedReports" :key="report.id" class="p-6 hover:bg-surface-container-lowest transition-colors">
                     <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-3">
                           <div class="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center font-bold text-primary text-xs">
                              {{ report.employee?.name?.[0] }}
                           </div>
                           <div>
                              <p class="text-sm font-bold text-primary">{{ report.employee?.name }}</p>
                              <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{{ new Date(report.report_date).toLocaleDateString('vi-VN') }}</p>
                           </div>
                        </div>
                        <span class="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                           TIẾN ĐỘ: {{ report.progress_percent }}%
                        </span>
                     </div>
                     <div class="space-y-2">
                        <p class="text-xs font-medium text-on-surface-variant line-clamp-2">
                           <span class="font-black text-primary uppercase text-[9px] tracking-widest mr-2">KẾ HOẠCH TIẾP THEO:</span>
                           {{ report.next_tasks }}
                        </p>
                        <p v-if="report.issues" class="text-xs font-medium text-error flex items-center gap-2 italic">
                           <AlertTriangle class="w-3 h-3" />
                           {{ report.issues }}
                        </p>
                     </div>
                  </div>
                  
                  <div v-if="filteredReports.length > 0" class="p-4 bg-surface-container-lowest flex items-center justify-between border-t border-outline-variant/30">
                    <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                      Trang {{ reportPage }} / {{ totalReportPages }}
                    </p>
                    <div class="flex gap-2">
                      <button 
                        @click="reportPage > 1 && reportPage--"
                        :disabled="reportPage === 1"
                        class="p-2 rounded-lg border border-outline-variant hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                      >
                        <ChevronLeft class="w-4 h-4" />
                      </button>
                      <button 
                        @click="reportPage < totalReportPages && reportPage++"
                        :disabled="reportPage === totalReportPages"
                        class="p-2 rounded-lg border border-outline-variant hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                      >
                        <ChevronRight class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p v-if="filteredReports.length === 0" class="p-12 text-center text-on-surface-variant italic opacity-50 flex flex-col items-center gap-2">
                    <History class="w-8 h-8 opacity-20" />
                    Chưa có báo cáo {{ activeReportTab.toLowerCase() === 'daily' ? 'hàng ngày' : activeReportTab.toLowerCase() === 'weekly' ? 'hàng tuần' : 'hàng tháng' }} nào.
                  </p>
               </div>
            </div>
         </div>

         <!-- Right Column: Mini Dashboard -->
         <div v-if="can('view_financial', 'projects')" class="space-y-6">
            <div class="bg-white p-6 rounded-3xl border border-outline-variant shadow-sm space-y-8">
               
               <!-- Contract Completion Progress -->
               <div class="space-y-4">
                  <h4 class="text-sm font-black text-primary uppercase tracking-widest mb-2">TIẾN ĐỘ HOÀN THÀNH HỢP ĐỒNG</h4>
                  <div class="flex justify-between items-end">
                     <p class="text-xs font-bold text-on-surface-variant">Tổng nghiệm thu</p>
                     <p class="text-xl font-black text-primary">${{ totalCompleted.toLocaleString() }}</p>
                  </div>
                  <div class="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                     <div class="h-full bg-blue-500 transition-all duration-1000" :style="{ width: `${completionProgress}%` }"></div>
                  </div>
                  <div class="flex justify-between items-center">
                      <p class="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Đã hoàn thành: {{ completionProgress.toFixed(1) }}%</p>
                      <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Giá trị HĐ: ${{ project.contract_value?.toLocaleString() }}</p>
                   </div>
               </div>

               <hr class="border-outline-variant/30" />

               <!-- Advance Recovery Progress -->
               <div class="space-y-4">
                  <h4 class="text-sm font-black text-primary uppercase tracking-widest mb-2">TIẾN ĐỘ THU HỒI TẠM ỨNG</h4>
                  <div class="flex justify-between items-end">
                     <p class="text-xs font-bold text-on-surface-variant">Tổng thu hồi</p>
                     <p class="text-xl font-black text-primary">${{ totalRecovered.toLocaleString() }}</p>
                  </div>
                  <div class="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                     <div class="h-full bg-emerald-500 transition-all duration-1000" :style="{ width: `${recoveryProgress}%` }"></div>
                  </div>
                  <div class="flex justify-between items-center">
                      <p class="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Đã thu: {{ recoveryProgress.toFixed(1) }}%</p>
                      <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Tổng tạm ứng: ${{ project.advance_amount?.toLocaleString() }}</p>
                   </div>
                   <p v-if="payments.length === 0" class="text-[10px] font-medium text-on-surface-variant text-center italic">Chưa phát sinh đợt thanh toán nào.</p>
               </div>
            </div>
            
            <div v-if="showAdvanceWarning" class="bg-red-50 p-6 rounded-3xl border border-red-200 shadow-sm flex gap-4 items-start animate-in slide-in-from-bottom-2 fade-in duration-500">
               <AlertTriangle class="w-6 h-6 text-red-500 shrink-0 mt-1" />
               <div>
                 <h4 class="text-sm font-black text-red-700 uppercase tracking-widest mb-2">CẢNH BÁO THU HỒI TẠM ỨNG</h4>
                 <p class="text-sm text-red-600 leading-relaxed font-medium">Báo động: Dự án đã đạt từ 80% tiến độ hoàn thành hợp đồng nhưng vẫn chưa thu hồi dứt điểm phần tạm ứng. Vui lòng rà soát lại!</p>
               </div>
            </div>

            <div v-else class="bg-primary/5 p-6 rounded-3xl border border-primary/10">
               <h4 class="text-sm font-black text-primary uppercase tracking-widest mb-4">Ghi chú quy định</h4>
               <p class="text-sm text-on-surface-variant leading-relaxed">Dự án này yêu cầu thu hồi dứt điểm 100% tạm ứng khi giá trị nghiệm thu lũy kế đạt 80% giá trị hợp đồng.</p>
            </div>
         </div>
      </div>

      <!-- Assignment Modal -->
      <div v-if="isAssigning" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
         <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
            <div class="flex justify-between items-center mb-6">
               <h2 class="text-xl font-black text-primary uppercase">PHÂN BỔ NHÂN SỰ</h2>
               <button @click="isAssigning = false"><X class="w-6 h-6" /></button>
            </div>
            <form @submit.prevent="handleAssign" class="space-y-6">
               <div class="space-y-2">
                  <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Nhân viên</label>
                  <select 
                    required
                    class="w-full p-4 bg-surface-container-low border border-outline rounded-2xl font-bold"
                    v-model="assignmentData.employee_id"
                  >
                     <option value="">-- Chọn nhân viên --</option>
                     <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }} ({{ e.email }})</option>
                  </select>
               </div>
               <div class="space-y-2">
                  <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Chức danh dự án</label>
                  <select 
                    required
                    class="w-full p-4 bg-surface-container-low border border-outline rounded-2xl font-bold"
                    v-model="assignmentData.project_role_id"
                  >
                     <option value="">-- Chọn chức danh --</option>
                     <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }} ({{ r.code }})</option>
                  </select>
               </div>
               <button class="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl" :disabled="loading">XÁC NHẬN PHÂN BỔ</button>
            </form>
         </div>
      </div>

      <!-- Evaluation Modal -->
      <div v-if="isEvaluating" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
         <div class="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
            <div class="flex justify-between items-center mb-8">
               <h2 class="text-xl font-black text-primary uppercase">ĐÁNH GIÁ DỰ ÁN</h2>
               <button @click="isEvaluating = false"><X class="w-6 h-6" /></button>
            </div>
            <form @submit.prevent="handleEvaluation" class="space-y-6">
               <div class="space-y-2">
                  <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Trạng thái rủi ro</label>
                  <div class="grid grid-cols-3 gap-2">
                     <button
                        v-for="status in ['SAFE', 'WARNING', 'RISK']"
                        :key="status"
                        type="button"
                        @click="evaluationData.status_evaluation = status"
                        class="py-3 rounded-xl text-[10px] font-black transition-all shadow-lg"
                        :class="[
                           evaluationData.status_evaluation === status 
                              ? (status === 'RISK' ? 'bg-red-500 text-white' : status === 'WARNING' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white')
                              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-lowest'
                        ]"
                     >
                        {{ status }}
                     </button>
                  </div>
               </div>
               <div class="space-y-2">
                  <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Nhận xét của lãnh đạo</label>
                  <textarea 
                    class="w-full p-4 bg-surface-container-low border border-outline rounded-2xl text-sm min-h-[120px]"
                    placeholder="Chỉ đạo xử lý hoặc lưu ý cho dự án..."
                    v-model="evaluationData.evaluation_note"
                  />
               </div>
               <button class="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all" :disabled="loading">LƯU ĐÁNH GIÁ</button>
            </form>
         </div>
      </div>
    </div>
  </NavigationLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import NavigationLayout from '@/components/NavigationLayout.vue'
import InfoBox from '@/components/InfoBox.vue'
import { Rocket, Users, Plus, Trash2, ArrowLeft, Building, Shield, ChevronLeft, ChevronRight, Briefcase, Calendar, DollarSign, X, AlertTriangle, ShieldCheck, MessageSquare, History } from 'lucide-vue-next'
import { usePermissions } from '../composables/usePermissions'

const { can } = usePermissions()

const route = useRoute()
const router = useRouter()
const projectId = route.query.id as string

const project = ref<any>(null)
const assignments = ref<any[]>([])
const reports = ref<any[]>([])
const activeReportTab = ref('DAILY')
const reportPage = ref(1)
const reportPageSize = 5
const payments = ref<any[]>([])
const employees = ref<any[]>([])
const roles = ref<any[]>([])
const currentUser = ref<any>(null)
const loading = ref(true)
const isAssigning = ref(false)
const isEvaluating = ref(false)

const assignmentData = ref({
  employee_id: '',
  project_role_id: ''
})

const evaluationData = ref({
  status_evaluation: 'SAFE',
  evaluation_note: ''
})

const totalRecovered = computed(() => payments.value.reduce((sum, p) => sum + (Number(p.recovered_amount) || 0), 0))
const recoveryProgress = computed(() => {
  if (!project.value || project.value.advance_amount <= 0) return 0
  return Math.min(100, (totalRecovered.value / project.value.advance_amount) * 100)
})

const totalCompleted = computed(() => payments.value.reduce((sum, p) => sum + (Number(p.completed_value) || 0), 0))
const completionProgress = computed(() => {
  if (!project.value || project.value.contract_value <= 0) return 0
  return Math.min(100, (totalCompleted.value / project.value.contract_value) * 100)
})

const showAdvanceWarning = computed(() => {
  return completionProgress.value >= 80 && recoveryProgress.value < 100
})

const filteredReports = computed(() => {
  return reports.value
    .filter(r => r.type === activeReportTab.value)
    .sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime())
})

const totalReportPages = computed(() => Math.ceil(filteredReports.value.length / reportPageSize))

const pagedReports = computed(() => {
  const start = (reportPage.value - 1) * reportPageSize
  const end = start + reportPageSize
  return filteredReports.value.slice(start, end)
})

async function fetchProjectData() {
  loading.value = true
  const { data: pData } = await supabase.from('projects').select('*').eq('id', projectId).eq('is_deleted', false).single()
  
  if (!pData) {
    alert("Dự án không tồn tại hoặc đã bị xóa.")
    router.push('/projects')
    return
  }
  const { data: aData } = await supabase
    .from('project_assignments')
    .select('*, employee:employees(*), role:project_roles(*)')
    .eq('project_id', projectId)
  
  const { data: eData } = await supabase.from('employees').select('*').eq('is_active', true)
  const { data: rData } = await supabase.from('project_roles').select('*')
  
  const { data: payData } = await supabase
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .order('sequence', { ascending: false })
  
  const { data: reportData } = await supabase
    .from('reports')
    .select('*, employee:employees(name)')
    .eq('project_id', projectId)
    .order('report_date', { ascending: false })

  if (pData) {
    project.value = pData
    evaluationData.value = {
      status_evaluation: pData.status_evaluation || 'SAFE',
      evaluation_note: pData.evaluation_note || ''
    }
  }
  if (aData) assignments.value = aData
  if (payData) payments.value = payData
  if (eData) employees.value = eData
  if (rData) roles.value = rData
  if (reportData) reports.value = reportData
  loading.value = false
}

async function handleEvaluation() {
  if (!currentUser.value) return

  const { error } = await supabase.from('projects').update({
    status_evaluation: evaluationData.value.status_evaluation,
    evaluation_note: evaluationData.value.evaluation_note,
    evaluator_id: currentUser.value.id,
    evaluation_updated_at: new Date().toISOString()
  }).eq('id', projectId)

  if (error) alert(error.message)
  else {
    isEvaluating.value = false
    fetchProjectData()
  }
}

async function handleAssign() {
  const { error } = await supabase.from('project_assignments').insert([{
    project_id: projectId,
    ...assignmentData.value
  }])

  if (error) alert(error.message)
  else {
    isAssigning.value = false
    assignmentData.value = { employee_id: '', project_role_id: '' }
    fetchProjectData()
  }
}

async function removeAssignment(id: string) {
  if (confirm('Bãi nhiệm nhân sự này khỏi dự án?')) {
    await supabase.from('project_assignments').delete().eq('id', id)
    fetchProjectData()
  }
}

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const { data: profile } = await supabase.from('employees').select('*').eq('id', session.user.id).single()
    currentUser.value = profile
  }
  fetchProjectData()
})
</script>
