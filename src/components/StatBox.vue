<template>
  <div class="p-4 rounded-2xl border flex flex-col items-center text-center transition-all" 
       :class="highlight ? 'bg-primary/5 border-primary/20 scale-105 shadow-sm' : 'bg-surface-container-low border-outline-variant'">
     <p class="text-[8px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">{{ label }}</p>
     <p :class="['text-sm font-black', highlight ? 'text-primary' : 'text-on-surface']">{{ val }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  val: string
  highlight?: boolean
}>()
</script>
