/** Son court type "ding" pour nouvelle commande (Web Audio API, sans fichier). */
export function playNewOrderSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const beep = (freq: number, start: number, dur: number, gain = 0.18) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      g.gain.setValueAtTime(0.0001, start)
      g.gain.exponentialRampToValueAtTime(gain, start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + dur + 0.02)
    }

    const t0 = ctx.currentTime
    beep(880, t0, 0.12)
    beep(1174, t0 + 0.14, 0.16, 0.2)

    // Ferme le contexte après le son (évite fuite)
    window.setTimeout(() => {
      void ctx.close()
    }, 600)
  } catch {
    // navigateurs bloquant l'audio sans interaction
  }
}

/** Débloque l'audio après un clic utilisateur (politique navigateurs). */
let unlocked = false
export function unlockNotificationAudio() {
  if (unlocked) return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    void ctx.resume().then(() => {
      unlocked = true
      void ctx.close()
    })
  } catch {
    // ignore
  }
}
