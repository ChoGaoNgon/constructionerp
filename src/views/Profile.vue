<template>
  <NavigationLayout active-tab="profile">
    <div v-if="loading" class="animate-pulse space-y-8">
       <div class="h-10 bg-surface-container rounded-lg w-1/4" />
       <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="h-64 bg-surface-container rounded-2xl" />
          <div class="h-64 bg-surface-container rounded-2xl" />
       </div>
    </div>

    <div v-else class="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 class="text-2xl font-black text-primary tracking-tight">HỒ SƠ CÁ NHÂN</h1>
        <p class="text-sm text-on-surface-variant font-medium">Quản lý thông tin & Mật khẩu bảo mật</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Personal Info -->
        <div class="bg-white rounded-3xl border border-outline-variant shadow-sm p-8 space-y-6">
           <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                 <ShieldCheck class="w-8 h-8 text-primary" />
              </div>
              <div>
                 <h2 class="text-xl font-black text-primary">{{ profile?.name }}</h2>
                 <p class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{{ profile?.system_role }}</p>
              </div>
           </div>

           <div class="space-y-4 pt-4 border-t border-outline-variant/30">
              <div class="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl">
                 <Mail class="w-5 h-5 text-primary" />
                 <div>
                    <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Email đăng nhập</p>
                    <p class="text-sm font-bold text-primary">{{ profile?.email }}</p>
                 </div>
              </div>
              <div class="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl">
                 <Building class="w-5 h-5 text-primary" />
                 <div>
                    <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Phòng ban</p>
                    <p class="text-sm font-bold text-primary">{{ profile?.department?.name || 'Vãng lai' }}</p>
                 </div>
              </div>
           </div>
        </div>

        <!-- Password Change -->
        <div class="bg-white rounded-3xl border border-outline-variant shadow-sm p-8 space-y-6">
           <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                 <Key class="w-5 h-5 text-secondary" />
              </div>
              <h2 class="text-xl font-black text-primary">ĐỔI MẬT KHẨU</h2>
           </div>

           <form @submit.prevent="handleUpdatePassword" class="space-y-4">
              <div class="space-y-2">
                 <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Mật khẩu mới</label>
                 <input 
                  type="password" required
                  class="w-full p-4 bg-surface-container-low border-2 border-transparent focus:border-secondary transition-all rounded-2xl font-bold text-sm outline-none"
                  placeholder="Tối thiểu 6 ký tự"
                  v-model="passwords.newPassword"
                 />
              </div>
              <div class="space-y-2">
                 <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Xác nhận mật khẩu mới</label>
                 <input 
                  type="password" required
                  class="w-full p-4 bg-surface-container-low border-2 border-transparent focus:border-secondary transition-all rounded-2xl font-bold text-sm outline-none"
                  placeholder="Nhập lại mật khẩu"
                  v-model="passwords.confirmPassword"
                 />
              </div>

              <div v-if="message" :class="['p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2', message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-error/5 text-error border border-error/10']">
                 <CheckCircle2 v-if="message.type === 'success'" class="w-4 h-4" />
                 <AlertCircle v-else class="w-4 h-4" />
                 <p class="text-xs font-bold">{{ message.text }}</p>
              </div>

              <button 
                type="submit"
                :disabled="saving"
                class="w-full py-4 bg-secondary text-white rounded-2xl font-black shadow-lg hover:shadow-secondary/20 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                 <template v-if="saving">
                   ĐANG LƯU...
                 </template>
                 <template v-else>
                   <Save class="w-5 h-5" />
                   XÁC NHẬN ĐỔI MẬT KHẨU
                 </template>
              </button>
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
import { ShieldCheck, Mail, Building, Key, Save, AlertCircle, CheckCircle2 } from 'lucide-vue-next'

const user = ref<any>(null)
const profile = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const passwords = ref({
  newPassword: '',
  confirmPassword: ''
})
const message = ref<{ text: string, type: 'success' | 'error' } | null>(null)

async function fetchProfile() {
  loading.value = true
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    user.value = session.user
    const { data: emp } = await supabase
      .from('employees')
      .select('*, department:departments(name)')
      .eq('id', session.user.id)
      .single()
    if (emp) profile.value = emp
  }
  loading.value = false
}

async function handleUpdatePassword() {
  message.value = null

  if (passwords.value.newPassword.length < 6) {
    message.value = { text: 'Mật khẩu phải từ 6 ký tự trở lên.', type: 'error' }
    return
  }

  if (passwords.value.newPassword !== passwords.value.confirmPassword) {
    message.value = { text: 'Mật khẩu xác nhận không khớp.', type: 'error' }
    return
  }

  saving.value = true
  const { error } = await supabase.auth.updateUser({
    password: passwords.value.newPassword
  })

  if (error) {
    message.value = { text: error.message, type: 'error' }
  } else {
    message.value = { text: 'Đổi mật khẩu thành công!', type: 'success' }
    passwords.value = { newPassword: '', confirmPassword: '' }
  }
  saving.value = false
}

onMounted(() => {
  fetchProfile()
})
</script>
