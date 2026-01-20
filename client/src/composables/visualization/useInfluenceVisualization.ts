import * as THREE from 'three'
import { shallowRef } from 'vue'
import type { InfluencerPlanet, OrbitingUser } from './types'
import type { Influencer } from './useInfluenceOrbits'
import { easeOutElastic } from './types'

const influencerPlanets = shallowRef<InfluencerPlanet[]>([])
const orbitLines = shallowRef<THREE.Line[]>([])

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

const INFLUENCER_COLORS = [
  new THREE.Color(0xffd700), // Gold
  new THREE.Color(0xc0c0c0), // Silver
  new THREE.Color(0xcd7f32), // Bronze
  new THREE.Color(0x8b5cf6), // Purple
  new THREE.Color(0x6366f1), // Indigo
  new THREE.Color(0xec4899), // Pink
  new THREE.Color(0x22c55e), // Green
  new THREE.Color(0x06b6d4), // Cyan
]

export function useInfluenceVisualization(scene: THREE.Scene) {


  function createPlanetMaterial(color: THREE.Color): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: color },
        time: { value: 0 },
        glowIntensity: { value: 1.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        uniform float glowIntensity;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);

          vec3 coreColor = color * 1.2;
          vec3 edgeColor = color * 2.0;

          vec3 finalColor = mix(coreColor, edgeColor, fresnel);

          float noise = sin(vPosition.x * 10.0 + time) * sin(vPosition.y * 10.0 + time) * 0.1;
          finalColor += noise;

          float alpha = glowIntensity;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true
    })
  }

  function createGlowMaterial(color: THREE.Color): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: color },
        glowIntensity: { value: 1.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float glowIntensity;
        varying vec3 vNormal;

        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 glowColor = color * 1.5;
          gl_FragColor = vec4(glowColor, intensity * 0.5 * glowIntensity);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    })
  }

  function createOrbiterMaterial(color: THREE.Color): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: color },
        glowIntensity: { value: 1.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float glowIntensity;
        varying vec3 vNormal;

        void main() {
          float intensity = 0.8 + 0.2 * pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          gl_FragColor = vec4(color * intensity, glowIntensity);
        }
      `,
      transparent: true
    })
  }

  function createInfluencerPlanet(influencer: Influencer, index: number): InfluencerPlanet {
    const radius = 40 + Math.sqrt(index) * 20
    const angle = index * GOLDEN_ANGLE
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const y = (Math.random() - 0.5) * 30

    const position = new THREE.Vector3(x, y, z)

    const maxScale = Math.min(10, Math.max(3, Math.log2(influencer.influence + 1) * 1.5))
    const color = INFLUENCER_COLORS[index % INFLUENCER_COLORS.length]!.clone()

    const geometry = new THREE.SphereGeometry(1, 32, 32)
    const material = createPlanetMaterial(color)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.scale.setScalar(0.01)

    const glowGeometry = new THREE.SphereGeometry(1.5, 32, 32)
    const glowMaterial = createGlowMaterial(color)
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.position.copy(position)
    glow.scale.setScalar(0.01)

    const label = createTextSprite(influencer.author, color)
    label.position.copy(position)
    label.position.y += maxScale + 3
    label.scale.setScalar(0.01)

    scene.add(mesh)
    scene.add(glow)
    scene.add(label)

    const orbiters = createOrbiters(influencer, position, maxScale, color)

    if (orbiters.length > 0) {
      const orbitPath = createOrbitPath(position, maxScale * 2 + 5, color)
      scene.add(orbitPath)
      orbitLines.value.push(orbitPath)
    }

    return {
      mesh,
      glow,
      label,
      author: influencer.author,
      avatar: influencer.avatar,
      influence: influencer.influence,
      position,
      orbiters,
      birthTime: performance.now(),
      maxScale,
      targetScale: maxScale,
      currentScale: 0.01,
      baseColor: color,
      visible: true,
      removing: false,
    } as InfluencerPlanet & {
      birthTime: number;
      maxScale: number;
      targetScale: number;
      currentScale: number;
      baseColor: THREE.Color;
      visible: boolean;
      removing: boolean;
    }
  }

  function createOrbiters(influencer: Influencer, center: THREE.Vector3, parentSize: number, parentColor: THREE.Color): OrbitingUser[] {
    const orbiters: OrbitingUser[] = []
    const maxOrbiters = Math.min(influencer.orbiters.length, 8) // Limit for performance

    for (let i = 0; i < maxOrbiters; i++) {
      const orbiterName = influencer.orbiters[i]

      const layer = i % 3
      const orbitRadius = parentSize * 2 + 4 + layer * 4
      const orbitSpeed = 0.001 + (0.0005 * (3 - layer)) // Inner orbits faster
      const orbitAngle = (i / maxOrbiters) * Math.PI * 2
      const orbitTilt = (Math.random() - 0.5) * 0.3 // Slight tilt variation

      const geometry = new THREE.SphereGeometry(0.4, 16, 16)
      const orbiterColor = parentColor.clone().lerp(new THREE.Color(0xffffff), 0.5)
      const material = createOrbiterMaterial(orbiterColor)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.scale.setScalar(0.01)

      const initialX = center.x + Math.cos(orbitAngle) * orbitRadius
      const initialY = center.y + Math.sin(orbitAngle) * orbitTilt * orbitRadius
      const initialZ = center.z + Math.sin(orbitAngle) * orbitRadius
      mesh.position.set(initialX, initialY, initialZ)

      scene.add(mesh)

      orbiters.push({
        mesh,
        author: orbiterName,
        orbitRadius,
        orbitSpeed,
        orbitAngle,
        orbitTilt,
        parentInfluencer: influencer.author,
        birthTime: performance.now() + i * 100,
      } as OrbitingUser & { orbitTilt: number; birthTime: number })
    }

    return orbiters
  }

  function createOrbitPath(center: THREE.Vector3, radius: number, color: THREE.Color): THREE.Line {
    const points: THREE.Vector3[] = []
    const segments = 64

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(
        center.x + Math.cos(angle) * radius,
        center.y,
        center.z + Math.sin(angle) * radius
      ))
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: color.clone().multiplyScalar(0.5),
      transparent: true,
      opacity: 0.2,
    })

    return new THREE.Line(geometry, material)
  }

  function createTextSprite(text: string, color: THREE.Color): THREE.Sprite {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = 512
    canvas.height = 128

    context.fillStyle = 'rgba(0, 0, 0, 0)'
    context.fillRect(0, 0, canvas.width, canvas.height)

    context.shadowColor = `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`
    context.shadowBlur = 20

    context.font = 'Bold 36px Arial'
    context.fillStyle = 'rgba(255, 255, 255, 0.95)'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(text.substring(0, 20), canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(15, 3.75, 1)

    return sprite
  }

  function updateInfluencers(influencers: Influencer[]): void {
    const existingByAuthor = new Map<string, InfluencerPlanet>()

    influencerPlanets.value.forEach(planet => {
      existingByAuthor.set(planet.author, planet)
    })

    const newPlanets: InfluencerPlanet[] = []
    const authorsToKeep = new Set<string>()

    influencers.forEach((influencer, index) => {
      authorsToKeep.add(influencer.author)

      const existingPlanet = existingByAuthor.get(influencer.author)

      if (existingPlanet) {
        const extPlanet = existingPlanet as InfluencerPlanet & {
          targetScale: number;
          maxScale: number;
          baseColor: THREE.Color;
          visible: boolean;
        }

        extPlanet.targetScale = Math.min(10, Math.max(3, Math.log2(influencer.influence + 1) * 1.5))
        extPlanet.influence = influencer.influence

        updateOrbitersForPlanet(existingPlanet, influencer)

        newPlanets.push(existingPlanet)
      } else {
        const planet = createInfluencerPlanet(influencer, index)
        newPlanets.push(planet)
      }
    })

    influencerPlanets.value.forEach(planet => {
      if (!authorsToKeep.has(planet.author)) {
        const extPlanet = planet as InfluencerPlanet & {
          targetScale: number;
          removing: boolean;
        }
        extPlanet.targetScale = 0
        extPlanet.removing = true
        newPlanets.push(planet)
      }
    })

    influencerPlanets.value = newPlanets
  }

  function updateOrbitersForPlanet(planet: InfluencerPlanet, influencer: Influencer): void {
    const extPlanet = planet as InfluencerPlanet & { maxScale: number; baseColor: THREE.Color }
    const currentOrbiterCount = planet.orbiters.length
    const targetOrbiterCount = Math.min(influencer.orbiters.length, 8)

    if (targetOrbiterCount > currentOrbiterCount) {
      const color = extPlanet.baseColor || new THREE.Color(0xffd700)
      for (let i = currentOrbiterCount; i < targetOrbiterCount; i++) {
        const orbiterName = influencer.orbiters[i]
        const layer = i % 3
        const orbitRadius = (extPlanet.maxScale || 5) * 2 + 4 + layer * 4
        const orbitSpeed = 0.001 + (0.0005 * (3 - layer))
        const orbitAngle = (i / targetOrbiterCount) * Math.PI * 2
        const orbitTilt = (Math.random() - 0.5) * 0.3

        const geometry = new THREE.SphereGeometry(0.4, 16, 16)
        const orbiterColor = color.clone().lerp(new THREE.Color(0xffffff), 0.5)
        const material = createOrbiterMaterial(orbiterColor)
        const mesh = new THREE.Mesh(geometry, material)
        mesh.scale.setScalar(0.01) // Start small

        mesh.position.set(
          planet.position.x + Math.cos(orbitAngle) * orbitRadius,
          planet.position.y,
          planet.position.z + Math.sin(orbitAngle) * orbitRadius
        )

        scene.add(mesh)

        planet.orbiters.push({
          mesh,
          author: orbiterName,
          orbitRadius,
          orbitSpeed,
          orbitAngle,
          orbitTilt,
          parentInfluencer: influencer.author,
          birthTime: performance.now(),
        } as OrbitingUser & { orbitTilt: number; birthTime: number })
      }
    }
    else if (targetOrbiterCount < currentOrbiterCount) {
      for (let i = currentOrbiterCount - 1; i >= targetOrbiterCount; i--) {
        const orbiter = planet.orbiters[i]
        if (orbiter) {
          const extOrbiter = orbiter as OrbitingUser & { removing: boolean }
          extOrbiter.removing = true
        }
      }
    }
  }

  function animateOrbits(time: number): void {
    const now = performance.now()
    const planetsToRemove: InfluencerPlanet[] = []

    influencerPlanets.value.forEach(planet => {
      const extPlanet = planet as InfluencerPlanet & {
        birthTime: number;
        maxScale: number;
        targetScale?: number;
        currentScale?: number;
        baseColor: THREE.Color;
        visible: boolean;
        removing?: boolean;
      }

      if (!extPlanet.visible) return

      const age = now - extPlanet.birthTime
      const growDuration = 1500
      const transitionSpeed = 0.05

      if (extPlanet.currentScale === undefined) {
        extPlanet.currentScale = 0.01
      }

      let targetScale: number
      if (extPlanet.removing) {
        targetScale = 0
      } else if (extPlanet.targetScale !== undefined) {
        targetScale = extPlanet.targetScale
      } else {
        targetScale = extPlanet.maxScale
      }

      let scale: number
      if (age < growDuration && !extPlanet.targetScale) {
        const t = age / growDuration
        scale = targetScale * easeOutElastic(Math.min(t, 1))
        extPlanet.currentScale = scale
      } else {
        const diff = targetScale - extPlanet.currentScale
        if (Math.abs(diff) > 0.01) {
          extPlanet.currentScale += diff * transitionSpeed
        } else {
          extPlanet.currentScale = targetScale
        }

        const pulse = Math.sin(time * 2 + extPlanet.birthTime * 0.001) * 0.05 + 1
        scale = extPlanet.currentScale * pulse
      }

      if (extPlanet.removing && extPlanet.currentScale < 0.05) {
        planetsToRemove.push(planet)
        return
      }

      if (extPlanet.targetScale !== undefined) {
        extPlanet.maxScale = extPlanet.targetScale
      }

      planet.mesh.scale.setScalar(Math.max(0.01, scale))
      planet.glow.scale.setScalar(Math.max(0.01, scale * 1.5))

      if (planet.label) {
        const labelOpacity = extPlanet.removing ? extPlanet.currentScale / extPlanet.maxScale : 1
        const labelScale = Math.max(0.01, extPlanet.currentScale / (extPlanet.maxScale || 1))
        planet.label.scale.set(15 * labelScale, 3.75 * labelScale, 1)
        planet.label.position.y = planet.position.y + scale + 3
        ;(planet.label.material as THREE.SpriteMaterial).opacity = labelOpacity
      }

      const meshMaterial = planet.mesh.material as THREE.ShaderMaterial
      if (meshMaterial.uniforms?.time) {
        meshMaterial.uniforms.time.value = time
      }

      planet.mesh.rotation.y += 0.003
      planet.mesh.rotation.x += 0.001

      const orbitersToRemove: number[] = []
      planet.orbiters.forEach((orbiter, orbiterIndex) => {
        const extOrbiter = orbiter as OrbitingUser & {
          orbitTilt: number;
          birthTime: number;
          removing?: boolean;
          currentScale?: number;
        }

        const orbiterAge = now - extOrbiter.birthTime

        if (extOrbiter.currentScale === undefined) {
          extOrbiter.currentScale = 0.01
        }

        const orbiterTargetScale = extOrbiter.removing ? 0 : 1

        let orbiterScale: number
        if (orbiterAge < 1000 && !extOrbiter.removing) {
          orbiterScale = easeOutElastic(Math.min(orbiterAge / 1000, 1))
          extOrbiter.currentScale = orbiterScale
        } else {
          const diff = orbiterTargetScale - extOrbiter.currentScale
          if (Math.abs(diff) > 0.01) {
            extOrbiter.currentScale += diff * 0.1
          } else {
            extOrbiter.currentScale = orbiterTargetScale
          }
          orbiterScale = extOrbiter.currentScale
        }

        if (extOrbiter.removing && extOrbiter.currentScale < 0.05) {
          orbitersToRemove.push(orbiterIndex)
        }

        orbiter.mesh.scale.setScalar(Math.max(0.01, orbiterScale))

        orbiter.orbitAngle += orbiter.orbitSpeed * 16

        const dynamicOrbitRadius = (extPlanet.currentScale || extPlanet.maxScale) * 2 + 4 + (orbiterIndex % 3) * 4

        const tilt = extOrbiter.orbitTilt || 0
        orbiter.mesh.position.x = planet.position.x + Math.cos(orbiter.orbitAngle) * dynamicOrbitRadius
        orbiter.mesh.position.z = planet.position.z + Math.sin(orbiter.orbitAngle) * dynamicOrbitRadius
        orbiter.mesh.position.y = planet.position.y + Math.sin(orbiter.orbitAngle * 2) * tilt * dynamicOrbitRadius * 0.3
      })

      orbitersToRemove.reverse().forEach(index => {
        const orbiter = planet.orbiters[index]
        if (orbiter) {
          scene.remove(orbiter.mesh)
          orbiter.mesh.geometry.dispose()
          ;(orbiter.mesh.material as THREE.Material).dispose()
          planet.orbiters.splice(index, 1)
        }
      })
    })

    planetsToRemove.forEach(planet => {
      removePlanetFromScene(planet)
      const index = influencerPlanets.value.indexOf(planet)
      if (index > -1) {
        influencerPlanets.value.splice(index, 1)
      }
    })
  }

  function removePlanetFromScene(planet: InfluencerPlanet): void {
    scene.remove(planet.mesh)
    scene.remove(planet.glow)
    if (planet.label) scene.remove(planet.label)

    planet.orbiters.forEach(orbiter => {
      scene.remove(orbiter.mesh)
      orbiter.mesh.geometry.dispose()
      ;(orbiter.mesh.material as THREE.Material).dispose()
    })

    planet.mesh.geometry.dispose()
    ;(planet.mesh.material as THREE.Material).dispose()
    planet.glow.geometry.dispose()
    ;(planet.glow.material as THREE.Material).dispose()
    if (planet.label) {
      ;(planet.label.material as THREE.SpriteMaterial).map?.dispose()
      ;(planet.label.material as THREE.Material).dispose()
    }
  }

  function setVisible(visible: boolean): void {
    influencerPlanets.value.forEach(planet => {
      const extPlanet = planet as InfluencerPlanet & { visible: boolean }
      extPlanet.visible = visible
      planet.mesh.visible = visible
      planet.glow.visible = visible
      if (planet.label) planet.label.visible = visible
      planet.orbiters.forEach(orbiter => {
        orbiter.mesh.visible = visible
      })
    })
    orbitLines.value.forEach(line => {
      line.visible = visible
    })
  }

  function clearInfluencers(): void {
    influencerPlanets.value.forEach(planet => {
      scene.remove(planet.mesh)
      scene.remove(planet.glow)
      if (planet.label) scene.remove(planet.label)

      planet.orbiters.forEach(orbiter => {
        scene.remove(orbiter.mesh)
        orbiter.mesh.geometry.dispose()
        ;(orbiter.mesh.material as THREE.Material).dispose()
      })

      planet.mesh.geometry.dispose()
      ;(planet.mesh.material as THREE.Material).dispose()
      planet.glow.geometry.dispose()
      ;(planet.glow.material as THREE.Material).dispose()
      if (planet.label) {
        ;(planet.label.material as THREE.SpriteMaterial).map?.dispose()
        ;(planet.label.material as THREE.Material).dispose()
      }
    })

    orbitLines.value.forEach(line => {
      scene.remove(line)
      line.geometry.dispose()
      ;(line.material as THREE.Material).dispose()
    })

    influencerPlanets.value = []
    orbitLines.value = []
  }

  return {
    influencerPlanets,
    updateInfluencers,
    animateOrbits,
    setVisible,
    clearInfluencers,
  }
}

