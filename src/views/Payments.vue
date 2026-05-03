<template>
  <NavigationLayout active-tab="payments">
    <div class="space-y-8 animate-in fade-in duration-500">
      <div class="flex justify-between items-center">
         <div>
            <h1 class="text-2xl font-black text-primary uppercase">QUẢN LÝ THANH TOÁN</h1>
            <p class="text-sm text-on-surface-variant font-medium">Lập hồ sơ nghiệm thu & Thu hồi tạm ứng</p>
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
               @click="openModal"
               class="px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 shadow-xl hover:-translate-y-0.5 transition-all"
             >
                <Plus class="w-5 h-5" />
                LẬP THANH TOÁN MỚI
             </button>
          </div>
      </div>

      <div class="bg-white rounded-3xl border border-outline-variant shadow-sm overflow-hidden">
         <div class="overflow-x-auto">
            <table class="w-full text-left">
               <thead>
                  <tr class="bg-surface-container-low/50">
                     <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center w-16">Lần</th>
                     <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Dự án / Công trình</th>
                     <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Giá trị nghiệm thu</th>
                     <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Thu hồi tạm ứng</th>
                     <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Thực thanh (Paid)</th>
                     <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">Ngày thanh toán</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-outline-variant/30">
                  <tr v-for="p in filteredPayments" :key="p.id" class="hover:bg-surface-container-lowest transition-colors group">
                     <td class="px-6 py-4 text-center">
                        <span class="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center font-black text-xs mx-auto">
                          {{ p.sequence }}
                        </span>
                     </td>
                     <td class="px-6 py-4">
                        <p class="font-bold text-primary group-hover:underline underline-offset-4">{{ p.project?.name }}</p>
                     </td>
                     <td class="px-6 py-4 font-black">
                        ${{ (p.completed_value || 0).toLocaleString() }}
                     </td>
                     <td class="px-6 py-4 text-emerald-600 font-bold">
                        -${{ (p.recovered_amount || 0).toLocaleString() }}
                     </td>
                     <td class="px-6 py-4 text-primary font-black">
                        ${{ (p.paid_amount || 0).toLocaleString() }}
                     </td>
                     <td class="px-6 py-4 text-right text-xs font-bold text-on-surface-variant">
                        {{ new Date(p.payment_date).toLocaleDateString('vi-VN') }}
                     </td>
                  </tr>
                  <tr v-if="filteredPayments.length === 0 && !loading">
                     <td colspan="6" class="px-6 py-12 text-center text-on-surface-variant italic opacity-50">Không tìm thấy dữ liệu thanh toán phù hợp.</td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>

      <!-- Create Payment Modal -->
      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
         <div class="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div class="flex flex-col md:flex-row h-full min-h-[500px]">
               <!-- Left: Input Form -->
               <div class="flex-1 p-10 space-y-8 relative">
                  <button @click="isModalOpen = false" type="button" class="md:hidden absolute top-6 right-6 p-2 bg-surface-container-low text-on-surface hover:text-error rounded-full transition-colors z-10 w-8 h-8 flex items-center justify-center">
                     <X class="w-4 h-4" />
                  </button>
                  <div>
                     <h2 class="text-2xl font-black text-primary uppercase">Cửa sổ tính toán</h2>
                     <p class="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">Nghiệm thu & Phân bổ tài chính</p>
                  </div>
                  
                  <div class="space-y-6">
                     <div class="space-y-2">
                        <div class="flex items-center justify-between">
                           <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Dự án cần quyết toán</label>
                           <button 
                             v-if="formData.project_id" 
                             @click="isPlanModalOpen = true"
                             type="button" 
                             class="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1"
                           >
                              <History class="w-3 h-3" /> Xuất từ dự tính
                           </button>
                        </div>
                        <select 
                          required
                          class="w-full p-4 bg-surface-container-low border-2 border-outline rounded-2xl font-bold text-sm outline-none focus:border-primary transition-all"
                          v-model="formData.project_id"
                        >
                           <option value="">-- Chọn dự án --</option>
                           <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
                        </select>
                     </div>

                     <div class="space-y-2">
                        <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1" :class="!formData.project_id ? 'opacity-50' : ''">Giá trị nghiệm thu đợt này ($)</label>
                        <div class="relative">
                          <input 
                            type="number"
                            class="w-full p-6 bg-surface-container-low border-2 border-outline rounded-2xl font-black text-3xl text-primary outline-none focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            v-model.number="formData.completed_value"
                            placeholder="0"
                            :disabled="!formData.project_id"
                          />
                          <Calculator class="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8" :class="!formData.project_id ? 'text-primary/10' : 'text-primary/20'" />
                        </div>
                     </div>

                     <div class="space-y-2">
                        <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1" :class="!formData.project_id ? 'opacity-50' : ''">Ngày lập hồ sơ</label>
                        <input 
                          type="date"
                          class="w-full p-4 bg-surface-container-low border-2 border-outline rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          v-model="formData.payment_date"
                          :disabled="!formData.project_id"
                        />
                     </div>

                     <div class="space-y-2 pt-4 border-t border-outline">
                        <div class="flex justify-between items-end">
                           <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1" :class="!formData.project_id ? 'opacity-50' : ''">Thu hồi tạm ứng thực tế ($)</label>
                           <button v-if="calcResult" @click.prevent="applyCalculatedRecovery" class="text-[10px] font-black text-primary hover:underline uppercase tracking-widest" :title="calcResult.capped ? 'Đã bị giới hạn bởi số dư tạm ứng còn lại' : ''">
                             Định mức {{ calcResult.advance_rate_percent }}%: ${{ calcResult.base_recovered?.toLocaleString() }} <span v-if="calcResult.capped" class="text-error">*</span>
                           </button>
                        </div>
                        <input 
                          type="number"
                          class="w-full p-4 bg-surface-container-low border-2 border-outline focus:border-primary focus:bg-white rounded-2xl outline-none font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          v-model.number="formData.recovered_amount"
                          placeholder="Nhập số tiền thu hồi thực tế"
                          :disabled="!formData.project_id"
                        />
                     </div>
                  </div>
               </div>

               <!-- Right: Results Display -->
               <div :class="[
                  'w-full md:w-[400px] p-10 flex flex-col justify-between transition-colors duration-500 relative',
                  calcResult ? (calcResult.is_threshold_reached ? 'bg-amber-50' : 'bg-primary/5') : 'bg-surface-container-low'
               ]">
                  <button @click="isModalOpen = false" type="button" class="hidden md:flex absolute top-6 right-6 p-2 bg-white/50 hover:bg-white text-on-surface hover:text-error rounded-full transition-colors w-8 h-8 items-center justify-center shadow-sm">
                     <X class="w-4 h-4" />
                  </button>
                  <div>
                     <p class="text-[10px] font-black text-primary/50 uppercase tracking-[0.2em] mb-8">Kết quả tính toán (Lần {{ calcResult?.sequence || '?' }})</p>
                     
                     <div v-if="calcResult" class="space-y-8 animate-in slide-in-from-right duration-300">
                        <div class="space-y-1">
                           <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Tạm ứng còn lại (Dư nợ)</p>
                           <p class="text-3xl font-black text-amber-600">${{ calcResult.remaining_advance.toLocaleString() }}</p>
                           <p class="text-[9px] font-bold text-on-surface-variant opacity-50 italic">Tổng tạm ứng chưa thu hồi</p>
                        </div>
                        
                        <div class="space-y-1">
                           <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Thu hồi tạm ứng</p>
                           <p class="text-3xl font-black text-emerald-700">-${{ calcResult.recovered_amount.toLocaleString() }}</p>
                           <p class="text-[9px] font-bold text-on-surface-variant opacity-50 italic">
                             {{ calcResult.recovered_amount === calcResult.base_recovered ? 
                                  (calcResult.is_threshold_reached ? 'Bắt buộc: Đạt ngưỡng >80% (Thu hồi dứt điểm phần còn lại)' : 
                                  (calcResult.capped ? `Định mức: ${calcResult.advance_rate_percent}% x Nghiệm thu (Giới hạn bởi dư nợ tạm ứng)` : `Định mức: ${calcResult.advance_rate_percent}% x Nghiệm thu`)) 
                                : 'Theo thực tế đã nhập' }}
                           </p>
                        </div>

                        <div class="space-y-1">
                           <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Thực thanh đợt này</p>
                           <p class="text-3xl font-black text-primary">${{ calcResult.paid_amount.toLocaleString() }}</p>
                           <p class="text-[9px] font-bold text-on-surface-variant opacity-50 italic">Giá trị sau khi trừ thu hồi</p>
                        </div>
                        
                        <div class="pt-8 border-t border-primary/10 space-y-4">
                           <div class="flex justify-between items-center text-[10px] font-black text-primary/40 uppercase tracking-widest">
                              <span>Lũy kế sau thanh toán</span>
                           </div>
                           <div class="flex justify-between items-end">
                              <p class="text-xs font-bold text-on-surface-variant">Quyết toán tập trung</p>
                              <p class="text-lg font-black text-primary">${{ calcResult.cumulative_completed.toLocaleString() }}</p>
                           </div>
                           <div class="flex justify-between items-end">
                              <p class="text-xs font-bold text-on-surface-variant">Lũy kế thu hồi</p>
                              <p class="text-lg font-black text-emerald-600">${{ calcResult.cumulative_recovered.toLocaleString() }}</p>
                           </div>
                        </div>
                     </div>
                     <div v-else class="h-full flex flex-col items-center justify-center text-center opacity-30 mt-20">
                        <Calculator class="w-16 h-16 mb-4" />
                        <p class="text-sm font-bold uppercase tracking-widest">Nhập dữ liệu để bắt đầu tính toán</p>
                     </div>
                  </div>

                  <div v-if="calcResult" class="pt-8">
                     <button 
                       @click="handleSubmit"
                       class="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-2xl hover:bg-primary-hover hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                       :disabled="submitting"
                     >
                        <Check class="w-6 h-6" />
                        {{ submitting ? 'ĐANG LƯU...' : 'LƯU PHIẾU CHI' }}
                     </button>
                     <button @click="isModalOpen = false" class="w-full py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest mt-2 hover:text-primary transition-colors">Hủy thao tác</button>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <!-- Plan Sub-Modal -->
      <div v-if="isPlanModalOpen" class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
         <div class="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div class="p-6 border-b border-outline flex items-center justify-between">
               <div>
                  <h3 class="text-lg font-black text-primary uppercase">Dự tính thanh toán</h3>
                  <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Chọn để điền nhanh</p>
               </div>
               <button @click="isPlanModalOpen = false" class="p-2 bg-surface-container-low text-on-surface hover:text-error rounded-full transition-colors">
                  <X class="w-5 h-5" />
               </button>
            </div>
            
            <div class="max-h-[60vh] overflow-y-auto p-2">
               <div v-if="selectedProjectPlan && selectedProjectPlan.length > 0" class="space-y-2">
                  <button 
                     v-for="plan in selectedProjectPlan" 
                     :key="plan.sequence"
                     @click="applyPlan(plan)"
                     class="w-full p-4 hover:bg-surface-container-low border border-transparent hover:border-primary/20 rounded-2xl text-left flex items-start gap-4 transition-all group"
                  >
                     <div class="w-8 h-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black group-hover:scale-110 transition-transform">
                        {{ plan.sequence }}
                     </div>
                     <div class="flex-1">
                        <div class="flex justify-between items-center mb-2">
                           <span class="text-xs font-black text-on-surface">Lần {{ plan.sequence }}</span>
                           <span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{{ plan.date }}</span>
                        </div>
                        <div class="flex items-center gap-4">
                           <div>
                              <p class="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Nghiệm thu</p>
                              <p class="text-sm font-black text-primary border-b border-dashed border-primary/30">${{ plan.amount?.toLocaleString() }}</p>
                           </div>
                           <div>
                              <p class="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Thu hồi</p>
                              <p class="text-sm font-black text-emerald-600 border-b border-dashed border-emerald-600/30">${{ plan.recovered?.toLocaleString() }}</p>
                           </div>
                        </div>
                     </div>
                  </button>
               </div>
               <div v-else class="p-8 text-center text-sm font-bold text-on-surface-variant uppercase tracking-widest opacity-50">
                  Dự án này chưa có dự tính các lần thanh toán
               </div>
            </div>
         </div>
      </div>
    </div>
  </NavigationLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { supabase } from '#/supabase'
