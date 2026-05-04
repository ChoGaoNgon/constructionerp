<template>
  <NavigationLayout active-tab="project-roles">
    <div class="space-y-8 animate-in fade-in duration-500">
      <div class="flex justify-between items-center">
        <div>
           <h1 class="text-2xl font-black text-primary uppercase">CHỨC DANH DỰ ÁN</h1>
           <p class="text-sm text-on-surface-variant font-medium">Danh mục chức vụ thực hiện trong dự án</p>
        </div>
        <button 
          v-if="can('create', 'project-roles')"
          @click="openModal()"
          class="px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <Plus class="w-5 h-5" />
          THÊM CHỨC DANH
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <template v-if="loading">
           <div v-for="i in 3" :key="i" class="h-32 bg-white rounded-2xl animate-pulse border border-outline-variant" />
         </template>
         <template v-else>
           <div v-for="role in roles" :key="role.id" class="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow group">
              <div class="flex justify-between items-start">
                 <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Briefcase class="w-5 h-5 text-primary" />
                 </div>
                 <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      v-if="can('update', 'project-roles')"
                      @click="openModal(role)"
                      class="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg"
                    >
                       <Edit2 class="w-4 h-4" />
                    </button>
                    <button 
                       v-if="can('delete', 'project-roles')"
                       @click="deleteRole(role.id)"
                       class="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg"
                    >
                       <Trash2 class="w-4 h-4" />
                    </button>
                 </div>
              </div>
              <h3 class="font-black text-primary uppercase">{{ role.name }}</h3>
              <p class="text-[10px] font-black tracking-widest text-on-surface-variant uppercase mt-1">CODE: {{ role.code }}</p>
           </div>
         </template>
      </div>

      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
         <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 space-y-6">
            <h2 class="text-xl font-black text-primary uppercase">{{ currentRole ? 'Cập nhật' : 'Thêm mới' }} chức danh</h2>
            <form @submit.prevent="handleSubmit" class="space-y-4">
               <div class="space-y-1">
                  <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Tên chức danh</label>
                  <input 
                    type="text" required
                    class="w-full p-3 bg-surface-container-low border border-outline rounded-xl font-bold"
                    v-model="formData.name"
                  />
               </div>
               <div class="space-y-1">
                  <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1 text-secondary">Mã viết tắt (Unique)</label>
                  <input 
                    type="text" required
                    class="w-full p-3 bg-surface-container-low border border-outline rounded-xl font-bold text-secondary uppercase"
                    v-model="formData.code"
                    @input="formData.code = formData.code.toUpperCase()"
                  />
               </div>
               <div class="flex gap-3 pt-4">
                  <button type="button" @click="isModalOpen = false" class="flex-1 py-3 bg-surface-container rounded-xl font-bold text-on-surface-variant">HỦY</button>
                  <button type="submit" class="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg">LƯU LẠI</button>
               </div>
            </form>
         </div>
      </div>
    </div>
  </NavigationLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import NavigationLayout from '@/components/NavigationLayout.vue'
import { Briefcase, Plus, Edit2, Trash2, Check, X, Search } from 'lucide-vue-next'
import { usePermissions } from '../composables/usePermissions'

const { can } = usePermissions()

const roles = ref<any[]>([])
const loading = ref(true)
const isModalOpen = ref(false)
const currentRole = ref<any>(null)
const formData = ref({ name: '', code: '' })

async function fetchRoles() {
  loading.value = true
  const { data } = await supabase.from('project_roles').select('*').order('name')
  if (data) roles.value = data
  loading.value = false
}

function openModal(role: any = null) {
  currentRole.value = role
  formData.value = { name: role ? role.name : '', code: role ? role.code : '' }
  isModalOpen.value = true
}

async function handleSubmit() {
  if (currentRole.value) {
    await supabase.from('project_roles').update(formData.value).eq('id', currentRole.value.id)
  } else {
    await supabase.from('project_roles').insert([formData.value])
  }
  isModalOpen.value = false
  fetchRoles()
}

async function deleteRole(id: string) {
  if (confirm('Lưu ý: Xóa chức danh này có thể ảnh hưởng đến các phân bổ dự án hiện có. Tiếp tục?')) {
    await supabase.from('project_roles').delete().eq('id', id)
    fetchRoles()
  }
}

onMounted(() => {
  fetchRoles()
})
</script>
