<template>
  <NavigationLayout active-tab="projects">
    <div class="space-y-8 animate-in fade-in duration-500">
      <div class="flex justify-between items-center">
         <div>
            <h1 class="text-2xl font-black text-primary uppercase">DANH MỤC DỰ ÁN</h1>
            <p class="text-sm text-on-surface-variant font-medium">Theo dõi tiến độ hợp đồng & tài chính</p>
         </div>
         <button 
           @click="isModalOpen = true"
           class="px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all"
         >
            <Plus class="w-5 h-5" />
            TẠO DỰ ÁN MỚI
         </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <template v-if="loading">
           <div v-for="i in 3" :key="i" class="h-48 bg-white rounded-2xl animate-pulse border border-outline-variant" />
         </template>
         <template v-else>
           <router-link 
             v-for="p in projects"
             :key="p.id"
             :to="`/projects/detail?id=${p.id}`" 
             class="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-xl hover:border-primary/30 transition-all group"
           >
              <div class="flex justify-between items-start mb-4">
                 <div class="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <Rocket class="w-6 h-6 text-primary group-hover:text-white" />
                 </div>
                 <div class="text-right space-y-2">
                    <div>
                      <p class="text-[9px] font-black uppercase text-on-surface-variant tracking-widest leading-none">Giá trị HĐ</p>
                      <p class="text-sm font-black text-primary mt-1">${{ (p.contract_value || 0).toLocaleString() }}</p>
                    </div>
                    <div v-if="p.status_evaluation" 
                       class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter inline-block text-white"
                       :class="[
                         p.status_evaluation === 'RISK' ? 'bg-red-500' :
                         p.status_evaluation === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                       ]"
                    >
                      {{ p.status_evaluation }}
                    </div>
                 </div>
              </div>
              <div class="flex items-start justify-between gap-4 min-h-[3.5rem]">
                 <h3 class="text-lg font-black text-primary uppercase leading-tight line-clamp-2">{{ p.name }}</h3>
                 <button @click.prevent="deleteProject(p.id)" class="text-red-500/50 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors" title="Xóa dự án">
                    <Trash2 class="w-4 h-4" />
                 </button>
              </div>
              
              <div class="mt-4 pt-4 border-t border-outline-variant/30 grid grid-cols-2 gap-4">
                 <div>
                    <p class="text-[8px] font-black uppercase text-on-surface-variant tracking-widest">Bắt đầu</p>
                    <p class="text-xs font-bold text-on-surface">{{ p.start_date ? new Date(p.start_date).toLocaleDateString('vi-VN') : '---' }}</p>
                 </div>
                 <div>
                    <p class="text-[8px] font-black uppercase text-on-surface-variant tracking-widest text-right">Dự kiến kết thúc</p>
                    <p class="text-xs font-bold text-primary text-right">{{ p.expected_end_date ? new Date(p.expected_end_date).toLocaleDateString('vi-VN') : '---' }}</p>
                 </div>
              </div>
              
              <div class="mt-4 flex items-center justify-between">
                 <div class="flex -space-x-2">
                     <div class="w-6 h-6 rounded-full bg-surface-container border border-white flex items-center justify-center text-[8px] font-bold text-on-surface-variant">
                        <Users class="w-3 h-3" />
                     </div>
                 </div>
                 <div class="flex items-center gap-1 text-[10px] font-black text-primary opacity-50 group-hover:opacity-100 transition-opacity">
                    CHI TIẾT <ArrowRight class="w-3 h-3" />
                 </div>
              </div>
           </router-link>
         </template>
      </div>

      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
         <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div class="p-8 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/30">
               <div>
                  <h2 class="text-2xl font-black text-primary uppercase tracking-tight">KHỞI TẠO DỰ ÁN</h2>
                  <p class="text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">Thiết lập thông tin hợp đồng cơ sở</p>
               </div>
               <button @click="isModalOpen = false" class="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-on-surface-variant transition-colors">
                  <X class="w-6 h-6" />
               </button>
            </div>
            
            <form @submit.prevent="handleSubmit" class="p-8 space-y-6">
               <div class="space-y-2">
                  <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Tên dự án / Công trình</label>
                  <input 
                    type="text" required
                    class="w-full p-4 bg-surface-container-low border border-outline rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                    placeholder="VD: Cầu Mỹ Thuận 2 - Gói thầu XL01"
                    v-model="formData.name"
                  />
               </div>

               <div class="grid grid-cols-2 gap-6">
                  <div class="space-y-2">
                     <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1 flex items-center gap-2">
                        <DollarSign class="w-3 h-3" />
                        Giá trị hợp đồng ($)
                     </label>
                     <input 
                       type="number" required
                       class="w-full p-4 bg-surface-container-low border border-outline rounded-2xl font-black text-primary text-xl"
                       v-model.number="formData.contract_value"
                     />
                  </div>
                  <div class="space-y-2">
                     <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1 flex items-center gap-2 text-emerald-600">
                        Số tiền tạm ứng (30%)
                     </label>
                     <div class="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-black text-emerald-600 text-xl">
                        ${{ (formData.contract_value * formData.advance_rate).toLocaleString() }}
                     </div>
                  </div>
               </div>

               <div class="grid grid-cols-2 gap-6">
                  <div class="space-y-2">
                     <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1 flex items-center gap-2">
                        <Calendar class="w-3 h-3" />
                        Ngày bắt đầu
                     </label>
                     <input 
                       type="date" required
                       class="w-full p-4 bg-surface-container-low border border-outline rounded-xl font-bold"
                       v-model="formData.start_date"
                     />
                  </div>
                  <div class="space-y-2">
                     <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1 flex items-center gap-2">
                        <Calendar class="w-3 h-3" />
                        Dự kiến kết thúc
                     </label>
                     <input 
                       type="date" required
                       class="w-full p-4 bg-surface-container-low border border-outline rounded-xl font-bold"
                       v-model="formData.expected_end_date"
                     />
                  </div>
               </div>

               <div class="space-y-2">
                  <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Thời hạn thu hồi (Mặc định 80%)</label>
                  <div class="flex items-center gap-4">
                     <input 
                       type="range" min="0.5" max="1.0" step="0.05"
                       class="flex-1 accent-primary"
                       v-model.number="formData.recovery_deadline_ratio"
                     />
                     <span class="font-black text-primary w-12">{{ formData.recovery_deadline_ratio * 100 }}%</span>
                  </div>
               </div>

               <div class="space-y-4 pt-4 border-t border-outline">
                  <div class="flex items-center justify-between">
                     <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Dự tính các lần thanh toán</label>
                     <button type="button" @click="addPaymentPlan" class="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                        <Plus class="w-3 h-3" /> THÊM LẦN THANH TOÁN
                     </button>
                  </div>
                  
                  <div class="space-y-3">
                     <div v-for="(plan, index) in formData.payment_plan" :key="index" class="p-4 bg-surface-container-low border border-outline rounded-2xl space-y-3 relative group">
                        <button type="button" @click="removePaymentPlan(index)" class="absolute top-2 right-2 p-1 text-on-surface-variant/50 hover:text-error hover:bg-error/10 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                           <X class="w-4 h-4" />
                        </button>
                        
                        <div class="flex items-center gap-2">
                           <div class="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">
                              {{ index + 1 }}
                           </div>
                           <span class="text-xs font-bold text-on-surface">Thanh toán lần {{ index + 1 }}</span>
                        </div>
                        
                        <div class="grid grid-cols-3 gap-4">
                           <div class="space-y-1">
                              <label class="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Ngày thanh toán</label>
                              <input type="date" required v-model="plan.date" class="w-full px-3 py-2 bg-white border border-outline rounded-lg text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                           </div>
                           <div class="space-y-1">
                              <label class="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Số tiền ($)</label>
                              <input type="number" required v-model.number="plan.amount" class="w-full px-3 py-2 bg-white border border-outline rounded-lg text-xs font-bold text-primary focus:ring-1 focus:ring-primary outline-none" />
                           </div>
                           <div class="space-y-1">
                              <label class="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Thu ứng ($)</label>
                              <input type="number" required v-model.number="plan.recovered" class="w-full px-3 py-2 bg-white border border-outline rounded-lg text-xs font-bold text-emerald-600 focus:ring-1 focus:ring-primary outline-none" />
                           </div>
                        </div>
                     </div>
                     <div v-if="formData.payment_plan.length === 0" class="text-xs text-center py-4 bg-surface-container-low border border-dashed border-outline rounded-2xl text-on-surface-variant font-medium">
                        Chưa có dự tính thanh toán nào
                     </div>
                  </div>
               </div>

               <div class="pt-4">
                  <button class="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-2xl shadow-primary/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-3" type="submit">
                     <Check class="w-6 h-6" />
                     XÁC NHẬN TẠO DỰ ÁN
                  </button>
               </div>
            </form>
         </div>
      </div>
    </div>
  </NavigationLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '#/supabase'
