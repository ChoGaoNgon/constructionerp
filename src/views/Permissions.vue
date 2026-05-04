<template>
  <NavigationLayout activeTab="permissions">
    <div class="space-y-6">
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-primary">Phân quyền hệ thống</h2>
          <p class="text-sm text-on-surface-variant mt-1">Quản lý quyền chi tiết theo từng tính năng, màn hình.</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-outline-variant flex gap-6">
        <button 
          @click="activeTab = 'roles'"
          class="pb-3 text-sm font-bold border-b-2 transition-colors duration-200"
          :class="activeTab === 'roles' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'"
        >
          Quyền theo Role
        </button>
        <button 
          @click="activeTab = 'users'"
          class="pb-3 text-sm font-bold border-b-2 transition-colors duration-200"
          :class="activeTab === 'users' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'"
        >
          Quyền cá nhân
        </button>
      </div>

      <!-- Content -->
      <div v-if="activeTab === 'roles'" class="space-y-6 animate-fade-in">
        <div class="flex gap-4 items-center mb-4">
          <label class="text-sm font-bold text-on-surface-variant">Chọn Role:</label>
          <select v-model="selectedRole" @change="loadRolePermissions" class="border border-outline-variant rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none min-w-[200px]">
             <option value="CEO">CEO</option>
             <option value="LEADER">Ban chỉ huy / Leader</option>
             <option value="STAFF">Nhân viên / Staff</option>
          </select>
          <p class="text-xs text-on-surface-variant/70 italic">* Role ADMIN mặc định có toàn quyền, không cần cấu hình.</p>
        </div>

        <div class="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-lowest text-xs uppercase tracking-wider text-on-surface-variant border-b border-outline-variant">
                <th class="py-4 px-6 font-bold w-1/3">Màn hình / Tính năng (Resource)</th>
                <th class="py-4 px-6 font-bold text-left">Các quyền chi tiết (Actions)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr v-for="res in resources" :key="res.id" class="hover:bg-surface-container-lowest/50 transition-colors">
                <td class="py-4 px-6 font-medium text-sm text-on-surface align-top">{{ res.label }}</td>
                <td class="py-4 px-6 flex flex-wrap gap-4 text-sm">
                    <label v-for="action in res.actions" :key="action.id" class="flex items-center gap-2 cursor-pointer p-2 hover:bg-surface-container-lowest rounded-lg border border-transparent hover:border-outline-variant transition-all">
                       <input 
                         type="checkbox" 
                         :checked="hasRolePermission(res.id, action.id)"
                         @change="toggleRolePermission(res.id, action.id, $event)"
                         class="w-4 h-4 rounded text-primary focus:ring-primary"
                       />
                       <span class="text-on-surface-variant select-none">{{ action.label }}</span>
                    </label>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="space-y-6 animate-fade-in">
         <div class="flex gap-4 items-center mb-4">
          <label class="text-sm font-bold text-on-surface-variant">Chọn User:</label>
          <select v-model="selectedUserId" @change="loadUserPermissions" class="border border-outline-variant rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none min-w-[300px]">
             <option value="">-- Chọn User --</option>
             <option v-for="user in users" :key="user.id" :value="user.id">
               {{ user.name }} ({{ user.email }})
             </option>
          </select>
        </div>

        <div v-if="selectedUserId" class="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-lowest text-xs uppercase tracking-wider text-on-surface-variant border-b border-outline-variant">
                <th class="py-4 px-6 font-bold w-1/3">Màn hình / Tính năng (Resource)</th>
                <th class="py-4 px-6 font-bold text-left">Ghi đè quyền cá nhân</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr v-for="res in resources" :key="res.id" class="hover:bg-surface-container-lowest/50 transition-colors">
                <td class="py-4 px-6 font-medium text-sm text-on-surface align-top">{{ res.label }}</td>
                <td class="py-4 px-6 flex flex-wrap gap-4 text-sm">
                   <div v-for="action in res.actions" :key="action.id" class="flex items-center gap-2 border border-outline-variant rounded-lg p-2 bg-surface-container-lowest">
                     <span class="text-on-surface font-medium min-w-[120px]">{{ action.label }}:</span>
                     <select 
                       :value="getUserPermissionState(res.id, action.id)"
                       @change="setUserPermissionState(res.id, action.id, ($event.target as HTMLSelectElement).value || 'inherit')"
                       class="text-xs border border-outline-variant rounded px-2 py-1 focus:ring-primary outline-none"
                       :class="{
                         'bg-primary/10 text-primary border-primary': getUserPermissionState(res.id, action.id) === 'allow',
                         'bg-error/10 text-error border-error': getUserPermissionState(res.id, action.id) === 'deny',
                         'bg-white text-on-surface-variant': getUserPermissionState(res.id, action.id) === 'inherit'
                       }"
                     >
                        <option value="inherit">Theo Role</option>
                        <option value="allow">Cho phép</option>
                        <option value="deny">Từ chối</option>
                     </select>
                   </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-12 text-on-surface-variant border border-dashed border-outline-variant rounded-xl">
           Vui lòng chọn user để thiết lập quyền cá nhân.
        </div>
      </div>
    </div>
  </NavigationLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavigationLayout from '../components/NavigationLayout.vue'
