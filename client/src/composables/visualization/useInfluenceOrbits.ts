import { ref, onMounted, onUnmounted } from 'vue'

export interface Influencer {
  author: string
  avatar: string
  influence: number
  orbiters: string[]
}

export interface InfluenceGraph {
  nodes: Influencer[]
  edges: { from: string; to: string; strength: number }[]
}

export interface RdfStats {
  triples: number
  authors: number
  posts: number
}

const influencers = ref<Influencer[]>([])
const influenceGraph = ref<InfluenceGraph>({ nodes: [], edges: [] })
const stats = ref<RdfStats>({ triples: 0, authors: 0, posts: 0 })
const loading = ref(false)

let pollInterval: ReturnType<typeof setInterval> | null = null

export function useInfluenceOrbits() {
  async function fetchInfluencers(limit: number = 10): Promise<void> {
    try {
      const response = await fetch(`/rdf/influencers?limit=${limit}`)
      if (response.ok) {
        influencers.value = await response.json()
      }
    } catch (error) {
      console.error('Failed to fetch influencers:', error)
    }
  }

  async function fetchInfluenceGraph(): Promise<void> {
    loading.value = true
    try {
      const response = await fetch('/rdf/influence-graph')
      if (response.ok) {
        influenceGraph.value = await response.json()
      }
    } catch (error) {
      console.error('Failed to fetch influence graph:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchStats(): Promise<void> {
    try {
      const response = await fetch('/rdf/stats')
      if (response.ok) {
        stats.value = await response.json()
      }
    } catch (error) {
      console.error('Failed to fetch RDF stats:', error)
    }
  }

  async function executeSparql(query: string): Promise<unknown[]> {
    try {
      const response = await fetch(`/sparql?query=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        return data.results || []
      }
    } catch (error) {
      console.error('SPARQL query failed:', error)
    }
    return []
  }

  function startPolling(intervalMs: number = 10000): void {
    fetchInfluencers()
    fetchStats()

    pollInterval = setInterval(() => {
      fetchInfluencers()
      fetchStats()
    }, intervalMs)
  }

  function stopPolling(): void {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  onMounted(() => {
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    influencers,
    influenceGraph,
    stats,
    loading,
    fetchInfluencers,
    fetchInfluenceGraph,
    fetchStats,
    executeSparql,
    startPolling,
    stopPolling
  }
}

