'use client'

import { useState, useEffect } from 'react'
import SearchBox from '@/components/SearchBox'

export default function HomePage() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' UTC'
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* === DOT GRID BACKGROUND === */}
      <div className="fixed inset-0 dot-grid z-0 opacity-40" />

      {/* === DECORATIVE BLURS === */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary-container/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-tertiary-container/5 rounded-full blur-[120px] pointer-events-none" />

      {/* === FIXED HEADER === */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 px-6 flex items-center justify-between bg-[#10131C]">
        <div className="flex items-center gap-3">
          <span className="text-primary-container font-black italic text-xl tracking-tight">
            SENTINEL
          </span>
          <span className="font-mono text-[10px] text-outline-variant tracking-widest uppercase">
            V2.0.4-BETA
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-primary font-bold uppercase tracking-tighter text-sm">
            BETA
          </span>
          <button className="text-outline-variant hover:text-primary transition-colors" aria-label="Settings">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
          <button className="text-outline-variant hover:text-primary transition-colors" aria-label="Notifications">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
        </div>
      </header>

      {/* Header separator */}
      <div className="fixed top-16 left-0 right-0 h-[2px] bg-[#181B25] z-50" />

      {/* === LEFT SIDEBAR (lg only) === */}
      <div className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 z-10 flex-col items-center gap-6">
        {/* Gradient line top */}
        <div className="w-px h-32 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

        {/* Vertical labels */}
        {['Intelligence', 'Agents', 'Threats'].map((label) => (
          <span
            key={label}
            className="vertical-text font-label text-[10px] tracking-[0.3em] uppercase text-outline-variant hover:text-primary transition-colors cursor-pointer select-none"
          >
            {label}
          </span>
        ))}

        {/* Gradient line bottom */}
        <div className="w-px h-32 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
      </div>

      {/* === MAIN CONTENT === */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="max-w-4xl w-full text-center">
          {/* Eyebrow */}
          <p className="font-label text-sm lg:text-lg text-primary tracking-[0.2em] uppercase font-semibold mb-4">
            Enterprise Intelligence
          </p>

          {/* Headline */}
          <h1 className="font-headline text-6xl lg:text-8xl font-extrabold text-on-surface tracking-tighter uppercase mb-12">
            SENTINEL
          </h1>

          {/* Search box */}
          <SearchBox />

          {/* Pill badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-surface-container-high/50 border border-outline-variant/10 px-4 py-2 backdrop-blur-sm rounded-lg">
              <span className="material-symbols-outlined text-primary text-lg">bolt</span>
              <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                90 SEC ANALYSIS
              </span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-high/50 border border-outline-variant/10 px-4 py-2 backdrop-blur-sm rounded-lg">
              <span className="material-symbols-outlined text-tertiary text-lg">psychology</span>
              <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                4 AI AGENTS
              </span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-high/50 border border-outline-variant/10 px-4 py-2 backdrop-blur-sm rounded-lg">
              <span className="material-symbols-outlined text-secondary text-lg">security</span>
              <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                LIVE WEB DATA
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* === FIXED FOOTER === */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 flex justify-between items-end p-6">
        {/* Left - System Status */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-sm animate-pulse" style={{ fontSize: '12px' }}>
              sensors
            </span>
            <span className="font-label text-[10px] tracking-[0.1em] uppercase font-semibold text-on-surface-variant">
              System Status: Optimal
            </span>
          </div>
          <span className="font-mono text-[10px] text-outline-variant">
            LATENCY: 14MS // UPTIME: 99.99%
          </span>
        </div>

        {/* Right - Clock */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline-variant text-sm" style={{ fontSize: '12px' }}>
              schedule
            </span>
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-on-surface-variant">
              {time}
            </span>
          </div>
          <span className="font-label text-[10px] tracking-widest uppercase text-outline-variant">
            Intelligence Protocol V2
          </span>
        </div>
      </footer>
    </div>
  )
}
