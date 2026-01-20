import $rdf from 'rdflib'

// Create the RDF store
const store = $rdf.graph()

// Namespaces
const RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
const AS = $rdf.Namespace('https://www.w3.org/ns/activitystreams#')
const SCHEMA = $rdf.Namespace('https://schema.org/')
const FEDI = $rdf.Namespace('https://fedivisualizer.local/ontology#')

// Track influence scores in memory for quick access
const influenceScores = new Map<string, number>()
const orbitRelations = new Map<string, Set<string>>() // author -> set of orbiters

interface ProcessedPost {
  id: string
  content: string
  author: string
  avatar: string
  createdAt: string
  favourites: number
  reblogs: number
  replies: number
  tags: string[]
  mentions: string[]
  mediaAttachments: number
  inReplyTo: string | null
  url: string
}

interface InfluenceData {
  author: string
  avatar: string
  influence: number
  orbiters: string[]
}

/**
 * Add a post to the RDF store
 */
export function addPostToStore(post: ProcessedPost): void {
  const postUri = $rdf.sym(`https://mastodon.social/posts/${post.id}`)
  const authorUri = $rdf.sym(`https://mastodon.social/users/${post.author}`)

  // Post type
  store.add(postUri, RDF('type'), AS('Note'))

  // Post properties
  store.add(postUri, AS('attributedTo'), authorUri)
  store.add(postUri, AS('content'), $rdf.lit(post.content))
  store.add(postUri, AS('published'), $rdf.lit(post.createdAt, undefined, $rdf.sym('http://www.w3.org/2001/XMLSchema#dateTime')))
  store.add(postUri, AS('url'), $rdf.sym(post.url))
  store.add(postUri, SCHEMA('dateCreated'), $rdf.lit(post.createdAt))

  // Engagement metrics as custom properties
  store.add(postUri, FEDI('favouritesCount'), $rdf.lit(post.favourites.toString(), undefined, $rdf.sym('http://www.w3.org/2001/XMLSchema#integer')))
  store.add(postUri, FEDI('reblogsCount'), $rdf.lit(post.reblogs.toString(), undefined, $rdf.sym('http://www.w3.org/2001/XMLSchema#integer')))
  store.add(postUri, FEDI('repliesCount'), $rdf.lit(post.replies.toString(), undefined, $rdf.sym('http://www.w3.org/2001/XMLSchema#integer')))

  // Author properties
  store.add(authorUri, RDF('type'), AS('Person'))
  store.add(authorUri, AS('preferredUsername'), $rdf.lit(post.author))
  store.add(authorUri, AS('icon'), $rdf.sym(post.avatar))

  // Tags
  post.tags.forEach(tag => {
    const tagUri = $rdf.sym(`https://mastodon.social/tags/${tag}`)
    store.add(postUri, AS('tag'), tagUri)
    store.add(tagUri, RDF('type'), AS('Hashtag'))
    store.add(tagUri, AS('name'), $rdf.lit(`#${tag}`))
  })

  // Mentions create orbit relationships
  post.mentions.forEach(mentionedUser => {
    const mentionedUri = $rdf.sym(`https://mastodon.social/users/${mentionedUser}`)
    store.add(postUri, AS('tag'), mentionedUri)
    store.add(mentionedUri, RDF('type'), AS('Mention'))

    // Create orbit relationship: author orbits around mentioned user
    store.add(authorUri, FEDI('orbits'), mentionedUri)

    // Track in memory
    if (!orbitRelations.has(mentionedUser)) {
      orbitRelations.set(mentionedUser, new Set())
    }
    orbitRelations.get(mentionedUser)!.add(post.author)
  })

  // Reply relationships
  if (post.inReplyTo) {
    const parentUri = $rdf.sym(`https://mastodon.social/posts/${post.inReplyTo}`)
    store.add(postUri, AS('inReplyTo'), parentUri)
  }

  // Update influence score (reblogs + favourites + replies)
  const influence = post.reblogs * 3 + post.favourites * 2 + post.replies
  const currentInfluence = influenceScores.get(post.author) || 0
  influenceScores.set(post.author, currentInfluence + influence)

  // Store influence in RDF
  store.removeMatches(authorUri, FEDI('influenceScore'), null)
  store.add(authorUri, FEDI('influenceScore'), $rdf.lit(
    (currentInfluence + influence).toString(),
    undefined,
    $rdf.sym('http://www.w3.org/2001/XMLSchema#integer')
  ))
}

