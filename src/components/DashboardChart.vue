<template>
  <div class="w-full h-full">
    <apexchart
      type="donut"
      :options="chartOptions"
      :series="series"
      height="100%"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: Array<{ name: string, value: number, color: string }>
}>()

const series = computed(() => props.data.map(d => d.value))
const chartOptions = computed(() => ({
  chart: {
    type: 'donut',
  },
  labels: props.data.map(d => d.name),
  colors: props.data.map(d => d.color),
  dataLabels: {
    enabled: false
  },
  plotOptions: {
    pie: {
      donut: {
        size: '75%',
        labels: {
          show: false
        }
      }
    }
  },
  legend: {
    show: false
  },
  stroke: {
    width: 2,
    colors: ['#ffffff']
  },
  tooltip: {
    enabled: true,
    y: {
      formatter: (val: number) => `$${(val / 1e3).toFixed(0)}k`
    }
  }
}))
</script>
