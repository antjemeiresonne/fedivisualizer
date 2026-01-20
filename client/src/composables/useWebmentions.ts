import { ref, computed, readonly } from 'vue'

export interface Webmention {
  id: number
  source: string
  target: string
  verified: boolean
  approved: boolean
  timestamp: string
  content: string
}

const webmentions = ref<Webmention[]>([])
const loading = ref(false)
const isAuthenticated = ref(false)
const authError = ref('')
let eventSource: EventSource | null = null
let initialized = false
let connectionCount = 0
let adminToken: string | null = null

export function useWebmentions() {
  const approvedMentions = computed(() =>
    webmentions.value.filter(m => m.approved)
  )

  const pendingMentions = computed(() =>
    webmentions.value.filter(m => m.verified && !m.approved)
  )

  async function login(secret: string): Promise<boolean> {
    try {
      const response = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret })
      })

      if (response.ok) {
        adminToken = secret
        isAuthenticated.value = true
        authError.value = ''
        sessionStorage.setItem('adminToken', secret)
        return true
      } else {
        authError.value = 'Ongeldig wachtwoord'
        return false
      }
    } catch {
      authError.value = 'Verbindingsfout'
      return false
    }
  }

  function logout() {
    adminToken = null
    isAuthenticated.value = false
    sessionStorage.removeItem('adminToken')
  }

  function restoreSession() {
    const stored = sessionStorage.getItem('adminToken')
    if (stored) {
      adminToken = stored
      isAuthenticated.value = true
    }
  }

  function getAuthHeaders(): HeadersInit {
    return adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}
  }

  async function fetchMentions() {
    loading.value = true
    try {
      const response = await fetch('/mentions', {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        webmentions.value = data.mentions
      } else if (response.status === 401 || response.status === 403) {
        logout()
      }
    } catch (error) {
      console.error('Failed to fetch webmentions:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchApprovedMentions() {
    loading.value = true
    try {
      const response = await fetch('/mentions/approved')
      const data = await response.json()
      webmentions.value = data.mentions
    } catch (error) {
      console.error('Failed to fetch approved webmentions:', error)
    } finally {
      loading.value = false
    }
  }

  async function approveMention(id: number) {
    try {
      const response = await fetch(`/mentions/${id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const mention = webmentions.value.find(m => m.id === id)
        if (mention) mention.approved = true
      } else if (response.status === 401 || response.status === 403) {
        logout()
      }
    } catch (error) {
      console.error('Failed to approve webmention:', error)
    }
  }

  async function rejectMention(id: number) {
    try {
      const response = await fetch(`/mentions/${id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      if (response.ok) {
        webmentions.value = webmentions.value.filter(m => m.id !== id)
      } else if (response.status === 401 || response.status === 403) {
        logout()
      }
    } catch (error) {
      console.error('Failed to reject webmention:', error)
    }
  }

  interface SendWebmentionResult {
    success: boolean
    message?: string
    error?: string
  }

  async function sendWebmention(source: string, target: string): Promise<SendWebmentionResult> {
    try {
      const response = await fetch('/webmention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source, target })
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true, message: data.message }
      } else {
        return { success: false, error: data.error || 'Verificatie mislukt' }
      }
    } catch (error) {
      console.error('Failed to send webmention:', error)
      return { success: false, error: 'Netwerkfout, probeer het later opnieuw' }
    }
  }

  function connectSSE() {
    connectionCount++
    if (eventSource) return

    eventSource = new EventSource('/events')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'webmention' || data.type === 'webmention-pending') {
          const existingIndex = webmentions.value.findIndex(m => m.id === data.data.id)
          if (existingIndex >= 0) {
            webmentions.value[existingIndex] = data.data
          } else {
            webmentions.value.push(data.data)
          }
        }
      } catch (error) {
        console.error('Failed to parse SSE event:', error)
      }
    }

    eventSource.onerror = () => {
      console.error('SSE connection error, reconnecting...')
      eventSource?.close()
      eventSource = null
      if (connectionCount > 0) {
        setTimeout(connectSSE, 5000)
      }
    }
  }

  function disconnectSSE() {
    connectionCount--
    if (connectionCount <= 0 && eventSource) {
      eventSource.close()
      eventSource = null
      connectionCount = 0
    }
  }

  function init(requireAuth = false) {
    restoreSession()
    if (!initialized) {
      initialized = true
      if (requireAuth && isAuthenticated.value) {
        fetchMentions()
      } else if (!requireAuth) {
        fetchApprovedMentions()
      }
    }
    connectSSE()
  }

  return {
    webmentions: readonly(webmentions),
    approvedMentions,
    pendingMentions,
    loading: readonly(loading),
    isAuthenticated: readonly(isAuthenticated),
    authError: readonly(authError),
    init,
    disconnectSSE,
    login,
    logout,
    fetchMentions,
    fetchApprovedMentions,
    approveMention,
    rejectMention,
    sendWebmention
  }
}