/**
 * Record a reblog relationship (creates strong orbit)
 */
export function addReblogToStore(reblogger: string, originalAuthor: string, postId: string): void {
  const rebloggerUri = $rdf.sym(`https://mastodon.social/users/${reblogger}`)
  const originalAuthorUri = $rdf.sym(`https://mastodon.social/users/${originalAuthor}`)
  const postUri = $rdf.sym(`https://mastodon.social/posts/${postId}`)

  // Reblogger announces the post
  store.add(rebloggerUri, AS('Announce'), postUri)

  // Reblogger orbits the original author (strong gravitational pull)
  store.add(rebloggerUri, FEDI('orbits'), originalAuthorUri)
  store.add(rebloggerUri, FEDI('orbitStrength'), $rdf.lit('strong'))

  // Track orbit relationship
  if (!orbitRelations.has(originalAuthor)) {
    orbitRelations.set(originalAuthor, new Set())
  }
  orbitRelations.get(originalAuthor)!.add(reblogger)

  // Boost influence of original author
  const currentInfluence = influenceScores.get(originalAuthor) || 0
  influenceScores.set(originalAuthor, currentInfluence + 5)
}

/**
 * Execute a SPARQL query against the store
 */
export function executeSparqlQuery(queryString: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const query = $rdf.SPARQLToQuery(queryString, false, store)
      if (!query) {
        reject(new Error('Invalid SPARQL query'))
        return
      }

      const results: any[] = []
      store.query(query, (result: any) => {
        if (result) {
          results.push(result)
        }
      })

      resolve(results)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Get top influential authors for visualization
 */
export function getTopInfluencers(limit: number = 10): InfluenceData[] {
  const sorted = Array.from(influenceScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  return sorted.map(([author, influence]) => {
    // Get avatar from store
    const authorUri = $rdf.sym(`https://mastodon.social/users/${author}`)
    const avatarNode = store.any(authorUri, AS('icon'), null)
    const avatar = avatarNode ? avatarNode.value : ''

    // Get orbiters
    const orbiters = Array.from(orbitRelations.get(author) || [])

    return {
      author,
      avatar,
      influence,
      orbiters
    }
  })
}

/**
 * Get orbit data for a specific author using SPARQL
 */
export async function getAuthorOrbits(author: string): Promise<string[]> {
  const queryString = `
    PREFIX as: <https://www.w3.org/ns/activitystreams#>
    PREFIX fedi: <https://fedivisualizer.local/ontology#>
    
    SELECT ?orbiter WHERE {
      ?orbiterUri fedi:orbits <https://mastodon.social/users/${author}> .
      ?orbiterUri as:preferredUsername ?orbiter .
    }
  `

  try {
    const results = await executeSparqlQuery(queryString)
    return results.map(r => r['?orbiter']?.value || '').filter(Boolean)
  } catch {
    // Fallback to in-memory data
    return Array.from(orbitRelations.get(author) || [])
  }
}

/**
 * Get all influence relationships for visualization
 */
export function getInfluenceGraph(): { nodes: InfluenceData[], edges: { from: string, to: string, strength: number }[] } {
  const nodes = getTopInfluencers(20)
  const edges: { from: string, to: string, strength: number }[] = []

  // Build edges from orbit relationships
  orbitRelations.forEach((orbiters, influencer) => {
    orbiters.forEach(orbiter => {
      // Only include edges where both nodes are in top influencers
      const influencerInTop = nodes.some(n => n.author === influencer)
      const orbiterInfluence = influenceScores.get(orbiter) || 0

      if (influencerInTop && orbiterInfluence > 0) {
        edges.push({
          from: orbiter,
          to: influencer,
          strength: Math.min(orbiterInfluence / 10, 10)
        })
      }
    })
  })

  return { nodes, edges }
}

/**
 * Serialize store to Turtle format
 */
export function serializeToTurtle(): string {
  return $rdf.serialize(null, store, null, 'text/turtle') || ''
}

/**
 * Serialize store to JSON-LD format
 */
export function serializeToJsonLd(): string {
  return $rdf.serialize(null, store, null, 'application/ld+json') || ''
}

/**
 * Get store statistics
 */
export function getStoreStats(): { triples: number, authors: number, posts: number } {
  const triples = store.statements.length
  const authors = influenceScores.size

  // Count posts
  const postStatements = store.match(null, RDF('type'), AS('Note'))
  const posts = postStatements.length

  return { triples, authors, posts }
}

export { store, influenceScores, orbitRelations }

