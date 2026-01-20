import * as THREE from 'three'
import { ref, type Ref } from 'vue'

interface ExtendedScene extends THREE.Scene {
  starsMaterial?: THREE.ShaderMaterial
  nebulaMaterials?: THREE.ShaderMaterial[]
}

export function useThreeScene(containerRef: Ref<HTMLDivElement | undefined>) {
  let scene: ExtendedScene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer

  const cameraRotation = { x: 0, y: 0 }
  let isDragging = false
  let previousMousePosition = { x: 0, y: 0 }
  const flashIntensity = ref(0)

  function init() {
    if (!containerRef.value) return null

    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 0)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.value.appendChild(renderer.domElement)

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('mouseleave', onMouseUp)
    renderer.domElement.addEventListener('wheel', onMouseWheel)
    renderer.domElement.addEventListener('touchstart', onTouchStart)
    renderer.domElement.addEventListener('touchmove', onTouchMove)
    renderer.domElement.addEventListener('touchend', onTouchEnd)

    createStarryBackground()
    createNebula()

    const ambientLight = new THREE.AmbientLight(0x222244, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x6666ff, 1, 100)
    pointLight.position.set(0, 0, 30)
    scene.add(pointLight)

    return { scene, camera, renderer }
  }

  function createStarryBackground() {
    const starsGeometry = new THREE.BufferGeometry()
    const starsCount = 3000
    const positions = new Float32Array(starsCount * 3)
    const colors = new Float32Array(starsCount * 3)
    const sizes = new Float32Array(starsCount)

    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 300
      positions[i3 + 1] = (Math.random() - 0.5) * 300
      positions[i3 + 2] = (Math.random() - 0.5) * 300 - 50

      const colorVariation = Math.random()
      if (colorVariation < 0.7) {
        colors[i3] = 0.8 + Math.random() * 0.2
        colors[i3 + 1] = 0.8 + Math.random() * 0.2
        colors[i3 + 2] = 1.0
      } else if (colorVariation < 0.9) {
        colors[i3] = 1.0
        colors[i3 + 1] = 0.9 + Math.random() * 0.1
        colors[i3 + 2] = 0.7 + Math.random() * 0.2
      } else {
        colors[i3] = 1.0
        colors[i3 + 1] = 0.6 + Math.random() * 0.3
        colors[i3 + 2] = 0.4 + Math.random() * 0.2
      }

      sizes[i] = Math.random() * 2 + 0.5
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const starsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: renderer.getPixelRatio() },
        flashIntensity: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vSize;
        uniform float time;
        uniform float pixelRatio;
        uniform float flashIntensity;

        void main() {
          vColor = color;
          vSize = size;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          float twinkle = sin(time * 2.0 + position.x * 10.0) * 0.3 + 0.7;
          float flashBoost = 1.0 + flashIntensity * 2.0;

          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z) * twinkle * flashBoost;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform float flashIntensity;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          vec3 flashColor = mix(vColor, vec3(1.0, 1.0, 1.0), flashIntensity * 0.7);
          float flashAlpha = alpha + flashIntensity * 0.5;

          gl_FragColor = vec4(flashColor, flashAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)

    scene.starsMaterial = starsMaterial
  }

  function createNebula() {
    const nebulaColors = [
      new THREE.Color(0x1a0a3e),
      new THREE.Color(0x0a1a2e),
      new THREE.Color(0x0e1a1a)
    ]

    nebulaColors.forEach((color, index) => {
      const geometry = new THREE.PlaneGeometry(400, 400)

      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: color },
          opacity: { value: 0.3 - index * 0.05 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 color;
          uniform float opacity;
          varying vec2 vUv;

          vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

          float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                               -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                    dot(x12.zw,x12.zw)), 0.0);
            m = m*m;
            m = m*m;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
          }

          void main() {
            vec2 uv = vUv * 3.0;
            float n = snoise(uv + time * 0.02);
            n += 0.5 * snoise(uv * 2.0 - time * 0.03);
            n += 0.25 * snoise(uv * 4.0 + time * 0.01);
            n = (n + 1.0) * 0.5;

            float alpha = n * opacity;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })

      const plane = new THREE.Mesh(geometry, material)
      plane.position.z = -100 - index * 20
      scene.add(plane)

      if (!scene.nebulaMaterials) {
        scene.nebulaMaterials = []
      }
      scene.nebulaMaterials.push(material)
    })
  }

  function onMouseDown(event: MouseEvent) {
    isDragging = true
    previousMousePosition = { x: event.clientX, y: event.clientY }
  }

  function onMouseMove(event: MouseEvent) {
    if (!isDragging) return

    const deltaX = event.clientX - previousMousePosition.x
    const deltaY = event.clientY - previousMousePosition.y

    cameraRotation.y += deltaX * 0.005
    cameraRotation.x -= deltaY * 0.005
    cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x))

    previousMousePosition = { x: event.clientX, y: event.clientY }
  }

  function onMouseUp() {
    isDragging = false
  }

  function onMouseWheel(event: WheelEvent) {
    event.preventDefault()
  }

  function onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      if (touch) {
        isDragging = true
        previousMousePosition = { x: touch.clientX, y: touch.clientY }
      }
    }
  }

  function onTouchMove(event: TouchEvent) {
    if (!isDragging || event.touches.length !== 1) return

    const touch = event.touches[0]
    if (!touch) return

    const deltaX = touch.clientX - previousMousePosition.x
    const deltaY = touch.clientY - previousMousePosition.y

    cameraRotation.y += deltaX * 0.005
    cameraRotation.x -= deltaY * 0.005
    cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x))

    previousMousePosition = { x: touch.clientX, y: touch.clientY }
  }

  function onTouchEnd() {
    isDragging = false
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  function updateCamera() {
    const lookX = Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x)
    const lookY = -Math.sin(cameraRotation.x)
    const lookZ = Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x)

    camera.position.set(0, 0, 0)
    camera.lookAt(lookX, lookY, lookZ)
  }

  function updateShaders(time: number) {
    if (scene.starsMaterial) {
      if (scene.starsMaterial.uniforms.time) {
        scene.starsMaterial.uniforms.time.value = time
      }
      if (scene.starsMaterial.uniforms.flashIntensity) {
        scene.starsMaterial.uniforms.flashIntensity.value = flashIntensity.value
      }
    }

    if (scene.nebulaMaterials) {
      scene.nebulaMaterials.forEach((mat: THREE.ShaderMaterial) => {
        if (mat.uniforms.time) {
          mat.uniforms.time.value = time
        }
      })
    }
  }

  function render() {
    renderer.render(scene, camera)
  }

  function dispose() {
    if (renderer) {
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('mouseleave', onMouseUp)
      renderer.domElement.removeEventListener('wheel', onMouseWheel)
      renderer.domElement.removeEventListener('touchstart', onTouchStart)
      renderer.domElement.removeEventListener('touchmove', onTouchMove)
      renderer.domElement.removeEventListener('touchend', onTouchEnd)
      renderer.dispose()
    }
  }

  function getScene() {
    return scene
  }

  function setFlashIntensity(value: number) {
    flashIntensity.value = value
  }

  function fadeFlash() {
    if (flashIntensity.value > 0) {
      flashIntensity.value = Math.max(0, flashIntensity.value - 0.02)
    }
  }

  return {
    init,
    updateCamera,
    updateShaders,
    render,
    dispose,
    onWindowResize,
    getScene,
    setFlashIntensity,
    fadeFlash,
    flashIntensity
  }
}