import NavigationLayout from '@/components/NavigationLayout.vue'
import { DollarSign, Plus, Calculator, History, Check, X, ArrowRight, Download, Receipt, TrendingDown } from 'lucide-vue-next'

const payments = ref<any[]>([])
const projects = ref<any[]>([])
const loading = ref(true)
const submitting = ref(false)
const isModalOpen = ref(false)
const isPlanModalOpen = ref(false)

const formData = ref({
  project_id: '',
  completed_value: 0,
  recovered_amount: null as number | null,
  payment_date: new Date().toISOString().split('T')[0]
})

const calcResult = ref<any>(null)
const selectedProjectId = ref('ALL')

const selectedProjectPlan = computed(() => {
  if (!formData.value.project_id) return []
  const project = projects.value.find(p => p.id === formData.value.project_id)
  return project?.payment_plan || []
})

async function applyPlan(plan: any) {
  isPlanModalOpen.value = false
  formData.value.completed_value = plan.amount
  formData.value.payment_date = plan.date
  // Wait for watcher to trigger computePayment so we can overwrite recovered_amount
  await nextTick()
  formData.value.recovered_amount = plan.recovered
}

const currentProjectHistory = ref({
  cumulativeCompleted: 0,
  cumulativeRecovered: 0,
  sequence: 0
})

