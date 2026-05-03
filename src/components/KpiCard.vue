<template>
  <div class="bg-white p-6 rounded-3xl border border-outline-variant shadow-sm space-y-4 hover:border-primary/30 transition-all group">
     <div class="flex justify-between items-start">
        <div class="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors">
           <component :is="icon" class="w-5 h-5 text-primary group-hover:text-white" />
        </div>
     </div>
     <div>
        <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{{ label }}</p>
        <h3 class="text-3xl font-black mt-1" :class="color || 'text-primary'">{{ val }}</h3>
        <p class="text-[9px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest mt-1">{{ sub }}</p>
     </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  val: string | number
  sub: string
  icon: Component
  color?: string
}>()
</script>
