<script setup lang="ts">
defineProps<{
  color: string
}>()
</script>

<template>
  <span class="dot" :class="color"></span>
</template>

<style scoped>
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
  flex-shrink: 0;
}

.dot.default {
  background: #6366f1;
  color: #6366f1;
}

.dot.tags {
  background: #8b5cf6;
  color: #8b5cf6;
}

.dot.mentions {
  background: #ec4899;
  color: #ec4899;
}

.dot.media {
  background: #ef4444;
  color: #ef4444;
}

.dot.reply {
  background: #f97316;
  color: #f97316;
}

.dot.popular {
  background: #eab308;
  color: #eab308;
}

.dot.reblogged {
  background: #22c55e;
  color: #22c55e;
}

.dot.long {
  background: #14b8a6;
  color: #14b8a6;
}

.dot.short {
  background: #06b6d4;
  color: #06b6d4;
}

.dot.hashtag {
  background: #3b82f6;
  color: #3b82f6;
}
</style>