async function fetchData() {
  loading.value = true
  const { data: payData } = await supabase.from('payments').select('*, project:projects(name)').order('created_at', { ascending: false })
  const { data: projData } = await supabase.from('projects').select('*').eq('is_deleted', false)
  
  if (payData) payments.value = payData
  if (projData) projects.value = projData
  loading.value = false
}

function computePayment() {
  const completedValue = Number(formData.value.completed_value) || 0;
  const recoveredInput = formData.value.recovered_amount;

  if (!formData.value.project_id || (completedValue <= 0 && (recoveredInput === null || recoveredInput === ''))) {
    calcResult.value = null
    return
  }

  const project = projects.value.find(p => p.id === formData.value.project_id)
  if (!project) return

  const history = currentProjectHistory.value
  const advanceAmount = Number(project.advance_amount)
  const contractValue = Number(project.contract_value)
  const remainingAdvance = advanceAmount - history.cumulativeRecovered
  const newTotal = history.cumulativeCompleted + completedValue

  let base_recover = 0
  const deadlineThreshold = contractValue * Number(project.recovery_deadline_ratio)
  const advanceRate = Number(project.advance_rate) || 0.3
  
  let capped = false

  if (newTotal < deadlineThreshold) {
    const raw_recover = completedValue * advanceRate
    base_recover = Math.min(raw_recover, remainingAdvance)
    if (raw_recover > remainingAdvance && remainingAdvance > 0) capped = true
  } else {
    base_recover = Math.max(0, remainingAdvance)
  }

  const actual_recover = recoveredInput !== null && recoveredInput !== '' ? Number(recoveredInput) : 0
  const paid = completedValue - actual_recover

  calcResult.value = {
    base_recovered: base_recover,
    recovered_amount: actual_recover,
    paid_amount: paid,
    cumulative_completed: newTotal,
    cumulative_recovered: history.cumulativeRecovered + actual_recover,
    sequence: history.sequence,
    is_threshold_reached: newTotal >= deadlineThreshold,
    capped: capped,
    advance_rate_percent: Math.round(advanceRate * 100),
    remaining_advance: remainingAdvance
  }
}

