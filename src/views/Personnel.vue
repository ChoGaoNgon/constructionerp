<template>
  <NavigationLayout active-tab="personnel">
    <div class="space-y-8 animate-in fade-in duration-500">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-primary tracking-tight">NHÂN SỰ</h1>
          <p class="text-sm text-on-surface-variant font-medium">Danh sách nhân sự & Phân quyền hệ thống</p>
        </div>
        <div class="flex gap-2">
          <div class="relative mr-2">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50" />
            <input 
              type="text" 
              placeholder="Tìm nhân viên..."
              class="pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64"
              v-model="searchQuery"
            />
          </div>
          <button 
            @click="openModal()"
            class="bg-primary text-white px-4 py-3 rounded-xl font-bold text-sm shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Plus class="w-4 h-4" />
            THÊM NHÂN VIÊN
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low/50">
                <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Họ và tên</th>
                <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Phòng ban</th>
                <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Quyền hệ thống</th>
                <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center">Trạng thái</th>
                <th class="px-6 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/30">
              <template v-if="loading">
                 <tr v-for="i in 5" :key="i"><td colspan="5" class="px-6 py-6 animate-pulse bg-surface-container-low/20" /></tr>
              </template>
              <template v-else>
                <tr v-for="emp in filteredEmployees" :key="emp.id" class="hover:bg-surface-container-lowest transition-colors">
                  <td class="px-6 py-4">
                    <div>
                      <p class="font-bold text-primary">{{ emp.name }}</p>
                      <p class="text-[10px] text-on-surface-variant font-medium">{{ emp.email }}</p>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <Building class="w-3 h-3 text-on-surface-variant" />
                      <span class="text-sm font-medium text-on-surface">{{ emp.department?.name || 'Vãng lai' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span :class="['px-2 py-0.5 rounded text-[10px] font-black border', getRoleBadge(emp.system_role)]">{{ emp.system_role }}</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                     <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                        :class="emp.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-error/10 text-error'"
                     >
                       {{ emp.is_active ? 'Đang làm' : 'Đã nghỉ' }}
                     </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button 
                      @click="openModal(emp)"
                      class="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredEmployees.length === 0">
                  <td colspan="5" class="px-6 py-12 text-center text-on-surface-variant italic">Không tìm thấy nhân sự.</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
           <div class="p-6 border-b border-outline-variant flex items-center justify-between">
              <h2 class="text-xl font-black text-primary uppercase">
                {{ currentEmp ? 'CẬP NHẬT NHÂN SỰ' : 'THÊM NHÂN VIÊN MỚI' }}
              </h2>
              <button @click="isModalOpen = false" class="text-on-surface-variant hover:text-primary">
                <X class="w-6 h-6" />
              </button>
           </div>
           <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                   <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Họ và tên</label>
                   <input 
                    type="text" required
                    class="w-full p-3 bg-surface-container-low border border-outline rounded-xl font-bold text-sm"
                    v-model="formData.name"
                   />
                </div>
                <div class="space-y-2">
                   <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Tên đăng nhập (Username)</label>
                   <input 
                    type="text"
                    placeholder="Ví dụ: nva.bch"
                    class="w-full p-3 bg-surface-container-low border border-outline rounded-xl font-bold text-sm text-primary"
                    v-model="formData.username"
                   />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-4">
                <div class="space-y-2">
                   <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Email</label>
                   <input 
                    type="email" required
                    :disabled="!!currentEmp"
                    class="w-full p-3 border rounded-xl font-bold text-sm outline-none"
                    :class="currentEmp ? 'bg-surface-container border-transparent opacity-60' : 'bg-surface-container-low border-outline focus:border-primary'"
                    v-model="formData.email"
                   />
                </div>
              </div>

              <div v-if="!currentEmp" class="space-y-2">
                 <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Mật khẩu mặc định</label>
                 <input 
                  type="text" required
                  class="w-full p-3 bg-surface-container-low border border-outline rounded-xl font-bold text-sm text-primary"
                  v-model="formData.password"
                 />
                 <p class="text-[9px] text-on-surface-variant font-medium italic">Gợi ý: {{ formData.password || 'Mật khẩu trống' }}</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                   <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Phòng ban</label>
                   <select 
                    class="w-full p-3 bg-surface-container-low border border-outline rounded-xl font-bold text-sm"
                    v-model="formData.department_id"
                   >
                     <option value="">Chọn phòng ban</option>
                     <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
                   </select>
                </div>
                <div class="space-y-2">
                   <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Quyền hệ thống</label>
                   <select 
                    class="w-full p-3 bg-surface-container-low border border-outline rounded-xl font-bold text-sm"
                    v-model="formData.system_role"
                   >
                     <option value="ADMIN">ADMIN</option>
                     <option value="CEO">CEO</option>
                     <option value="LEADER">LEADER</option>
                     <option value="STAFF">STAFF</option>
                   </select>
                </div>
              </div>

              <div class="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl">
                 <input 
                  type="checkbox"
                  id="is_active"
                  v-model="formData.is_active"
                  class="w-5 h-5 rounded border-outline text-primary focus:ring-primary"
                 />
                 <label for="is_active" class="text-sm font-bold text-primary">Nhân viên còn đang làm việc</label>
              </div>

              <button class="w-full py-4 bg-primary text-white rounded-xl font-black shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2" :disabled="loading">
                <Check class="w-5 h-5" />
                {{ loading ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN' }}
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
import { Users, Plus, Edit2, Shield, Search, X, Check, Building } from 'lucide-vue-next'

const employees = ref<any[]>([])
const departments = ref<any[]>([])
const loading = ref(true)
const isModalOpen = ref(false)
const currentEmp = ref<any>(null)
const formData = ref({
  name: '',
  email: '',
  username: '',
  password: 'password123',
  system_role: 'STAFF',
  department_id: '',
  is_active: true
})
const searchQuery = ref('')

async function fetchData() {
  loading.value = true
  const { data: empData } = await supabase
    .from('employees')
    .select('*, department:departments(name)')
    .order('name')
  
  const { data: deptData } = await supabase
    .from('departments')
    .select('*')
    .eq('is_deleted', false)

  if (empData) employees.value = empData
  if (deptData) departments.value = deptData
  loading.value = false
}

const filteredEmployees = computed(() => {
  return employees.value.filter(e => 
    e.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    e.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (e.username && e.username.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

function openModal(emp: any = null) {
  currentEmp.value = emp
  if (emp) {
    formData.value = {
      name: emp.name,
      email: emp.email,
      username: emp.username || '',
      password: '',
      system_role: emp.system_role,
      department_id: emp.department_id || '',
      is_active: emp.is_active
    }
  } else {
    formData.value = {
      name: '',
      email: '',
      username: '',
      password: 'password123',
      system_role: 'STAFF',
      department_id: '',
      is_active: true
    }
  }
  isModalOpen.value = true
}

async function handleSubmit() {
  loading.value = true
  try {
    if (currentEmp.value) {
      const { error } = await supabase
        .from('employees')
        .update({
          name: formData.value.name,
          username: formData.value.username || null,
          system_role: formData.value.system_role,
          department_id: formData.value.department_id || null,
          is_active: formData.value.is_active
        })
        .eq('id', currentEmp.value.id)
      
      if (error) throw error
      alert("Cập nhật thành công!")
    } else {
      if (!formData.value.password || formData.value.password.length < 6) {
        alert("Mật khẩu phải từ 6 ký tự trở lên.")
        loading.value = false
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.value.email,
        password: formData.value.password,
        options: {
          data: {
            name: formData.value.name
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        const { error: dbError } = await supabase
          .from('employees')
          .upsert({
            id: authData.user.id,
            name: formData.value.name,
            email: formData.value.email,
            username: formData.value.username || null,
            system_role: formData.value.system_role,
            department_id: formData.value.department_id || null,
            is_active: formData.value.is_active
          })
      }
      alert("Tạo nhân viên thành công!")
    }
    isModalOpen.value = false
    fetchData()
  } catch (err: any) {
    alert("Lỗi: " + err.message)
  } finally {
    loading.value = false
  }
}

function getRoleBadge(role: string) {
  const roles: any = {
    ADMIN: "bg-error/10 text-error border-error/20",
    CEO: "bg-primary/10 text-primary border-primary/20",
    LEADER: "bg-secondary/10 text-secondary border-secondary/20",
    STAFF: "bg-surface-container text-on-surface-variant border-outline-variant"
  }
  return roles[role] || roles.STAFF
}

onMounted(() => {
  fetchData()
})
</script>
