<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import VisualizationOverlay, { type VisualizationMode } from '@/components/organisms/VisualizationOverlay.vue'
import FullscreenHint from '@/components/atoms/FullscreenHint.vue'
import { useThreeScene, usePlanets, useComets, useSounds, type PostData } from '@/composables/visualization'
import { useInfluenceOrbits } from '@/composables/visualization/useInfluenceOrbits'
import { useInfluenceVisualization } from '@/composables/visualization/useInfluenceVisualization'

const containerRef = ref<HTMLDivElement>()
const visualizationRef = ref<HTMLDivElement>()
const isFullscreen = ref(false)
const visualizationMode = ref<VisualizationMode>('both')

let animationId: number
let eventSource: EventSource | null = null
let influenceInterval: ReturnType<typeof setInterval> | null = null

const threeScene = useThreeScene(containerRef)
const sounds = useSounds()
const { influencers, fetchInfluencers } = useInfluenceOrbits()

let planetsManager: ReturnType<typeof usePlanets>
let cometsManager: ReturnType<typeof useComets>
let influenceVis: ReturnType<typeof useInfluenceVisualization>

let postsVisible = true
let influencersVisible = true

function animate() {
  animationId = requestAnimationFrame(animate)

  const time = performance.now() * 0.001

  threeScene.fadeFlash()
  threeScene.updateShaders(time)
  threeScene.updateCamera()

  if (postsVisible) {
    planetsManager.updatePlanets(time)
    planetsManager.updateConnections()
    cometsManager.updateComets()
  }

  if (influencersVisible && influenceVis) {
    influenceVis.animateOrbits(time)
  }

  threeScene.render()
}

function getColorIndex(data: PostData, type: string): number {
  if (type === 'project_hashtag') return 9
  if ((data.favourites && data.favourites > 5) || (data.reblogs && data.reblogs > 2)) return 5
  if (data.reblogs && data.reblogs > 0) return 6
  if (data.mediaAttachments && data.mediaAttachments > 0) return 3
  if (data.inReplyTo) return 4
  if (data.mentions && data.mentions.length > 0) return 2
  if (data.tags && data.tags.length > 0) return 1
  if (data.content && data.content.length > 200) return 7
  if (data.content && data.content.length < 50) return 8
  return 0
}

function connectToStream() {
  const baseUrl = import.meta.env.VITE_SSE_URL || ''

  eventSource = new EventSource(`${baseUrl}/events`)

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      if (data.type === 'activitypub' || data.type === 'webmention' || data.type === 'project_hashtag') {
        const contentLength = data.data.content?.length || 50
        const postData = data.data as PostData

        planetsManager.createPlanet(contentLength, data.type, postData)

        const colorIndex = getColorIndex(postData, data.type)
        sounds.playPlanetSpawn(colorIndex)

        if (postData.inReplyTo) {
          sounds.playConnection()
        }

        if (data.type === 'webmention') {
          cometsManager.createComet()
          sounds.playComet()
        }
      }
    } catch (error) {
      console.error('Error parsing event:', error)
    }
  }

  eventSource.onerror = () => {
    console.log('SSE connection error, will reconnect...')
  }
}

async function toggleFullscreen() {
  sounds.initAudio()

  if (!document.fullscreenElement) {
    try {
      await visualizationRef.value?.requestFullscreen()
      isFullscreen.value = true
    } catch (err) {
      console.error('Error entering fullscreen:', err)
    }
  } else {
    try {
      await document.exitFullscreen()
      isFullscreen.value = false
    } catch (err) {
      console.error('Error exiting fullscreen:', err)
    }
  }
}

function toggleSound() {
  sounds.toggle()
}

function setVisualizationMode(mode: VisualizationMode) {
  visualizationMode.value = mode

  postsVisible = mode === 'posts' || mode === 'both'
  influencersVisible = mode === 'influencers' || mode === 'both'

  if (planetsManager) {
    planetsManager.setVisible(postsVisible)
  }
  if (cometsManager) {
    cometsManager.setVisible(postsVisible)
  }

  if (influenceVis) {
    influenceVis.setVisible(influencersVisible)
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  const sceneData = threeScene.init()
  if (!sceneData) return

  planetsManager = usePlanets(threeScene.getScene)
  cometsManager = useComets(threeScene.getScene, threeScene.setFlashIntensity)
  influenceVis = useInfluenceVisualization(threeScene.getScene())

  watch(influencers, (newInfluencers) => {
    if (newInfluencers.length > 0 && influenceVis) {
      influenceVis.updateInfluencers(newInfluencers)
    }
  }, { immediate: true })

  fetchInfluencers(15)

  influenceInterval = setInterval(() => {
    fetchInfluencers(15)
  }, 30000)

  animate()
  connectToStream()

  window.addEventListener('resize', threeScene.onWindowResize)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  if (eventSource) {
    eventSource.close()
  }

  if (influenceInterval) {
    clearInterval(influenceInterval)
  }

  window.removeEventListener('resize', threeScene.onWindowResize)
  document.removeEventListener('fullscreenchange', onFullscreenChange)

  influenceVis?.clearInfluencers()
  planetsManager?.dispose()
  cometsManager?.dispose()
  threeScene.dispose()
  sounds.dispose()
})
</script>

<template>
  <div
    ref="visualizationRef"
    class="visualization"
    :class="{ 'is-fullscreen': isFullscreen }"
  >
    <div ref="containerRef" class="canvas-container"></div>

    <VisualizationOverlay
      :hidden="isFullscreen"
      :sound-enabled="sounds.enabled.value"
      :visualization-mode="visualizationMode"
      @toggle-fullscreen="toggleFullscreen"
      @toggle-sound="toggleSound"
      @set-visualization-mode="setVisualizationMode"
    />

    <FullscreenHint
      :visible="isFullscreen"
      @click="toggleFullscreen"
    />
  </div>
</template>

<style scoped>
.visualization {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #000;
}

.visualization.is-fullscreen {
  width: 100vw;
  height: 100vh;
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  cursor: grab;
}

.canvas-container:active {
  cursor: grabbing;
}

.canvas-container canvas {
  display: block;
}
</style>
