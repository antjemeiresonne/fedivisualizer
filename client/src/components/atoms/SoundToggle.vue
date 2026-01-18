<script setup lang="ts">
defineProps<{
  enabled: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button
    class="sound-toggle"
    :class="{ muted: !enabled }"
    type="button"
    role="switch"
    :aria-checked="enabled"
    :aria-label="enabled ? 'Sound enabled, click to mute' : 'Sound muted, click to enable'"
    @click="$emit('toggle')"
  >
    <span class="icon" aria-hidden="true">{{ enabled ? '🔊' : '🔇' }}</span>
  </button>
</template>

<style scoped>
.sound-toggle {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  width: 44px;
  height: 44px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.sound-toggle:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.sound-toggle.muted {
  opacity: 0.6;
}

.sound-toggle .icon {
  line-height: 1;
}
</style>
