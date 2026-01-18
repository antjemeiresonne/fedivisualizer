<script setup lang="ts">
defineEmits<{
  click: []
}>()
</script>

<template>
  <button class="fullscreen-btn" @click="$emit('click')">
    <span class="icon">⛶</span>
    Fullscreen
  </button>
</template>

<style scoped>
.fullscreen-btn {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 12px;
}

.fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.fullscreen-btn .icon {
  font-size: 1.1rem;
}
</style>

