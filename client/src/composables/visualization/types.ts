import * as THREE from 'three'

export interface PostData {
  id?: string
  content?: string
  author?: string
  favourites?: number
  reblogs?: number
  replies?: number
  tags?: string[]
  mentions?: string[]
  mediaAttachments?: number
  inReplyTo?: string | null
}

export interface Planet {
  mesh: THREE.Mesh
  glow: THREE.Mesh
  birthTime: number
  lifetime: number
  maxScale: number
  baseColor: THREE.Color
  postId?: string
  inReplyTo?: string | null
  tags?: string[]
  author?: string
}

export interface HashtagCluster {
  position: THREE.Vector3
  count: number
  lastUpdate: number
}

export interface Connection {
  line: THREE.Line
  fromId: string
  toId: string
  birthTime: number
}

export interface Comet {
  mesh: THREE.Mesh
  trail: THREE.Points
  sparks: THREE.Points
  startPos: THREE.Vector3
  endPos: THREE.Vector3
  birthTime: number
  lifetime: number
  progress: number
  glow?: THREE.Mesh
  light: THREE.PointLight
  sparkVelocities: Float32Array
}

export const SPAWN_RADIUS_MIN = 60
export const SPAWN_RADIUS_MAX = 120
export const PLANET_LIFETIME_MIN = 20000
export const PLANET_LIFETIME_MAX = 35000
export const MAX_PLANETS = 100

export const COLOR_PALETTE: THREE.Color[] = [
  new THREE.Color(0x6366f1), // default/new posts
  new THREE.Color(0x8b5cf6), // has tags
  new THREE.Color(0xec4899), // has mentions
  new THREE.Color(0xef4444), // has media
  new THREE.Color(0xf97316), // reply to another post
  new THREE.Color(0xeab308), // popular
  new THREE.Color(0x22c55e), // reblogged
  new THREE.Color(0x14b8a6), // long content
  new THREE.Color(0x06b6d4), // short content
  new THREE.Color(0x3b82f6), // project hashtag
]

export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3
  return t === 0
    ? 0
    : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

export function easeInQuad(t: number): number {
  return t * t
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export function getColorFromData(data: PostData, type: string): THREE.Color {
  if (type === 'project_hashtag') {
    return COLOR_PALETTE[9]!.clone()
  }

  if ((data.favourites && data.favourites > 5) || (data.reblogs && data.reblogs > 2)) {
    return COLOR_PALETTE[5]!.clone()
  }
  if (data.reblogs && data.reblogs > 0) {
    return COLOR_PALETTE[6]!.clone()
  }
  if (data.mediaAttachments && data.mediaAttachments > 0) {
    return COLOR_PALETTE[3]!.clone()
  }
  if (data.inReplyTo) {
    return COLOR_PALETTE[4]!.clone()
  }
  if (data.mentions && data.mentions.length > 0) {
    return COLOR_PALETTE[2]!.clone()
  }
  if (data.tags && data.tags.length > 0) {
    return COLOR_PALETTE[1]!.clone()
  }
  if (data.content && data.content.length > 200) {
    return COLOR_PALETTE[7]!.clone()
  }
  if (data.content && data.content.length < 50) {
    return COLOR_PALETTE[8]!.clone()
  }

  return COLOR_PALETTE[0]!.clone()
}

