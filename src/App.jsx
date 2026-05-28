import { useState, useEffect, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import Fireworks from 'fireworks-js'

function getEnvConfig() {
  if (typeof window !== 'undefined' && window.APP_CONFIG) {
    const c = window.APP_CONFIG
    if (c.targetDate && c.targetTime && c.reason) {
      const dt = new Date(`${c.targetDate}T${c.targetTime}`)
      if (!isNaN(dt.getTime())) {
        return { targetDate: dt, reason: c.reason }
      }
    }
  }
  return null
}

function App() {
  const envConfig = getEnvConfig()

  const [targetDate, setTargetDate] = useState(() => {
    if (envConfig) return envConfig.targetDate
    try {
      const saved = localStorage.getItem('countdown-target')
      return saved ? new Date(saved) : null
    } catch {
      return null
    }
  })
  const [reason, setReason] = useState(() => {
    if (envConfig) return envConfig.reason
    try {
      return localStorage.getItem('countdown-reason') || ''
    } catch {
      return ''
    }
  })

  const env = !envConfig && window.APP_CONFIG ? window.APP_CONFIG : null
  const [dateInput, setDateInput] = useState(env?.targetDate || '')
  const [timeInput, setTimeInput] = useState(env?.targetTime || '')
  const [reasonInput, setReasonInput] = useState(env?.reason || '')
  const [timeLeft, setTimeLeft] = useState(null)
  const [showConfig, setShowConfig] = useState(!targetDate || isNaN(targetDate.getTime()))
  const [celebrationLevel, setCelebrationLevel] = useState(0)
  const [expired, setExpired] = useState(false)
  const prevDaysRef = useRef(null)
  const audioRef = useRef(null)
  const audioStartedRef = useRef(false)
  const [showAudioPrompt, setShowAudioPrompt] = useState(false)
  const fireworksRef = useRef(null)
  const containerRef = useRef(null)
  const currentSongRef = useRef(null)

  const fireConfetti = useCallback((level) => {
    const colors = level === 1
      ? ['#ffd700']
      : level === 2
        ? ['#ffd700', '#ff6b6b', '#ffa500']
        : level === 3
          ? ['#ffd700', '#ff6b6b', '#ffa500', '#ff1493', '#00ff7f', '#00bfff']
          : ['#00bfff', '#87ceeb', '#4fc3f7', '#e0f7fa', '#ffd700', '#ff6b6b', '#ff1493', '#00ff7f']

    const defaults = {
      particleCount: 30 + level * 30,
      spread: 50 + level * 20,
      origin: { y: 0.6 },
      colors,
    }

    confetti({ ...defaults })

    if (level >= 2) {
      setTimeout(() => confetti({ ...defaults, angle: 60, origin: { x: 0, y: 0.5 } }), 150)
      setTimeout(() => confetti({ ...defaults, angle: 120, origin: { x: 1, y: 0.5 } }), 150)
    }
    if (level >= 3) {
      setTimeout(() => confetti({ ...defaults, particleCount: 90, spread: 140, origin: { y: 0.3 } }), 300)
      setTimeout(() => confetti({ ...defaults, particleCount: 60, spread: 160, origin: { y: 0.5 } }), 600)
    }
    if (level >= 4) {
      setTimeout(() => confetti({ ...defaults, particleCount: 120, spread: 180, origin: { y: 0.2 } }), 100)
      setTimeout(() => confetti({ ...defaults, particleCount: 80, spread: 200, origin: { y: 0.4 } }), 400)
      setTimeout(() => confetti({ ...defaults, particleCount: 100, spread: 220, origin: { y: 0.7 } }), 700)
    }
  }, [])

  useEffect(() => {
    if (!targetDate || isNaN(targetDate.getTime())) return

    const update = () => {
      const now = new Date()
      const diff = targetDate - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        setExpired(true)
        setCelebrationLevel(4)
        return
      }

      setExpired(false)

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })

      const newLevel = days <= 0 ? 4 : days <= 3 ? 3 : days <= 7 ? 2 : days <= 10 ? 1 : 0
      setCelebrationLevel(newLevel)

      if (prevDaysRef.current !== null) {
        const prev = prevDaysRef.current
        if (prev > 10 && days <= 10) fireConfetti(1)
        if (prev > 7 && days <= 7) fireConfetti(2)
        if (prev > 3 && days <= 3) fireConfetti(3)
        if (prev > 0 && days <= 0) fireConfetti(4)
      }
      prevDaysRef.current = days
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [targetDate, fireConfetti])

  useEffect(() => {
    if (!timeLeft || celebrationLevel === 0) return
    const timer = setTimeout(() => fireConfetti(celebrationLevel), 600)
    prevDaysRef.current = timeLeft.days
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (celebrationLevel >= 4 || expired) {
      const id = setInterval(() => fireConfetti(4), 8000)
      return () => clearInterval(id)
    }
    if (celebrationLevel >= 3) {
      const id = setInterval(() => fireConfetti(3), 10000)
      return () => clearInterval(id)
    }
    if (celebrationLevel >= 2) {
      const id = setInterval(() => fireConfetti(2), 20000)
      return () => clearInterval(id)
    }
  }, [celebrationLevel, expired, fireConfetti])

  useEffect(() => {
    if (celebrationLevel >= 3) {
      const songPath = celebrationLevel >= 4
        ? '/Todo%20Tiene%20Su%20Final.mp3'
        : '/The%20Final%20Countdown.mp3'

      if (!audioRef.current) {
        audioRef.current = new Audio(songPath)
        audioRef.current.loop = true
        currentSongRef.current = songPath
      } else if (currentSongRef.current !== songPath) {
        const wasPlaying = !audioRef.current.paused
        audioRef.current.pause()
        audioRef.current.src = songPath
        audioRef.current.loop = true
        audioRef.current.load()
        if (wasPlaying) {
          audioRef.current.play().catch(() => {})
        }
        currentSongRef.current = songPath
      }

      if (!audioStartedRef.current) {
        setShowAudioPrompt(true)
      }
      if (containerRef.current && !fireworksRef.current) {
        const isLastDay = celebrationLevel >= 4
        fireworksRef.current = new Fireworks(containerRef.current, {
          particles: isLastDay ? 90 : 60,
          explosion: isLastDay ? 9 : 6,
          intensity: isLastDay ? 5 : 3.5,
          opacity: 0.85,
          delay: { min: isLastDay ? 8 : 14, max: isLastDay ? 22 : 28 },
          hue: { min: 180, max: 240 },
          rocketsPoint: { min: 10, max: 90 },
          mouse: { click: false, move: false, max: 1 },
          traceLength: isLastDay ? 5 : 3.5,
          traceSpeed: 5,
          flickering: isLastDay ? 70 : 50,
          lineWidth: { explosion: { min: 1.5, max: 3 }, trace: { min: 0.8, max: 1.5 } },
          brightness: { min: 70, max: 100 },
          decay: { min: isLastDay ? 0.006 : 0.008, max: isLastDay ? 0.012 : 0.016 },
        })
        fireworksRef.current.start()
      }
    } else {
      setShowAudioPrompt(false)
      if (fireworksRef.current) {
        fireworksRef.current.stop()
        fireworksRef.current = null
      }
    }

    return () => {
      if (fireworksRef.current) {
        fireworksRef.current.stop()
        fireworksRef.current = null
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [celebrationLevel])

  const handleAudioPromptClick = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {})
    }
    audioStartedRef.current = true
    setShowAudioPrompt(false)
  }

  const handleStart = () => {
    if (!dateInput || !timeInput || !reasonInput.trim()) return
    const dt = new Date(`${dateInput}T${timeInput}`)
    if (isNaN(dt.getTime()) || dt <= new Date()) return
    setTargetDate(dt)
    setReason(reasonInput)
    try {
      localStorage.setItem('countdown-target', dt.toISOString())
      localStorage.setItem('countdown-reason', reasonInput)
    } catch { /* ignore */ }
    setShowConfig(false)
    setExpired(false)
    prevDaysRef.current = null

    const now = new Date()
    const diff = dt - now
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (diff > 0 && days <= 3) {
      const songPath = days <= 0
        ? '/Todo%20Tiene%20Su%20Final.mp3'
        : '/The%20Final%20Countdown.mp3'
      if (!audioRef.current) {
        audioRef.current = new Audio(songPath)
        audioRef.current.loop = true
        currentSongRef.current = songPath
      }
      audioRef.current.play().catch(() => {})
      audioStartedRef.current = true
      setShowAudioPrompt(false)
    }
  }

  const handleReset = () => {
    setTargetDate(null)
    setReason('')
    setDateInput('')
    setTimeInput('')
    setReasonInput('')
    setShowConfig(true)
    setCelebrationLevel(0)
    setExpired(false)
    audioStartedRef.current = false
    try {
      localStorage.removeItem('countdown-target')
      localStorage.removeItem('countdown-reason')
    } catch { /* ignore */ }
  }

  const formatNumber = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0')

  if (showConfig) {
    return (
      <div className="config">
        <h1>Configurar Cuenta Regresiva</h1>
        <div className="config-group">
          <label>Fecha l&iacute;mite</label>
          <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
        </div>
        <div className="config-group">
          <label>Hora</label>
          <input type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} />
        </div>
        <div className="config-group">
          <label>Motivo</label>
          <input type="text" value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} placeholder="¿Qué estás esperando?" />
        </div>
        <button className="start-btn" onClick={handleStart} disabled={!dateInput || !timeInput || !reasonInput.trim()}>
          Iniciar
        </button>
      </div>
    )
  }

  if (!timeLeft) return null

  return (
    <div className={`app celebration-${celebrationLevel}${expired ? ' expired' : ''}`}>
      {(celebrationLevel >= 3) && (
        <div ref={containerRef} className="happiness-animation" />
      )}

      {showAudioPrompt && (
        <div className="audio-prompt" onClick={handleAudioPromptClick}>
          <p>🎵 Presiona en cualquier parte para activar la música</p>
        </div>
      )}

      {!envConfig && <button className="reset-btn" onClick={handleReset} title="Reiniciar">&times;</button>}

      <div className="countdown">
        <div className="time-unit">
          <span className="number">{formatNumber(timeLeft.days)}</span>
          <span className="label">D&Iacute;AS</span>
        </div>
        <span className="separator">:</span>
        <div className="time-unit">
          <span className="number">{formatNumber(timeLeft.hours)}</span>
          <span className="label">HORAS</span>
        </div>
        <span className="separator">:</span>
        <div className="time-unit">
          <span className="number">{formatNumber(timeLeft.minutes)}</span>
          <span className="label">MIN</span>
        </div>
        <span className="separator">:</span>
        <div className="time-unit">
          <span className="number">{formatNumber(timeLeft.seconds)}</span>
          <span className="label">SEG</span>
        </div>
      </div>

      <div className="reason">{expired ? 'Gracias por todo' : reason}</div>
    </div>
  )
}

export default App
