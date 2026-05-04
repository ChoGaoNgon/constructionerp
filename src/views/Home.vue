<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="flex flex-col items-center gap-4">
      <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm font-bold text-on-surface-variant tracking-widest uppercase">Đang kiểm tra xác thực...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'

const router = useRouter()

onMounted(async () => {
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
  } else {
    router.push('/login')
  }
})
</script>
