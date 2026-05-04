<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { usePermissions } from './composables/usePermissions'

const { loadPermissions } = usePermissions()

onMounted(() => {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      await loadPermissions()
    }
  })
})
</script>