import { supabase } from '../../lib/supabase'

const activeTab = ref('roles')
const selectedRole = ref('CEO')
const selectedUserId = ref('')

const users = ref<any[]>([])

const rolePermissionsMap = ref<Record<string, boolean>>({})
const userPermissionsMap = ref<Record<string, 'allow'|'deny'|'inherit'>>({})

const resources = [
  { id: 'dashboard', label: 'Bảng điều khiển', actions: [
    { id: 'read', label: 'Truy cập (Xem)' }
  ] },
  { id: 'permissions', label: 'Cấu hình phân quyền', actions: [
    { id: 'read', label: 'Xem quyền' },
    { id: 'update', label: 'Thay đổi quyền' },
  ] },
  { id: 'departments', label: 'Phòng ban', actions: [
    { id: 'read', label: 'Danh sách' },
    { id: 'create', label: 'Thêm mới' },
    { id: 'update', label: 'Cập nhật' },
    { id: 'delete', label: 'Xóa' }
  ] },
  { id: 'users', label: 'Nhân sự', actions: [
    { id: 'read', label: 'Danh sách' },
    { id: 'create', label: 'Thêm mới' },
    { id: 'update', label: 'Cập nhật' }
  ] },
  { id: 'project-roles', label: 'Chức danh Dự án', actions: [
    { id: 'read', label: 'Danh sách' },
    { id: 'create', label: 'Thêm mới' },
    { id: 'update', label: 'Cập nhật' },
    { id: 'delete', label: 'Xóa' }
  ] },
  { id: 'projects', label: 'Dự án (Chi tiết & Danh sách)', actions: [
    { id: 'read', label: 'Xem và Tìm kiếm' },
    { id: 'create', label: 'Tạo dự án mới' },
    { id: 'update', label: 'Cập nhật chung' },
    { id: 'delete', label: 'Xóa dự án' },
    { id: 'evaluate', label: 'Đánh giá / Phê duyệt' },
    { id: 'allocate', label: 'Phân bổ nhân sự' },
    { id: 'view_financial', label: 'Xem doanh thu & Hóa đơn' },
    { id: 'add_financial', label: 'Thêm đợt TT / Doanh thu' }
  ] },
  { id: 'reports', label: 'Báo cáo định kỳ', actions: [
    { id: 'read', label: 'Xem báo cáo' },
    { id: 'create', label: 'Nộp báo cáo' },
    { id: 'evaluate', label: 'Nhận xét báo cáo' }
  ] },
  { id: 'payments', label: 'Thanh toán & Thu hồi', actions: [
    { id: 'read', label: 'Xem danh sách' },
    { id: 'create', label: 'Yêu cầu T.Toán / T.Hồi' }
  ] },
]

