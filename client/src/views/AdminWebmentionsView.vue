<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useWebmentions } from '@/composables/useWebmentions'

const {
  webmentions,
  approvedMentions,
  pendingMentions,
  loading,
  isAuthenticated,
  authError,
  init,
  disconnectSSE,
  login,
  logout,
  fetchMentions,
  approveMention,
  rejectMention
} = useWebmentions()

const filter = ref<'all' | 'pending' | 'approved'>('pending')
const secretInput = ref('')
const isLoggingIn = ref(false)

const filteredMentions = computed(() => {
  switch (filter.value) {
    case 'pending':
      return pendingMentions.value
    case 'approved':
      return approvedMentions.value
    default:
      return webmentions.value
  }
})

const pendingCount = computed(() => pendingMentions.value.length)
const approvedCount = computed(() => approvedMentions.value.length)

async function handleLogin() {
  if (!secretInput.value.trim()) return
  isLoggingIn.value = true
  const success = await login(secretInput.value)
  if (success) {
    secretInput.value = ''
    fetchMentions()
  }
  isLoggingIn.value = false
}

function handleLogout() {
  logout()
}

watch(isAuthenticated, (authed) => {
  if (authed) {
    fetchMentions()
  }
})

function formatDate(timestamp: string) {
  return new Date(timestamp).toLocaleString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function truncateUrl(url: string, maxLength = 50) {
  if (url.length <= maxLength) return url
  return url.substring(0, maxLength) + '...'
}

onMounted(() => {
  init(true)
})

onUnmounted(() => {
  disconnectSSE()
})
</script>

<template>
  <div class="admin">
    <div class="container">
      <header class="header">
        <h1>Webmention Beheer</h1>
        <p class="subtitle">Beheer inkomende webmentions voor je site</p>
      </header>

      <div v-if="!isAuthenticated" class="login-card">
        <div class="login-icon">🔐</div>
        <h2>Aanmelden</h2>
        <p>Voer het admin wachtwoord in om webmentions te beheren.</p>
        <form @submit.prevent="handleLogin" class="login-form">
          <input
            v-model="secretInput"
            type="password"
            placeholder="Admin wachtwoord"
            :disabled="isLoggingIn"
          />
          <button type="submit" :disabled="isLoggingIn || !secretInput.trim()">
            {{ isLoggingIn ? 'Aanmelden...' : 'Aanmelden' }}
          </button>
        </form>
        <p v-if="authError" class="auth-error">{{ authError }}</p>
        <div class="back-link">
          <router-link to="/">← Terug naar home</router-link>
        </div>
      </div>

      <template v-else>
        <div class="auth-bar">
          <span>✓ Ingelogd als admin</span>
          <button @click="handleLogout" class="logout-btn">Uitloggen</button>
        </div>

        <div class="stats">
          <div class="stat-card pending">
            <span class="stat-number">{{ pendingCount }}</span>
            <span class="stat-label">Wachtend</span>
          </div>
          <div class="stat-card approved">
            <span class="stat-number">{{ approvedCount }}</span>
            <span class="stat-label">Goedgekeurd</span>
          </div>
          <div class="stat-card total">
            <span class="stat-number">{{ webmentions.length }}</span>
            <span class="stat-label">Totaal</span>
          </div>
        </div>

        <div class="filter-tabs">
          <button
          :class="{ active: filter === 'pending' }"
          @click="filter = 'pending'"
        >
          Wachtend ({{ pendingCount }})
        </button>
        <button
          :class="{ active: filter === 'approved' }"
          @click="filter = 'approved'"
        >
          Goedgekeurd ({{ approvedCount }})
        </button>
        <button
          :class="{ active: filter === 'all' }"
          @click="filter = 'all'"
        >
          Alles ({{ webmentions.length }})
        </button>
      </div>

      <div v-if="loading" class="loading">
        Laden...
      </div>

      <div v-else-if="filteredMentions.length === 0" class="empty">
        <p v-if="filter === 'pending'">Geen webmentions in afwachting van goedkeuring.</p>
        <p v-else-if="filter === 'approved'">Nog geen goedgekeurde webmentions.</p>
        <p v-else>Nog geen webmentions ontvangen.</p>
      </div>

      <div v-else class="mentions-list">
        <div
          v-for="mention in filteredMentions"
          :key="mention.id"
          class="mention-card"
          :class="{ approved: mention.approved }"
        >
          <div class="mention-header">
            <span class="mention-id">#{{ mention.id }}</span>
            <span class="mention-date">{{ formatDate(mention.timestamp) }}</span>
            <span v-if="mention.approved" class="badge approved">✓ Goedgekeurd</span>
            <span v-else class="badge pending">⏳ Wachtend</span>
          </div>

          <div class="mention-body">
            <div class="mention-field">
              <label>Bron:</label>
              <a :href="mention.source" target="_blank" rel="noopener noreferrer">
                {{ truncateUrl(mention.source) }}
              </a>
            </div>
            <div class="mention-field">
              <label>Doel:</label>
              <span>{{ truncateUrl(mention.target) }}</span>
            </div>
            <div v-if="mention.content" class="mention-field">
              <label>Inhoud:</label>
              <p class="content-preview">{{ mention.content }}</p>
            </div>
          </div>

          <div class="mention-actions">
            <template v-if="!mention.approved">
              <button class="btn-approve" @click="approveMention(mention.id)">
                ✓ Goedkeuren
              </button>
              <button class="btn-reject" @click="rejectMention(mention.id)">
                ✕ Afwijzen
              </button>
            </template>
            <template v-else>
              <button class="btn-reject" @click="rejectMention(mention.id)">
                ✕ Verwijderen
              </button>
            </template>
          </div>
        </div>
      </div>

      <div class="back-link">
        <router-link to="/">← Terug naar home</router-link>
      </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.admin {
  min-height: 100vh;
  padding: 6rem 2rem 4rem;
  background: linear-gradient(180deg, #0a0a0f 0%, #12121a 100%);
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

h1 {
  font-size: 2.5rem;
  color: #fff;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
}

.login-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 3rem;
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}

.login-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.login-card h2 {
  color: #fff;
  margin-bottom: 0.5rem;
}

.login-card > p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.login-form input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 0.875rem 1rem;
  color: #fff;
  font-size: 1rem;
  text-align: center;
}

.login-form input:focus {
  outline: none;
  border-color: rgba(100, 150, 255, 0.5);
}

.login-form button {
  background: rgba(100, 150, 255, 0.3);
  border: 1px solid rgba(100, 150, 255, 0.5);
  border-radius: 8px;
  padding: 0.875rem;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-form button:hover:not(:disabled) {
  background: rgba(100, 150, 255, 0.4);
}

.login-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-error {
  color: #f87171;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.login-card .back-link {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.auth-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 2rem;
  color: #4ade80;
  font-size: 0.9rem;
}

.logout-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.stat-card.pending {
  border-color: rgba(251, 191, 36, 0.3);
}

.stat-card.approved {
  border-color: rgba(74, 222, 128, 0.3);
}

.stat-number {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.25rem;
}

.stat-card.pending .stat-number {
  color: #fbbf24;
}

.stat-card.approved .stat-number {
  color: #4ade80;
}

.stat-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.5rem;
  border-radius: 12px;
}

.filter-tabs button {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.filter-tabs button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.filter-tabs button.active {
  background: rgba(100, 150, 255, 0.2);
  color: #fff;
}

.loading,
.empty {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.5);
}

.mentions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mention-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.mention-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.mention-card.approved {
  border-color: rgba(74, 222, 128, 0.2);
}

.mention-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.mention-id {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
}

.mention-date {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

.badge {
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge.pending {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.badge.approved {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.mention-body {
  margin-bottom: 1rem;
}

.mention-field {
  margin-bottom: 0.75rem;
}

.mention-field label {
  display: block;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.mention-field a {
  color: rgba(100, 150, 255, 0.9);
  text-decoration: none;
  word-break: break-all;
}

.mention-field a:hover {
  text-decoration: underline;
}

.mention-field span {
  color: rgba(255, 255, 255, 0.7);
  word-break: break-all;
}

.content-preview {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.mention-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.btn-approve,
.btn-reject {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-approve {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.btn-approve:hover {
  background: rgba(74, 222, 128, 0.3);
}

.btn-reject {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
}

.btn-reject:hover {
  background: rgba(248, 113, 113, 0.3);
}

.back-link {
  margin-top: 3rem;
  text-align: center;
}

.back-link a {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.back-link a:hover {
  color: #fff;
}

@media (max-width: 600px) {
  .admin {
    padding: 5rem 1rem 2rem;
  }

  h1 {
    font-size: 1.75rem;
  }

  .stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .filter-tabs {
    flex-direction: column;
  }

  .mention-actions {
    flex-direction: column;
  }

  .btn-approve,
  .btn-reject {
    width: 100%;
  }
}
</style>

