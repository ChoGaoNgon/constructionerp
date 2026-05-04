<template>
  <div class="min-h-screen bg-surface-container flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-outline-variant p-10">
      <div class="text-center mb-10">
        <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 hover:rotate-0 transition-transform">
          <ShieldCheck class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-3xl font-black text-primary tracking-tight">ProForeman</h1>
        <p class="text-on-surface-variant font-bold text-sm mt-2 uppercase tracking-widest">Xác thực quản lý công trình</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div class="space-y-2">
          <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Tên đăng nhập / Email</label>
          <input 
            type="text" 
            placeholder="Ví dụ: nva.bch hoặc email@congty.vn"
            v-model="email"
            class="w-full bg-surface-container-low border-2 border-transparent focus:border-primary p-4 rounded-xl outline-none transition-all font-bold text-sm"
            required 
          />
        </div>
        <div class="space-y-2">
          <label class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Mật khẩu bảo mật</label>
          <input 
            type="password" 
            placeholder="••••••••"
            v-model="password"
            class="w-full bg-surface-container-low border-2 border-transparent focus:border-primary p-4 rounded-xl outline-none transition-all font-bold text-sm"
            required 
          />
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
        >
          {{ loading ? 'ĐANG XÁC THỰC...' : 'TRUY CẬP CỔNG THÔNG TIN' }}
          <ArrowRight v-if="!loading" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <div v-if="errorMsg" class="flex flex-col gap-2 p-4 bg-error-container/20 border border-error/20 rounded-xl text-error text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <div class="flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <p>{{ errorMsg }}</p>
          </div>
          <button 
            type="button"
            @click="debugVisible = !debugVisible"
            class="text-[10px] underline text-left opacity-70 hover:opacity-100"
          >
            {{ debugVisible ? 'Ẩn Debug' : 'Hiện thông tin Debug' }}
          </button>
          <div v-if="debugVisible" class="mt-2 p-2 bg-black/5 rounded font-mono text-[9px] break-all">
            URL: {{ supabaseUrl || 'Missing' }}<br/>
            Key: {{ supabaseKey ? (supabaseKey.substring(0, 10) + '...') : 'Missing' }}
          </div>
        </div>
      </form>

      <div class="mt-8 pt-8 border-t border-outline-variant text-center">
          <p class="text-[10px] text-on-surface-variant font-bold leading-relaxed">
            Hệ thống độc quyền. Truy cập trái phép sẽ được giám sát <br/> và ghi lại trên máy chủ kiểm tra trung tâm.
          </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-vue-next'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const configMissing = ref(false)
const debugVisible = ref(false)
const router = useRouter()

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

onMounted(async () => {
  if (!supabaseUrl || !supabaseKey || (supabaseUrl && supabaseUrl.includes('placeholder'))) {
    configMissing.value = true
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const { data: empData } = await supabase
      .from('employees')
      .select('system_role')
      .eq('id', session.user.id)
      .single()
    
    if (empData && empData.system_role === 'ADMIN') {
      router.push('/dashboard')
    } else {
      router.push('/reports')
    }
  }
})

const handleLogin = async () => {
  errorMsg.value = null

  if (configMissing.value) {
    errorMsg.value = "LỖI CẤU HÌNH: Vui lòng kiểm tra lại VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong Settings -> Secrets."
    return
  }

  loading.value = true
  
  // Safety timeout in case of network hang
  const timeoutId = setTimeout(() => {
    if (loading.value) {
      loading.value = false
      errorMsg.value = "Quá thời gian xác thực. Vui lòng kiểm tra lại kết nối mạng hoặc trạng thái của máy chủ Supabase."
    }
  }, 15000)
  
  try {
    let loginEmail = email.value

    // If it doesn't look like an email, try lookup via username
    if (!email.value.includes('@')) {
      const { data: emp, error: empError } = await supabase
        .from('employees')
        .select('email')
        .eq('username', email.value)
        .single()
      
      if (empError || !emp) {
        errorMsg.value = "Không tìm thấy tên đăng nhập này."
        loading.value = false
        clearTimeout(timeoutId)
        return
      }
      loginEmail = emp.email
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: password.value })
    if (!error) {
      if (!data.session) {
        errorMsg.value = "Đã đăng nhập thành công nhưng không có session. Kiểm tra lại cấu hình Supabase."
        clearTimeout(timeoutId)
        return
      }
      
      const { data: empData } = await supabase
        .from('employees')
        .select('system_role')
        .eq('id', data.session.user.id)
        .single()
      
      if (empData && empData.system_role === 'ADMIN') {
        await router.push('/dashboard')
      } else {
        await router.push('/reports')
      }
    } else {
      let msg = error.message
      if (msg.includes("Email not confirmed")) {
        msg = "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư hoặc bật 'Confirm Email' trong Supabase Auth Settings."
      } else if (msg.includes("Invalid login credentials")) {
        msg = "Email hoặc mật khẩu không chính xác. Hãy đảm bảo bạn đã tạo tài khoản trong mục Authentication của Supabase."
      }
      errorMsg.value = msg
      console.error("Login Error:", error)
    }
  } catch (err: any) {
    errorMsg.value = "Đã xảy ra lỗi không mong muốn: " + (err.message || "Unknown error")
    console.error("Catch Error:", err)
  } finally {
    loading.value = false
    clearTimeout(timeoutId)
  }
}
</script>
