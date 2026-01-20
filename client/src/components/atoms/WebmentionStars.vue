<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { Webmention } from '@/composables/useWebmentions'

interface Star {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  pulse: number
  mention: Webmention
}

const props = defineProps<{
  mentions: Webmention[]
}>()

const stars = ref<Star[]>([])
const animationFrame = ref<number | null>(null)
const hoveredStar = ref<Star | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })
const isTooltipHovered = ref(false)
let hideTimeout: ReturnType<typeof setTimeout> | null = null

const TOOLTIP_WIDTH = 320
const TOOLTIP_HEIGHT = 280
const TOOLTIP_OFFSET = 15

function createStarFromMention(mention: Webmention): Star {

  let x: number, y: number

  do {
    x = Math.random() * 90 + 5
    y = Math.random() * 73 + 15
  } while (
    x > 25 && x < 75 && y > 30 && y < 70
  )

  return {
    id: mention.id,
    x,
    y,
    size: 4 + Math.random() * 8,
    opacity: 0.5 + Math.random() * 0.5,
    pulse: Math.random() * Math.PI * 2,
    mention
  }
}

function generateStars(mentions: Webmention[]) {
  return mentions.map(createStarFromMention)
}

watch(() => props.mentions, (newMentions, oldMentions) => {
  const oldIds = new Set(oldMentions?.map(m => m.id) || [])
  const newIds = new Set(newMentions.map(m => m.id))

  for (const mention of newMentions) {
    if (!oldIds.has(mention.id)) {
      const newStar = createStarFromMention(mention)
      newStar.opacity = 0
      stars.value.push(newStar)
      // Animate opacity in
      requestAnimationFrame(() => {
        const star = stars.value.find(s => s.id === newStar.id)
        if (star) star.opacity = 0.5 + Math.random() * 0.5
      })
    }
  }

  stars.value = stars.value.filter(s => newIds.has(s.id))
}, { deep: true })

onMounted(() => {
  stars.value = generateStars(props.mentions || [])
})

onUnmounted(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
  }
})

const starStyle = (star: Star) => ({
  left: `${star.x}%`,
  top: `${star.y}%`,
  width: `${star.size}px`,
  height: `${star.size}px`,
  opacity: star.opacity,
  animationDelay: `${star.pulse}s`
})

function handleMouseEnter(star: Star, event: MouseEvent) {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  hoveredStar.value = star

  const target = event.target as HTMLElement
  const rect = target.getBoundingClientRect()

  let x = rect.right + TOOLTIP_OFFSET
  let y = rect.top

  if (x + TOOLTIP_WIDTH > window.innerWidth) {
    x = rect.left - TOOLTIP_WIDTH - TOOLTIP_OFFSET
  }

  if (x < 0) {
    x = TOOLTIP_OFFSET
  }

  if (y + TOOLTIP_HEIGHT > window.innerHeight) {
    y = window.innerHeight - TOOLTIP_HEIGHT - TOOLTIP_OFFSET
  }

  if (y < 0) {
    y = TOOLTIP_OFFSET
  }

  tooltipPosition.value = { x, y }
}


function handleMouseLeave() {
  hideTimeout = setTimeout(() => {
    if (!isTooltipHovered.value) {
      hoveredStar.value = null
    }
  }, 150)
}

function handleTooltipEnter() {
  isTooltipHovered.value = true
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

function handleTooltipLeave() {
  isTooltipHovered.value = false
  hoveredStar.value = null
}


function handleClick(star: Star) {
  window.open(star.mention.source, '_blank', 'noopener,noreferrer')
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}


function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="stars-container">
    <div
      v-for="star in stars"
      :key="star.id"
      class="star"
      :style="starStyle(star)"
      @mouseenter="handleMouseEnter(star, $event)"
      @mouseleave="handleMouseLeave"
      @click="handleClick(star)"
    />

    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="hoveredStar"
          class="star-tooltip"
          :style="{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`
          }"
          @mouseenter="handleTooltipEnter"
          @mouseleave="handleTooltipLeave"
        >
          <div class="tooltip-header">
            <span class="tooltip-icon">⭐</span>
            <span class="tooltip-title">Webmention ontvangen</span>
          </div>

          <div class="tooltip-source">
            <span class="tooltip-label">Van:</span>
            <span class="tooltip-domain">{{ extractDomain(hoveredStar.mention.source) }}</span>
          </div>

          <div v-if="hoveredStar.mention.content" class="tooltip-excerpt">
            <span class="tooltip-label">Context:</span>
            <p class="tooltip-content">
              "{{ hoveredStar.mention.content }}"
            </p>
          </div>

          <a
            :href="hoveredStar.mention.source"
            target="_blank"
            rel="noopener noreferrer"
            class="tooltip-link-btn"
            @click.stop
          >
            Bekijk bron
          </a>

          <div class="tooltip-footer">
            <span class="tooltip-date">{{ formatDate(hoveredStar.mention.timestamp) }}</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.stars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  box-shadow:
    0 0 4px 2px rgba(255, 255, 255, 0.6),
    0 0 8px 4px rgba(255, 255, 255, 0.4),
    0 0 16px 8px rgba(255, 255, 255, 0.2);
  animation: twinkle 3s ease-in-out infinite;
  transition: opacity 1s ease-in-out, transform 0.2s ease;
  cursor: pointer;
  pointer-events: auto;
}

.star:hover {
  transform: scale(2);
  box-shadow:
    0 0 8px 4px rgba(255, 255, 255, 0.8),
    0 0 16px 8px rgba(255, 255, 255, 0.6),
    0 0 32px 16px rgba(255, 255, 255, 0.3);
}

@keyframes twinkle {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.5);
  }
}
</style>

<style>
.star-tooltip {
  position: fixed;
  z-index: 9999;
  background: rgba(15, 15, 25, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 1rem;
  max-width: 320px;
  min-width: 240px;
  backdrop-filter: blur(10px);
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(100, 150, 255, 0.1);
  pointer-events: auto;
  transform-origin: top left;
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tooltip-icon {
  font-size: 1.2rem;
  animation: starPulse 1.5s ease-in-out infinite;
}

@keyframes starPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.tooltip-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 600;
}

.tooltip-source,
.tooltip-excerpt {
  margin-bottom: 0.5rem;
}

.tooltip-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  display: block;
  margin-bottom: 0.2rem;
}

.tooltip-domain {
  color: rgba(100, 150, 255, 0.9);
  font-size: 0.95rem;
  font-weight: 500;
}


.tooltip-content {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0.25rem 0 0 0;
  font-style: italic;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tooltip-link-btn {
  display: block;
  width: 100%;
  padding: 0.6rem 1rem;
  margin: 0.75rem 0;
  background: rgba(100, 150, 255, 0.2);
  border: 1px solid rgba(100, 150, 255, 0.4);
  border-radius: 8px;
  color: rgba(100, 150, 255, 1);
  text-decoration: none;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tooltip-link-btn:hover {
  background: rgba(100, 150, 255, 0.3);
  border-color: rgba(100, 150, 255, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(100, 150, 255, 0.2);
}

.tooltip-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.tooltip-date {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
}

.tooltip-enter-active {
  animation: tooltipGrowIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tooltip-leave-active {
  animation: tooltipShrinkOut 0.2s cubic-bezier(0.55, 0, 1, 0.45);
}

@keyframes tooltipGrowIn {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes tooltipShrinkOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
}
</style>