onMounted(async () => {
  await loadRolePermissions()
  await loadUsers()
})

const loadUsers = async () => {
  const { data, error } = await supabase.from('employees').select('id, name, email')
  if (!error && data) {
    users.value = data
  }
}

const loadRolePermissions = async () => {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('role', selectedRole.value)

  rolePermissionsMap.value = {}
  
  if (!error && data) {
     data.forEach(p => {
       const acts = p.actions || {}
       Object.keys(acts).forEach(action => {
         if (acts[action]) {
           rolePermissionsMap.value[`${p.resource}:${action}`] = true
         }
       })
     })
  }
}

const hasRolePermission = (resource: string, action: string) => {
  return !!rolePermissionsMap.value[`${resource}:${action}`]
}

const toggleRolePermission = async (resource: string, action: string, event: Event) => {
  const checked = (event.target as HTMLInputElement).checked
  const role = selectedRole.value
  
  if (checked) {
    rolePermissionsMap.value[`${resource}:${action}`] = true
  } else {
    delete rolePermissionsMap.value[`${resource}:${action}`]
  }

  // Construct new json
  const newActions: Record<string, boolean> = {}
  const resObj = resources.find(r => r.id === resource)
  if (resObj) {
     resObj.actions.forEach(a => {
        if (rolePermissionsMap.value[`${resource}:${a.id}`]) {
           newActions[a.id] = true
        }
     })
  }

  const { data: existing, error: fetchErr } = await supabase.from('role_permissions')
    .select('id')
    .eq('role', role)
    .eq('resource', resource)
    .single()

  if (existing) {
    await supabase.from('role_permissions').update({ actions: newActions }).eq('id', existing.id)
  } else {
    await supabase.from('role_permissions').insert({ role, resource, actions: newActions })
  }
}

const loadUserPermissions = async () => {
  if (!selectedUserId.value) return

  const { data, error } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', selectedUserId.value)

  userPermissionsMap.value = {}

  if (!error && data) {
     data.forEach(p => {
       const acts = p.actions || {}
       Object.keys(acts).forEach(action => {
         if (acts[action] === 'allow') userPermissionsMap.value[`${p.resource}:${action}`] = 'allow'
         if (acts[action] === 'deny') userPermissionsMap.value[`${p.resource}:${action}`] = 'deny'
       })
     })
  }
}

const getUserPermissionState = (resource: string, action: string) => {
  return userPermissionsMap.value[`${resource}:${action}`] || 'inherit'
}

const setUserPermissionState = async (resource: string, action: string, state: string) => {
  const userId = selectedUserId.value
  
  if (state === 'inherit') {
    delete userPermissionsMap.value[`${resource}:${action}`]
  } else {
    userPermissionsMap.value[`${resource}:${action}`] = state as 'allow'|'deny'
  }

  // Construct JSON
  const newActions: Record<string, string> = {}
  const resObj = resources.find(r => r.id === resource)
  if (resObj) {
     resObj.actions.forEach(a => {
        const s = userPermissionsMap.value[`${resource}:${a.id}`]
        if (s && s !== 'inherit') {
           newActions[a.id] = s
        }
     })
  }

  const { data: existing } = await supabase.from('user_permissions')
    .select('id')
    .eq('user_id', userId)
    .eq('resource', resource)
    .single()

  if (existing) {
    if (Object.keys(newActions).length === 0) {
       await supabase.from('user_permissions').delete().eq('id', existing.id)
    } else {
       await supabase.from('user_permissions').update({ actions: newActions }).eq('id', existing.id)
    }
  } else if (Object.keys(newActions).length > 0) {
    await supabase.from('user_permissions').insert({
      user_id: userId,
      resource,
      actions: newActions
    })
  }
}
</script>
