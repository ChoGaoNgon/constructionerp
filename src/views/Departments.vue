<template>
  <NavigationLayout active-tab="departments">
    <div class="space-y-8 animate-in fade-in duration-500">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-primary tracking-tight">PHÒNG BAN</h1>
          <p class="text-sm text-on-surface-variant font-medium">Quản lý cơ cấu tổ chức công ty</p>
        </div>
        <button 
          @click="openModal()"
          class="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
        >
          <Plus class="w-5 h-5" />
          THÊM PHÒNG BAN
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div class="p-4 border-b border-outline-variant flex items-center gap-4">
          <div class="relative flex-1">
             <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" />
             <input 
              type="text" 
              placeholder="Tìm tên phòng ban..."
              class="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              v-model="searchQuery"
             />
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low">
                <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Tên phòng ban</th>
                <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Ngày tạo</th>
                <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/30">
              <template v-if="loading">
                <tr v-for="i in 3" :key="i" class="animate-pulse">
                  <td colspan="3" class="px-6 py-8 bg-surface-container-low/20" />
                </tr>
              </template>
              <template v-else>
                <tr v-for="dept in filteredDepts" :key="dept.id" class="hover:bg-surface-container-lowest transition-colors">
                  <td class="px-6 py-4">
                    <p class="font-bold text-primary">{{ dept.name }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-sm text-on-surface-variant font-medium">
                      {{ new Date(dept.created_at).toLocaleDateString('vi-VN') }}
                    </p>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button 
                        @click="openModal(dept)"
                        class="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>
                      <button 
                        @click="deleteDept(dept.id)"
                        class="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredDepts.length === 0">
                  <td colspan="3" class="px-6 py-12 text-center text-on-surface-variant opacity-50 italic">
                    Chưa có dữ liệu phòng ban.
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div class="p-6 border-b border-outline-variant flex items-center justify-between">
            <h2 class="text-xl font-black text-primary uppercase">
              {{ currentDept ? 'Sửa phòng ban' : 'Thêm phòng ban mới' }}
            </h2>
            <button @click="isModalOpen = false" class="text-on-surface-variant hover:text-primary">
              <X class="w-6 h-6" />
            </button>
          </div>
          <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Tên phòng ban</label>
              <input 
                type="text" 
                required
                class="w-full p-4 bg-surface-container-low border border-outline rounded-xl font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="VD: Phòng Kế Toán"
                v-model="formData.name"
              />
            </div>
            <button 
              type="submit"
              class="w-full py-4 bg-primary text-white rounded-xl font-black shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <Check class="w-5 h-5" />
              {{ currentDept ? 'LƯU DỮ LIỆU' : 'THÊM MỚI' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </NavigationLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '#/supabase'
import NavigationLayout from '@/components/NavigationLayout.vue'
import { Settings, Plus, Edit2, Trash2, Check, X, Search } from 'lucide-vue-next'

const departments = ref<any[]>([])
const loading = ref(true)
const isModalOpen = ref(false)
const currentDept = ref<any>(null)
const formData = ref({ name: '' })
const searchQuery = ref('')

async function fetchDepartments() {
  loading.value = true
  const { data } = await supabase
    .from('departments')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  
  if (data) departments.value = data
  loading.value = false
}

const filteredDepts = computed(() => {
  return departments.value.filter(d => d.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

function openModal(dept: any = null) {
  currentDept.value = dept
  formData.value = { name: dept ? dept.name : '' }
  isModalOpen.value = true
}

async function handleSubmit() {
  if (currentDept.value) {
    await supabase.from('departments').update({ name: formData.value.name }).eq('id', currentDept.value.id)
  } else {
    await supabase.from('departments').insert([{ name: formData.value.name }])
  }
  isModalOpen.value = false
  fetchDepartments()
}

async function deleteDept(id: string) {
  if (confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) {
    await supabase.from('departments').update({ is_deleted: true }).eq('id', id)
    fetchDepartments()
  }
}

onMounted(() => {
  fetchDepartments()
})
</script>