function applyCalculatedRecovery() {
  if (calcResult.value && calcResult.value.base_recovered !== undefined) {
    formData.value.recovered_amount = calcResult.value.base_recovered
  }
}

watch(() => formData.value.project_id, async (newId) => {
  if (!newId) return
  
  const { data: prevPayments } = await supabase
    .from('payments')
    .select('completed_value, recovered_amount')
    .eq('project_id', newId)

  currentProjectHistory.value = {
    cumulativeCompleted: prevPayments?.reduce((acc, p) => acc + Number(p.completed_value), 0) || 0,
    cumulativeRecovered: prevPayments?.reduce((acc, p) => acc + Number(p.recovered_amount), 0) || 0,
    sequence: (prevPayments?.length || 0) + 1
  }
  
  if (formData.value.completed_value > 0) {
    formData.value.recovered_amount = null
    computePayment()
    if (calcResult.value) {
      formData.value.recovered_amount = calcResult.value.base_recovered
    }
  }
})

watch(() => formData.value.completed_value, () => {
  formData.value.recovered_amount = null
  computePayment()
  if (calcResult.value) {
     formData.value.recovered_amount = calcResult.value.base_recovered
  }
})

watch(() => formData.value.recovered_amount, () => {
  computePayment()
})

function openModal() {
  isModalOpen.value = true
  calcResult.value = null
  formData.value = {
    project_id: '',
    completed_value: 0,
    recovered_amount: null,
    payment_date: new Date().toISOString().split('T')[0]
  }
}

async function handleSubmit() {
  if (!calcResult.value) return
  submitting.value = true

  const { error } = await supabase.from('payments').insert([{
    project_id: formData.value.project_id,
    sequence: calcResult.value.sequence,
    completed_value: Number(formData.value.completed_value) || 0,
    recovered_amount: calcResult.value.recovered_amount,
    paid_amount: calcResult.value.paid_amount,
    cumulative_completed: calcResult.value.cumulative_completed,
    cumulative_recovered: calcResult.value.cumulative_recovered,
    payment_date: formData.value.payment_date
  }])

  if (error) alert(error.message)
  else {
    isModalOpen.value = false
    fetchData()
  }
  submitting.value = false
}

const filteredPayments = computed(() => {
  if (selectedProjectId.value === 'ALL') return payments.value
  return payments.value.filter(p => p.project_id === selectedProjectId.value)
})

onMounted(() => {
  fetchData()
})
</script>
