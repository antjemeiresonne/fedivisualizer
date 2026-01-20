import * as THREE from 'three'
import { type Comet, easeInOutQuad } from './types'

export function useComets(getScene: () => THREE.Scene, setFlashIntensity: (value: number) => void) {
  const comets: Comet[] = []
  let isVisible = true

  function createComet() {
    const scene = getScene()
    if (!scene) return

    const cometDistance = 40
    const yOffset = (Math.random() - 0.5) * 30

    const startPos = new THREE.Vector3(-80, yOffset + 20, -cometDistance)
    const endPos = new THREE.Vector3(80, yOffset - 10, -cometDistance - 20)

    const cometGeometry = new THREE.SphereGeometry(4, 16, 16)
    const cometMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1
    })
    const cometMesh = new THREE.Mesh(cometGeometry, cometMaterial)
    cometMesh.position.copy(startPos)
    scene.add(cometMesh)

    const glowGeometry = new THREE.SphereGeometry(8, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    })
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    glowMesh.position.copy(startPos)
    scene.add(glowMesh)

    const trailCount = 250
    const trailPositions = new Float32Array(trailCount * 3)
    const trailColors = new Float32Array(trailCount * 3)
    const trailSizes = new Float32Array(trailCount)

    for (let i = 0; i < trailCount; i++) {
      const i3 = i * 3
      trailPositions[i3] = startPos.x
      trailPositions[i3 + 1] = startPos.y
      trailPositions[i3 + 2] = startPos.z

      const t = i / trailCount
      trailColors[i3] = 1 - t * 0.3
      trailColors[i3 + 1] = 1 - t * 0.5
      trailColors[i3 + 2] = 1

      trailSizes[i] = (1 - t) * 5 + 1
    }

    const trailGeometry = new THREE.BufferGeometry()
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
    trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3))
    trailGeometry.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1))

    const trailMaterial = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const trail = new THREE.Points(trailGeometry, trailMaterial)
    scene.add(trail)

    const sparksCount = 120
    const sparksPositions = new Float32Array(sparksCount * 3)
    const sparksColors = new Float32Array(sparksCount * 3)
    const sparksSizes = new Float32Array(sparksCount)
    const sparkVelocities = new Float32Array(sparksCount * 3)

    for (let i = 0; i < sparksCount; i++) {
      const i3 = i * 3
      sparksPositions[i3] = startPos.x
      sparksPositions[i3 + 1] = startPos.y
      sparksPositions[i3 + 2] = startPos.z

      sparksColors[i3] = 1.0
      sparksColors[i3 + 1] = 0.6 + Math.random() * 0.4
      sparksColors[i3 + 2] = 0.1 + Math.random() * 0.2

      sparksSizes[i] = Math.random() * 3 + 1.5

      sparkVelocities[i3] = (Math.random() - 0.5) * 0.8
      sparkVelocities[i3 + 1] = (Math.random() - 0.5) * 0.8
      sparkVelocities[i3 + 2] = (Math.random() - 0.5) * 0.5
    }

    const sparksGeometry = new THREE.BufferGeometry()
    sparksGeometry.setAttribute('position', new THREE.BufferAttribute(sparksPositions, 3))
    sparksGeometry.setAttribute('color', new THREE.BufferAttribute(sparksColors, 3))
    sparksGeometry.setAttribute('size', new THREE.BufferAttribute(sparksSizes, 1))

    const sparksMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const sparks = new THREE.Points(sparksGeometry, sparksMaterial)
    scene.add(sparks)

    const cometLight = new THREE.PointLight(0xaaccff, 3, 100, 1)
    cometLight.position.copy(startPos)
    scene.add(cometLight)

    setFlashIntensity(0.5)

    // Apply current visibility state to new comet
    cometMesh.visible = isVisible
    glowMesh.visible = isVisible
    trail.visible = isVisible
    sparks.visible = isVisible
    cometLight.visible = isVisible

    comets.push({
      mesh: cometMesh,
      trail,
      sparks,
      startPos,
      endPos,
      birthTime: performance.now(),
      lifetime: 4000,
      progress: 0,
      glow: glowMesh,
      light: cometLight,
      sparkVelocities
    })
  }

  function updateComets() {
    const scene = getScene()
    if (!scene) return

    const now = performance.now()

    for (let i = comets.length - 1; i >= 0; i--) {
      const comet = comets[i]
      if (!comet) continue

      const age = now - comet.birthTime
      comet.progress = age / comet.lifetime

      if (comet.progress >= 1) {
        scene.remove(comet.mesh)
        scene.remove(comet.trail)
        scene.remove(comet.sparks)
        scene.remove(comet.light)
        comet.mesh.geometry.dispose()
        ;(comet.mesh.material as THREE.Material).dispose()
        comet.trail.geometry.dispose()
        ;(comet.trail.material as THREE.Material).dispose()
        comet.sparks.geometry.dispose()
        ;(comet.sparks.material as THREE.Material).dispose()
        if (comet.glow) {
          scene.remove(comet.glow)
          comet.glow.geometry.dispose()
          ;(comet.glow.material as THREE.Material).dispose()
        }
        comets.splice(i, 1)
        continue
      }

      const easedProgress = easeInOutQuad(comet.progress)
      const currentPos = new THREE.Vector3().lerpVectors(comet.startPos, comet.endPos, easedProgress)
      comet.mesh.position.copy(currentPos)
      comet.light.position.copy(currentPos)

      if (comet.glow) {
        comet.glow.position.copy(currentPos)
      }

      const positions = comet.trail.geometry.attributes.position
      if (positions) {
        const trailCount = positions.count
        for (let j = 0; j < trailCount; j++) {
          const trailProgress = Math.max(0, easedProgress - (j / trailCount) * 0.6)
          const trailPos = new THREE.Vector3().lerpVectors(comet.startPos, comet.endPos, trailProgress)
          positions.setXYZ(j, trailPos.x, trailPos.y, trailPos.z)
        }
        positions.needsUpdate = true
      }

      const sparksPositions = comet.sparks.geometry.attributes.position
      if (sparksPositions) {
        const sparksCount = sparksPositions.count
        for (let j = 0; j < sparksCount; j++) {
          const j3 = j * 3
          const sparkBaseProgress = Math.max(0, easedProgress - (j / sparksCount) * 0.5)
          const basePos = new THREE.Vector3().lerpVectors(comet.startPos, comet.endPos, sparkBaseProgress)

          const sparkAge = comet.progress - (j / sparksCount) * 0.5
          const velocityScale = Math.max(0, sparkAge) * 50

          const x = basePos.x + comet.sparkVelocities[j3]! * velocityScale
          const y = basePos.y + comet.sparkVelocities[j3 + 1]! * velocityScale - sparkAge * 8
          const z = basePos.z + comet.sparkVelocities[j3 + 2]! * velocityScale

          sparksPositions.setXYZ(j, x, y, z)
        }
        sparksPositions.needsUpdate = true
      }

      if (comet.progress > 0.7) {
        const fadeT = (comet.progress - 0.7) / 0.3
        ;(comet.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - fadeT
        ;(comet.trail.material as THREE.PointsMaterial).opacity = 0.9 * (1 - fadeT)
        ;(comet.sparks.material as THREE.PointsMaterial).opacity = 0.9 * (1 - fadeT)
        comet.light.intensity = 3 * (1 - fadeT)
        if (comet.glow) {
          ;(comet.glow.material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - fadeT)
        }
      } else {
        const pulseT = Math.sin(comet.progress * Math.PI)
        comet.light.intensity = 2 + pulseT * 2
      }

      const scaleT = Math.sin(comet.progress * Math.PI)
      comet.mesh.scale.setScalar(0.5 + scaleT * 1.5)
      if (comet.glow) {
        comet.glow.scale.setScalar(0.5 + scaleT * 1.5)
      }
    }
  }

  function dispose() {
    const scene = getScene()
    if (!scene) return

    comets.forEach(comet => {
      scene.remove(comet.mesh)
      scene.remove(comet.trail)
      scene.remove(comet.sparks)
      scene.remove(comet.light)
      comet.mesh.geometry.dispose()
      ;(comet.mesh.material as THREE.Material).dispose()
      comet.trail.geometry.dispose()
      ;(comet.trail.material as THREE.Material).dispose()
      comet.sparks.geometry.dispose()
      ;(comet.sparks.material as THREE.Material).dispose()
      if (comet.glow) {
        scene.remove(comet.glow)
        comet.glow.geometry.dispose()
        ;(comet.glow.material as THREE.Material).dispose()
      }
    })
  }

  function setVisible(visible: boolean) {
    isVisible = visible // Store state for new comets
    comets.forEach(comet => {
      comet.mesh.visible = visible
      comet.trail.visible = visible
      comet.sparks.visible = visible
      comet.light.visible = visible
      if (comet.glow) comet.glow.visible = visible
    })
  }

  return {
    createComet,
    updateComets,
    setVisible,
    dispose
  }
}