import NavigationLayout from '@/components/NavigationLayout.vue'
import { Rocket, Plus, Search, Calendar, DollarSign, ArrowRight, X, Check, Users, Trash2 } from 'lucide-vue-next'

const projects = ref<any[]>([])
const loading = ref(true)
const isModalOpen = ref(false)
const formData = ref({
  name: '',
  contract_value: 0,
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  expected_end_date: '',
  advance_rate: 0.3,
  recovery_deadline_ratio: 0.8,
  payment_plan: [] as Array<{ sequence: number, date: string, amount: number, recovered: number }>
})

async function deleteProject(id: string) {
  if (confirm("Bạn có chắc chắn muốn xóa dự án này? Thao tác này sẽ loại bỏ dự án khỏi các thống kê.")) {
    const { error } = await supabase.from('projects').update({ is_deleted: true }).eq('id', id);
    if (error) {
      alert("Lỗi khi xóa: " + error.message);
    } else {
      fetchProjects();
    }
  }
}

function addPaymentPlan() {
  formData.value.payment_plan.push({
    sequence: formData.value.payment_plan.length + 1,
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    recovered: 0
  })
}

function removePaymentPlan(index: number) {
  formData.value.payment_plan.splice(index, 1)
  // Re-sequence
  formData.value.payment_plan.forEach((p, i) => p.sequence = i + 1)
}

async function fetchProjects() {
  loading.value = true
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  
  if (data) projects.value = data
  loading.value = false
}

async function handleSubmit() {
  try {
    const advance_amount = formData.value.contract_value * formData.value.advance_rate
    
    const insertData: any = {
      name: formData.value.name,
      contract_value: formData.value.contract_value,
      start_date: formData.value.start_date,
      advance_rate: formData.value.advance_rate,
      advance_amount,
      recovery_deadline_ratio: formData.value.recovery_deadline_ratio,
      payment_plan: formData.value.payment_plan
    }

    if (formData.value.end_date) insertData.end_date = formData.value.end_date
    if (formData.value.expected_end_date) insertData.expected_end_date = formData.value.expected_end_date

    const { data, error } = await supabase.from('projects').insert([insertData]).select()

    if (error) {
      alert('Lỗi: ' + error.message)
    } else {
      isModalOpen.value = false
      formData.value = {
        name: '',
        contract_value: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        expected_end_date: '',
        advance_rate: 0.3,
        recovery_deadline_ratio: 0.8,
        payment_plan: []
      }
      fetchProjects()
    }
  } catch (err: any) {
    alert('Đã xảy ra lỗi không xác định.')
  }
}

onMounted(() => {
  fetchProjects()
})
</script>
