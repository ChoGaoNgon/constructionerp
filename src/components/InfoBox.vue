<template>
  <div class="space-y-1">
    <div class="flex items-center gap-1.5 text-on-surface-variant/70">
      <component :is="icon" class="w-3 h-3" />
      <span class="text-[9px] font-black uppercase tracking-widest">{{ label }}</span>
    </div>
    <p :class="['text-lg font-black', color || 'text-primary']">{{ val }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  val: string | number
  icon: Component
  color?: string
}>()
</script>
