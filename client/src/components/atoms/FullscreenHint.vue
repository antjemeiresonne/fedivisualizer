<script setup lang="ts">
defineProps<{
  visible: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <div class="fullscreen-hint" :class="{ visible }">
    <button class="exit-fullscreen-btn" @click="$emit('click')">
      Press ESC or click to exit fullscreen
    </button>
  </div>
</template>

<style scoped>
.fullscreen-hint {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 9999;
}

.fullscreen-hint.visible {
  opacity: 1;
  pointer-events: auto;
}

.exit-fullscreen-btn {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.8);
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.exit-fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}
</style>

