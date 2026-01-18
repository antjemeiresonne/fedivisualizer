import { ref } from 'vue'

export function useSounds() {
  const audioContext = ref<AudioContext | null>(null)
  const enabled = ref(false)
  const initialized = ref(false)
  let stopAmbient: (() => void) | null = null

  function initAudio() {
    if (!audioContext.value) {
      audioContext.value = new AudioContext()
      initialized.value = true
    }
    if (audioContext.value.state === 'suspended') {
      audioContext.value.resume()
    }
  }

  function playTone(
    frequency: number,
    duration: number = 0.3,
    volume: number = 0.1,
    type: OscillatorType = 'sine'
  ) {
    if (!enabled.value || !audioContext.value) return

    const oscillator = audioContext.value.createOscillator()
    const gainNode = audioContext.value.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.value.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type

    gainNode.gain.setValueAtTime(volume, audioContext.value.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.value.currentTime + duration)

    oscillator.start()
    oscillator.stop(audioContext.value.currentTime + duration)
  }

  function playComet() {
    if (!enabled.value || !audioContext.value) return

    const now = audioContext.value.currentTime

    const whoosh = audioContext.value.createOscillator()
    const whooshGain = audioContext.value.createGain()
    whoosh.connect(whooshGain)
    whooshGain.connect(audioContext.value.destination)

    whoosh.type = 'sawtooth'
    whoosh.frequency.setValueAtTime(1200, now)
    whoosh.frequency.exponentialRampToValueAtTime(200, now + 0.8)

    whooshGain.gain.setValueAtTime(0.08, now)
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 1)

    whoosh.start(now)
    whoosh.stop(now + 1)

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        playTone(1500 + Math.random() * 1000, 0.15, 0.03, 'sine')
      }, i * 80 + Math.random() * 50)
    }
  }

  function playPlanetSpawn(colorIndex: number) {
    if (!enabled.value || !audioContext.value) return

    const frequencies = [
      440,  // Indigo - default
      466,  // Violet - tags
      494,  // Pink - mentions
      523,  // Red - media
      554,  // Orange - reply
      587,  // Yellow - popular
      622,  // Green - reblogged
      659,  // Teal - long
      698,  // Cyan - short
      740,  // Blue - hashtag
    ]

    const freq = frequencies[colorIndex] || 440
    playTone(freq, 0.4, 0.02, 'sine')

    setTimeout(() => {
      playTone(freq * 1.5, 0.2, 0.01, 'sine')
    }, 50)
  }

  function playConnection() {
    if (!enabled.value || !audioContext.value) return

    const now = audioContext.value.currentTime

    const osc = audioContext.value.createOscillator()
    const gain = audioContext.value.createGain()

    osc.connect(gain)
    gain.connect(audioContext.value.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.1)

    gain.gain.setValueAtTime(0.03, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc.start(now)
    osc.stop(now + 0.15)
  }

  function playAmbient(): (() => void) | null {
    if (!audioContext.value || !enabled.value) return null

    const ctx = audioContext.value
    const now = ctx.currentTime

    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0, now)
    masterGain.gain.linearRampToValueAtTime(0.2, now + 6)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 180
    filter.Q.value = 0.6

    masterGain.connect(filter)
    filter.connect(ctx.destination)

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()

    osc1.type = 'sine'
    osc2.type = 'sine'

    osc1.frequency.value = 48
    osc2.frequency.value = 50.2

    osc1.connect(masterGain)
    osc2.connect(masterGain)

    const drift = ctx.createOscillator()
    const driftGain = ctx.createGain()

    drift.type = 'sine'
    drift.frequency.value = 0.03
    driftGain.gain.value = 1.2

    drift.connect(driftGain)
    driftGain.connect(osc1.frequency)
    driftGain.connect(osc2.frequency)

    const breath = ctx.createOscillator()
    const breathGain = ctx.createGain()

    breath.type = 'sine'
    breath.frequency.value = 0.015
    breathGain.gain.value = 0.02

    breath.connect(breathGain)
    breathGain.connect(masterGain.gain)

    osc1.start(now)
    osc2.start(now)
    drift.start(now)
    breath.start(now)

    return () => {
      const stopTime = ctx.currentTime
      masterGain.gain.linearRampToValueAtTime(0.0001, stopTime + 5)

      setTimeout(() => {
        osc1.stop()
        osc2.stop()
        drift.stop()
        breath.stop()
      }, 5200)
    }
  }


  function toggle() {
    if (!enabled.value) {
      initAudio()
      enabled.value = true
      stopAmbient = playAmbient()
    } else {
      if (stopAmbient) {
        stopAmbient()
        stopAmbient = null
      }
      enabled.value = false
    }
  }

  function dispose() {
    if (stopAmbient) {
      stopAmbient()
      stopAmbient = null
    }
    if (audioContext.value) {
      audioContext.value.close()
      audioContext.value = null
    }
  }

  return {
    initAudio,
    playComet,
    playPlanetSpawn,
    playConnection,
    toggle,
    dispose,
    enabled,
    initialized
  }
}

