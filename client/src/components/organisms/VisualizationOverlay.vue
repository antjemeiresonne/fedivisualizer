<script setup lang="ts">
import VisualizationLegend from '@/components/molecules/VisualizationLegend.vue'
import FullscreenButton from '@/components/atoms/FullscreenButton.vue'
import SoundToggle from '@/components/atoms/SoundToggle.vue'

export type VisualizationMode = 'posts' | 'influencers' | 'both'

defineProps<{
  hidden: boolean
  soundEnabled: boolean
  visualizationMode: VisualizationMode
}>()

defineEmits<{
  toggleFullscreen: []
  toggleSound: []
  setVisualizationMode: [mode: VisualizationMode]
}>()
</script>

<template>
  <div class="overlay" :class="{ hidden }">
    <div class="info">
      <h2>Fediverse Live</h2>
      <p>Real-time visualization of decentralized social activity</p>
      <p class="drag-hint">🖱️ Drag to look around</p>

      <div class="mode-toggle">
        <h4>🎨 Visualization Mode</h4>
        <div class="toggle-buttons">
          <button
            :class="{ active: visualizationMode === 'posts' }"
            @click="$emit('setVisualizationMode', 'posts')"
          >
            Posts
          </button>
          <button
            :class="{ active: visualizationMode === 'influencers' }"
            @click="$emit('setVisualizationMode', 'influencers')"
          >
            Influencers
          </button>
          <button
            :class="{ active: visualizationMode === 'both' }"
            @click="$emit('setVisualizationMode', 'both')"
          >
            Both
          </button>
        </div>
      </div>


      <VisualizationLegend />
    </div>

    <div class="controls">
      <SoundToggle :enabled="soundEnabled" @toggle="$emit('toggleSound')" />
      <FullscreenButton @click="$emit('toggleFullscreen')" />
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  padding: 2rem;
  box-sizing: border-box;
  transition: opacity 0.3s ease;
  z-index: 9999;
}

.overlay.hidden {
  opacity: 0;
  pointer-events: none;
}

.info {
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  color: #fff;
  max-width: 300px;
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.5);
  padding: 1.5rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info h2 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 0 20px rgba(100, 150, 255, 0.5);
}

.info p {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1rem 0;
}

.drag-hint {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.mode-toggle {
  margin: 1rem 0;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.mode-toggle h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
}

.toggle-buttons {
  display: flex;
  gap: 0.5rem;
}

.toggle-buttons button {
  flex: 1;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-buttons button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.toggle-buttons button.active {
  background: rgba(99, 102, 241, 0.3);
  border-color: rgba(99, 102, 241, 0.5);
  color: #fff;
}


.controls {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  gap: 0.75rem;
  pointer-events: auto;
}

@media (max-width: 768px) {
  .overlay {
    padding: 1rem;
  }

  .info {
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    max-width: none;
  }

  .info h2 {
    font-size: 1.2rem;
  }
}
</style>

