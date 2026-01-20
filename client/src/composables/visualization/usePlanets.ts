import * as THREE from 'three'
import {
  type Planet,
  type PostData,
  type HashtagCluster,
  type Connection,
  SPAWN_RADIUS_MIN,
  SPAWN_RADIUS_MAX,
  PLANET_LIFETIME_MIN,
  PLANET_LIFETIME_MAX,
  MAX_PLANETS,
  COLOR_PALETTE,
  getColorFromData,
  easeOutElastic,
  easeInQuad
} from './types'

export function usePlanets(getScene: () => THREE.Scene) {
  const planets: Planet[] = []
  const postToPlanet = new Map<string, Planet>()
  const hashtagClusters = new Map<string, HashtagCluster>()
  const connections: Connection[] = []
  let isVisible = true

  function createPlanet(contentLength: number, type: string, data?: PostData) {
    const scene = getScene()
    if (!scene) return

    const baseSize = Math.min(3, Math.max(0.5, contentLength / 100))

    let x: number, y: number, z: number

    if (data?.inReplyTo && postToPlanet.has(data.inReplyTo)) {
      const parentPlanet = postToPlanet.get(data.inReplyTo)!
      const parentPos = parentPlanet.mesh.position
      const offsetRadius = 8 + Math.random() * 5
      const offsetTheta = Math.random() * Math.PI * 2
      const offsetPhi = Math.random() * Math.PI
      x = parentPos.x + offsetRadius * Math.sin(offsetPhi) * Math.cos(offsetTheta)
      y = parentPos.y + offsetRadius * Math.sin(offsetPhi) * Math.sin(offsetTheta)
      z = parentPos.z + offsetRadius * Math.cos(offsetPhi)
    }
    else if (data?.tags && data.tags.length > 0) {
      const primaryTag = data.tags[0]!.toLowerCase()

      if (hashtagClusters.has(primaryTag)) {
        const cluster = hashtagClusters.get(primaryTag)!
        const offsetRadius = 10 + Math.random() * 8
        const offsetTheta = Math.random() * Math.PI * 2
        const offsetPhi = Math.acos(2 * Math.random() - 1)
        x = cluster.position.x + offsetRadius * Math.sin(offsetPhi) * Math.cos(offsetTheta)
        y = cluster.position.y + offsetRadius * Math.sin(offsetPhi) * Math.sin(offsetTheta)
        z = cluster.position.z + offsetRadius * Math.cos(offsetPhi)

        cluster.count++
        cluster.position.x = (cluster.position.x * (cluster.count - 1) + x) / cluster.count
        cluster.position.y = (cluster.position.y * (cluster.count - 1) + y) / cluster.count
        cluster.position.z = (cluster.position.z * (cluster.count - 1) + z) / cluster.count
        cluster.lastUpdate = performance.now()
      } else {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const radius = SPAWN_RADIUS_MIN + Math.random() * (SPAWN_RADIUS_MAX - SPAWN_RADIUS_MIN)
        x = radius * Math.sin(phi) * Math.cos(theta)
        y = radius * Math.sin(phi) * Math.sin(theta)
        z = radius * Math.cos(phi)

        hashtagClusters.set(primaryTag, {
          position: new THREE.Vector3(x, y, z),
          count: 1,
          lastUpdate: performance.now()
        })
      }
    }
    else {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = SPAWN_RADIUS_MIN + Math.random() * (SPAWN_RADIUS_MAX - SPAWN_RADIUS_MIN)
      x = radius * Math.sin(phi) * Math.cos(theta)
      y = radius * Math.sin(phi) * Math.sin(theta)
      z = radius * Math.cos(phi)
    }

    const color = data ? getColorFromData(data, type) : COLOR_PALETTE[0]!.clone()

    const geometry = new THREE.SphereGeometry(1, 32, 32)
    const material = new THREE.ShaderMaterial({
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

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.scale.setScalar(0.01)

    const glowGeometry = new THREE.SphereGeometry(1.5, 32, 32)
    const glowMaterial = new THREE.ShaderMaterial({
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

    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.position.copy(mesh.position)
    glow.scale.setScalar(0.01)

    mesh.visible = isVisible
    glow.visible = isVisible

    scene.add(mesh)
    scene.add(glow)

    const planet: Planet = {
      mesh,
      glow,
      birthTime: performance.now(),
      lifetime: PLANET_LIFETIME_MIN + Math.random() * (PLANET_LIFETIME_MAX - PLANET_LIFETIME_MIN),
      maxScale: baseSize,
      baseColor: color,
      postId: data?.id,
      inReplyTo: data?.inReplyTo,
      tags: data?.tags,
      author: data?.author
    }

    planets.push(planet)

    if (data?.id) {
      postToPlanet.set(data.id, planet)
    }

    if (data?.inReplyTo && postToPlanet.has(data.inReplyTo)) {
      createConnectionLine(data.id!, data.inReplyTo, mesh.position, postToPlanet.get(data.inReplyTo)!.mesh.position, color)
    }

    if (planets.length > MAX_PLANETS) {
      const oldPlanet = planets.shift()!
      removePlanet(oldPlanet)
    }
  }

  function createConnectionLine(fromId: string, toId: string, fromPos: THREE.Vector3, toPos: THREE.Vector3, color: THREE.Color) {
    const scene = getScene()
    if (!scene) return

    const points = [fromPos.clone(), toPos.clone()]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)

    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    })

    const line = new THREE.Line(geometry, material)
    line.visible = isVisible
    scene.add(line)

    connections.push({
      line,
      fromId,
      toId,
      birthTime: performance.now()
    })
  }

  function removePlanet(planet: Planet) {
    const scene = getScene()
    if (!scene) return

    scene.remove(planet.mesh)
    scene.remove(planet.glow)
    planet.mesh.geometry.dispose()
    ;(planet.mesh.material as THREE.Material).dispose()
    planet.glow.geometry.dispose()
    ;(planet.glow.material as THREE.Material).dispose()

    if (planet.postId) {
      postToPlanet.delete(planet.postId)
    }
  }

  function updatePlanets(time: number) {
    const now = performance.now()

    for (let i = planets.length - 1; i >= 0; i--) {
      const planet = planets[i]
      if (!planet) continue

      const age = now - planet.birthTime
      const lifeProgress = age / planet.lifetime

      if (lifeProgress >= 1) {
        removePlanet(planet)
        planets.splice(i, 1)
        continue
      }

      let scale: number
      const growDuration = 0.15
      const shrinkStart = 0.7

      if (lifeProgress < growDuration) {
        const t = lifeProgress / growDuration
        scale = planet.maxScale * easeOutElastic(t)
      } else if (lifeProgress > shrinkStart) {
        const t = (lifeProgress - shrinkStart) / (1 - shrinkStart)
        scale = planet.maxScale * (1 - easeInQuad(t))
      } else {
        const pulse = Math.sin(time * 2 + planet.birthTime * 0.001) * 0.05 + 1
        scale = planet.maxScale * pulse
      }

      planet.mesh.scale.setScalar(Math.max(0.01, scale))
      planet.glow.scale.setScalar(Math.max(0.01, scale * 1.5))

      const meshMaterial = planet.mesh.material as THREE.ShaderMaterial
      if (meshMaterial.uniforms.time) {
        meshMaterial.uniforms.time.value = time
      }

      if (lifeProgress > shrinkStart) {
        const fadeT = (lifeProgress - shrinkStart) / (1 - shrinkStart)
        if (meshMaterial.uniforms.glowIntensity) {
          meshMaterial.uniforms.glowIntensity.value = 1 - fadeT
        }
        const glowMaterial = planet.glow.material as THREE.ShaderMaterial
        if (glowMaterial.uniforms.glowIntensity) {
          glowMaterial.uniforms.glowIntensity.value = 1 - fadeT
        }
      }

      planet.mesh.rotation.y += 0.005
      planet.mesh.rotation.x += 0.002
    }
  }

  function updateConnections() {
    const scene = getScene()
    if (!scene) return

    const now = performance.now()

    for (let i = connections.length - 1; i >= 0; i--) {
      const conn = connections[i]
      if (!conn) continue

      const fromPlanet = postToPlanet.get(conn.fromId)
      const toPlanet = postToPlanet.get(conn.toId)

      if (!fromPlanet || !toPlanet) {
        scene.remove(conn.line)
        conn.line.geometry.dispose()
        ;(conn.line.material as THREE.Material).dispose()
        connections.splice(i, 1)
        continue
      }

      const positions = conn.line.geometry.attributes.position
      if (positions) {
        positions.setXYZ(0, fromPlanet.mesh.position.x, fromPlanet.mesh.position.y, fromPlanet.mesh.position.z)
        positions.setXYZ(1, toPlanet.mesh.position.x, toPlanet.mesh.position.y, toPlanet.mesh.position.z)
        positions.needsUpdate = true
      }

      const fromAge = (now - fromPlanet.birthTime) / fromPlanet.lifetime
      const toAge = (now - toPlanet.birthTime) / toPlanet.lifetime
      const maxAge = Math.max(fromAge, toAge)

      if (maxAge > 0.7) {
        const fadeT = (maxAge - 0.7) / 0.3
        ;(conn.line.material as THREE.LineBasicMaterial).opacity = 0.6 * (1 - fadeT)
      }
    }
  }

  function setVisible(visible: boolean) {
    isVisible = visible
    planets.forEach(planet => {
      planet.mesh.visible = visible
      planet.glow.visible = visible
    })
    connections.forEach(conn => {
      conn.line.visible = visible
    })
  }

  function dispose() {
    const scene = getScene()
    if (!scene) return

    planets.forEach(planet => {
      planet.mesh.geometry.dispose()
      ;(planet.mesh.material as THREE.Material).dispose()
      planet.glow.geometry.dispose()
      ;(planet.glow.material as THREE.Material).dispose()
    })

    connections.forEach(conn => {
      conn.line.geometry.dispose()
      ;(conn.line.material as THREE.Material).dispose()
    })
  }

  return {
    createPlanet,
    updatePlanets,
    updateConnections,
    setVisible,
    dispose,
    planets,
    postToPlanet
  }
}

