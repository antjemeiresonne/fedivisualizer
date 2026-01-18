<script setup lang="ts">
import LegendDot from '@/components/atoms/LegendDot.vue'

defineProps<{
  color: string
  label: string
}>()
</script>

<template>
  <div class="legend-item">
    <LegendDot :color="color" />
    <span>{{ label }}</span>
  </div>
</template>

<style scoped>
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
}
</style>

