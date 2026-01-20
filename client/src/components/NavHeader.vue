<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import profilePicture from '@/assets/images/foto.jpg'

const route = useRoute()

const isHome = computed(() => route.path === '/')
</script>

<template>
  <header class="nav-header" :class="{ transparent: isHome }">
    <nav>
      <router-link to="/" class="logo">
        <span class="logo-icon">◈</span>
        <span class="logo-text">Fedivisualizer</span>
      </router-link>

      <router-link to="/profile" class="profile-link">
        <span>Antje Meiresonne</span>
        <img :src="profilePicture" alt="Antje Meiresonne" class="profile-avatar" />
      </router-link>
    </nav>
  </header>
</template>

<style scoped>
.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1rem 2rem;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.3s ease;
}

.nav-header.transparent {
  background: transparent;
  border-bottom: none;
}

nav {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #fff;
  font-weight: 600;
  font-size: 1.1rem;
  transition: opacity 0.3s ease;
}

.logo:hover {
  opacity: 0.8;
}

.logo-icon {
  font-size: 1.5rem;
  color: #7ba3e0;
}

.profile-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  border-radius: 50px;
  transition: all 0.3s ease;
}

.profile-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(123, 163, 224, 0.5);
}

@media (max-width: 768px) {
  .nav-header {
    padding: 1rem;
  }

  .logo-text {
    display: none;
  }

  .profile-link span {
    display: none;
  }

  .profile-link {
    padding: 0;
  }
}
</style>
