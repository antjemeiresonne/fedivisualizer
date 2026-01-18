<script setup lang="ts">
import LegendItem from '@/components/molecules/LegendItem.vue'

const legendItems = [
  { color: 'default', label: 'New Posts' },
  { color: 'tags', label: 'Has Tags' },
  { color: 'mentions', label: 'Has Mentions' },
  { color: 'media', label: 'Has Media' },
  { color: 'reply', label: 'Replies' },
  { color: 'popular', label: 'Popular' },
  { color: 'reblogged', label: 'Reblogged' },
  { color: 'long', label: 'Long Content' },
  { color: 'short', label: 'Short Content' },
  { color: 'hashtag', label: 'Project Hashtag' },
]
</script>

<template>
  <div class="legend">
    <LegendItem
      v-for="item in legendItems"
      :key="item.color"
      :color="item.color"
      :label="item.label"
    />
  </div>
</template>

<style scoped>
.legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.4rem;
}
</style>

