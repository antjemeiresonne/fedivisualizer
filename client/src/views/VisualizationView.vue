<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import VisualizationOverlay from '@/components/organisms/VisualizationOverlay.vue'
import FullscreenHint from '@/components/atoms/FullscreenHint.vue'
import { useThreeScene, usePlanets, useComets, useSounds, type PostData } from '@/composables/visualization'

const containerRef = ref<HTMLDivElement>()
const visualizationRef = ref<HTMLDivElement>()
const isFullscreen = ref(false)

let animationId: number
let eventSource: EventSource | null = null

// Initialize composables
const threeScene = useThreeScene(containerRef)
const sounds = useSounds()
let planetsManager: ReturnType<typeof usePlanets>
let cometsManager: ReturnType<typeof useComets>

function animate() {
  animationId = requestAnimationFrame(animate)

  const time = performance.now() * 0.001

  threeScene.fadeFlash()
  threeScene.updateShaders(time)
  threeScene.updateCamera()

  planetsManager.updatePlanets(time)
  planetsManager.updateConnections()
  cometsManager.updateComets()

  threeScene.render()
}

// Get color index for sound pitch based on post type
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
  const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : ''

  eventSource = new EventSource(`${baseUrl}/events`)

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      if (data.type === 'activitypub' || data.type === 'webmention' || data.type === 'project_hashtag') {
        const contentLength = data.data.content?.length || 50
        const postData = data.data as PostData

        planetsManager.createPlanet(contentLength, data.type, postData)

        // Play planet spawn sound
        const colorIndex = getColorIndex(postData, data.type)
        sounds.playPlanetSpawn(colorIndex)

        // Play connection sound if it's a reply
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
  // Initialize audio on user interaction
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

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  const sceneData = threeScene.init()
  if (!sceneData) return

  planetsManager = usePlanets(threeScene.getScene)
  cometsManager = useComets(threeScene.getScene, threeScene.setFlashIntensity)

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

  window.removeEventListener('resize', threeScene.onWindowResize)
  document.removeEventListener('fullscreenchange', onFullscreenChange)

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
      @toggle-fullscreen="toggleFullscreen"
      @toggle-sound="toggleSound"
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
