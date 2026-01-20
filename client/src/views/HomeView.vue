<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import WebmentionStars from '@/components/atoms/WebmentionStars.vue'
import { useWebmentions } from '@/composables/useWebmentions'

const router = useRouter()
const { approvedMentions, init, disconnectSSE } = useWebmentions()

const navigateToDetails = () => {
  router.push('/details')
}

const navigateToVisualization = () => {
  router.push('/visualization')
}

onMounted(() => {
  init()
})

onUnmounted(() => {
  disconnectSSE()
})
</script>

<template>
  <div class="home">
    <div class="video-background">
      <WebmentionStars :mentions="approvedMentions" />
    </div>

    <div class="content">
      <h1 class="title">Fedivisualizer</h1>
      <p class="subtitle">Real-time visualisatie van gedecentraliseerde sociale netwerken</p>
      <div class="buttons">
        <button class="learn-more-btn" @click="navigateToDetails">
          Ontdek meer
          <span class="arrow">→</span>
        </button>
        <button class="project-btn" @click="navigateToVisualization">
          Naar het project
          <span class="arrow">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  z-index: 0;
}

.content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
  pointer-events: none;
}

.title {
  font-size: 3.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1rem;
  text-shadow: 0 0 30px rgba(100, 150, 255, 0.3);
  animation: fadeInUp 1s ease-out;
  pointer-events: auto;
}

.subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 3rem;
  max-width: 600px;
  animation: fadeInUp 1s ease-out 0.2s both;
  pointer-events: auto;
}

.buttons {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
  animation: fadeInUp 1s ease-out 0.4s both;
  pointer-events: auto;
}

.learn-more-btn,
.project-btn {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 1rem;
  color: #fff;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.learn-more-btn:hover,
.project-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #fff;
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(100, 150, 255, 0.2);
}

.project-btn {
  background: rgba(100, 150, 255, 0.2);
  border-color: rgba(100, 150, 255, 0.8);
}

.project-btn:hover {
  background: rgba(100, 150, 255, 0.3);
  border-color: rgba(100, 150, 255, 1);
  box-shadow: 0 10px 30px rgba(100, 150, 255, 0.4);
}

.learn-more-btn .arrow,
.project-btn .arrow {
  transition: transform 0.3s ease;
}

.learn-more-btn:hover .arrow,
.project-btn:hover .arrow {
  transform: translateX(5px);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }
}
</style>

