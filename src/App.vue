<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabase'
import { usePermissions } from './composables/usePermissions'

const { loadPermissions, clearPermissions } = usePermissions()

let authListener: any = null

onMounted(() => {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      // Force refresh permissions on sign in or initial load
      await loadPermissions(session.user.id, true)
    } else {
      clearPermissions()
    }
  })
  authListener = data.subscription
})

onUnmounted(() => {
  if (authListener) {
    authListener.unsubscribe()
  }
})
</script>
