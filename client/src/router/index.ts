import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/details',
      name: 'details',
      component: () => import('@/views/DetailsView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue')
    },
    {
      path: '/visualization',
      name: 'visualization',
      component: () => import('@/views/VisualizationView.vue')
    },
    {
      path: '/admin/webmentions',
      name: 'admin-webmentions',
      component: () => import('@/views/AdminWebmentionsView.vue')
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
