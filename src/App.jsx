import { useState, useEffect, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import Fireworks from 'fireworks-js'

function getEnvConfig() {
  if (typeof window !== 'undefined' && window.APP_CONFIG) {
    const c = window.APP_CONFIG
    if (c.targetDate && c.targetTime && c.reason) {
      const dt = new Date(`${c.targetDate}T${c.targetTime}`)
      if (!isNaN(dt.getTime()) && dt > new Date()) {
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

  const fireConfetti = useCallback((level) => {
    const colors = level === 1
      ? ['#ffd700']
      : level === 2
        ? ['#ffd700', '#ff6b6b', '#ffa500']
        : ['#ffd700', '#ff6b6b', '#ffa500', '#ff1493', '#00ff7f', '#00bfff']

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
  }, [])

  useEffect(() => {
    if (!targetDate || isNaN(targetDate.getTime())) return

    const update = () => {
      const now = new Date()
      const diff = targetDate - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        setExpired(true)
        setCelebrationLevel(3)
        return
      }

      setExpired(false)

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })

      const newLevel = days <= 3 ? 3 : days <= 7 ? 2 : days <= 10 ? 1 : 0
      setCelebrationLevel(newLevel)

      if (prevDaysRef.current !== null) {
        const prev = prevDaysRef.current
        if (prev > 10 && days <= 10) fireConfetti(1)
        if (prev > 7 && days <= 7) fireConfetti(2)
        if (prev > 3 && days <= 3) fireConfetti(3)
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
    if (celebrationLevel >= 3 || expired) {
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
      if (!audioRef.current) {
        audioRef.current = new Audio('/The%20Final%20Countdown.mp3')
        audioRef.current.loop = true
      }
      if (!audioStartedRef.current) {
        setShowAudioPrompt(true)
      }
      if (containerRef.current && !fireworksRef.current) {
        fireworksRef.current = new Fireworks(containerRef.current, {
          particles: 36,
          explosion: 4,
          intensity: 2.4,
          opacity: 0.72,
          delay: { min: 16, max: 32 },
          hue: { min: 0, max: 360 },
          rocketsPoint: { min: 10, max: 90 },
          mouse: { click: false, move: false, max: 1 },
          traceLength: 2.4,
          traceSpeed: 6,
          flickering: 36,
          lineWidth: { explosion: { min: 1.2, max: 2.4 }, trace: { min: 0.6, max: 1.2 } },
          brightness: { min: 60, max: 96 },
          decay: { min: 0.012, max: 0.024 },
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
      if (!audioRef.current) {
        audioRef.current = new Audio('/The%20Final%20Countdown.mp3')
        audioRef.current.loop = true
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

      <div className="reason">{reason}</div>
    </div>
  )
}

export default App
